/**
 * Generic Tool Executor for Quiz MCP Server
 *
 * Implements the complete 7-step token consumption workflow ONCE,
 * eliminating 90% of boilerplate code across all tools.
 *
 * 7-Step Pattern:
 * 1. Generate action ID for idempotency
 * 2. Check user balance
 * 3a. Handle account deletion
 * 3b. Handle insufficient balance
 * 4. Execute business logic
 * 4.5. Security processing (sanitize + redact PII)
 * 5. Consume tokens with retry & idempotency
 * 6. Return structured response
 * 7. Error handling
 */

import { checkBalance, consumeTokensWithRetry } from "./tokenConsumption";
import { formatInsufficientTokensError, formatAccountDeletedError } from "./tokenUtils";
import { sanitizeOutput, redactPII } from "pilpat-mcp-security";
import { logger } from "./logger";
import { SECURITY_CONFIG } from "./constants";

/**
 * Execute a tool with automatic token consumption and security processing
 *
 * @template TInput - Tool input type
 * @template TOutput - Tool output type
 * @param params - Execution parameters
 * @returns MCP tool response with content and structuredContent
 */
export async function executeToolWithTokenConsumption<TInput, TOutput>(
    params: {
        /** Tool name for logging and error messages */
        toolName: string;
        /** Number of tokens to consume */
        toolCost: number;
        /** Authenticated user ID */
        userId: string;
        /** User email for error messages */
        userEmail: string;
        /** D1 database for token management */
        tokenDb: D1Database;
        /** Tool input parameters */
        inputs: TInput & Record<string, any>;
        /** Business logic function to execute */
        execute: (inputs: TInput) => Promise<TOutput>;
    }
): Promise<{ content: any[]; structuredContent?: TOutput; isError?: boolean }> {
    const { toolName, toolCost, userId, userEmail, tokenDb, inputs, execute } = params;

    // Step 1: Generate action ID for idempotency
    const actionId = crypto.randomUUID();

    try {
        // Step 2: Check balance
        const balanceCheck = await checkBalance(tokenDb, userId, toolCost);

        // Step 3a: Handle account deletion
        if (balanceCheck.userDeleted) {
            logger.warn({
                event: "tool_failed",
                tool: toolName,
                user_id: userId,
                error: "User account deleted"
            });
            return {
                content: [{
                    type: "text",
                    text: formatAccountDeletedError(userEmail)
                }],
                isError: true
            };
        }

        // Step 3b: Handle insufficient balance
        if (!balanceCheck.sufficient) {
            logger.warn({
                event: "balance_check",
                user_id: userId,
                required_tokens: toolCost,
                current_balance: balanceCheck.currentBalance,
                sufficient: false
            });
            return {
                content: [{
                    type: "text",
                    text: formatInsufficientTokensError(toolName, balanceCheck.currentBalance, toolCost)
                }],
                isError: true
            };
        }

        // Step 4: Execute business logic
        const result = await execute(inputs);

        // Step 4.5: Security processing (sanitize + redact PII)
        const sanitized = sanitizeOutput(JSON.stringify(result, null, 2), {
            removeHtml: true,
            removeControlChars: true,
            normalizeWhitespace: true,
            maxLength: SECURITY_CONFIG.MAX_OUTPUT_LENGTH
        });

        const { redacted, detectedPII } = redactPII(sanitized, {
            redactEmails: SECURITY_CONFIG.REDACT_EMAILS,
            redactPhones: SECURITY_CONFIG.REDACT_PHONES,
            redactCreditCards: SECURITY_CONFIG.REDACT_CREDIT_CARDS,
            redactSSN: SECURITY_CONFIG.REDACT_SSN,
            redactBankAccounts: SECURITY_CONFIG.REDACT_BANK_ACCOUNTS,
            redactPESEL: SECURITY_CONFIG.REDACT_PESEL,
            redactPolishIdCard: SECURITY_CONFIG.REDACT_POLISH_ID,
            redactPolishPassport: SECURITY_CONFIG.REDACT_POLISH_PASSPORT,
            redactPolishPhones: SECURITY_CONFIG.REDACT_POLISH_PHONES,
            placeholder: SECURITY_CONFIG.PII_PLACEHOLDER
        });

        if (detectedPII.length > 0) {
            logger.warn({
                event: "pii_redacted",
                tool: toolName,
                pii_types: detectedPII,
                count: detectedPII.length
            });
        }

        const secureResult = JSON.parse(redacted) as TOutput;

        // Step 5: Consume tokens with retry & idempotency
        await consumeTokensWithRetry(
            tokenDb,
            userId,
            toolCost,
            "quiz",          // MCP server name
            toolName,
            inputs,
            redacted,        // Store sanitized & redacted result for audit
            true,            // success flag
            actionId         // pre-generated for idempotency
        );

        logger.info({
            event: "tool_completed",
            tool: toolName,
            user_email: userEmail,
            user_id: userId,
            action_id: actionId,
            duration_ms: 0,  // Would need timer integration
            tokens_consumed: toolCost
        });

        // Step 6: Return structured response
        return {
            content: [{
                type: "text" as const,
                text: redacted
            }],
            structuredContent: secureResult
        };
    } catch (error) {
        // Step 7: Error handling
        logger.error({
            event: "tool_failed",
            tool: toolName,
            user_id: userId,
            error: String(error)
        });
        return {
            content: [{
                type: "text" as const,
                text: `Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
}
