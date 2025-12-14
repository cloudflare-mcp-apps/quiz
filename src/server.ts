import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";  // Zod 4: namespace import required
import type { Env } from "./types";
import type { Props } from "./props";
import { checkBalance, consumeTokensWithRetry } from "./tokenConsumption";
import { formatInsufficientTokensError, formatAccountDeletedError } from "./tokenUtils";
import { sanitizeOutput, redactPII } from 'pilpat-mcp-security';
import { loadHtml } from "./helpers/assets.js";
import { UI_RESOURCES, UI_MIME_TYPE } from "./resources/ui-resources.js";
import { SERVER_INSTRUCTIONS } from './server-instructions.js';

/**
 * Quiz MCP - General Knowledge Quiz Widget
 *
 * Pure MCP App providing interactive general knowledge quiz with 8 questions.
 * No external API integration - all data is hardcoded in the widget.
 *
 * Generic type parameters:
 * - Env: Cloudflare Workers environment bindings (KV, D1, ASSETS)
 * - unknown: No state management (stateless server)
 * - Props: Authenticated user context from WorkOS (user, tokens, permissions, userId)
 */
export class Quiz extends McpAgent<Env, unknown, Props> {
    server = new McpServer(
        {
            name: "General Knowledge Quiz",
            version: "1.0.0",
        },
        {
            capabilities: {
                tools: {},
                resources: { listChanged: true }  // SEP-1865: Enable resource discovery
            },
            instructions: SERVER_INSTRUCTIONS  // Injected into LLM system prompt
        }
    );

    // Stateless server - no persistent state needed

    async init() {
        // ========================================================================
        // SEP-1865 MCP Apps: UI Resource Registration
        // ========================================================================
        const quizResource = UI_RESOURCES.quiz;

        this.server.registerResource(
            quizResource.name,
            quizResource.uri,
            {
                description: quizResource.description,
                mimeType: quizResource.mimeType
            },
            async () => {
                // Load built widget from Assets binding
                const templateHTML = await loadHtml(this.env.ASSETS, "/quiz.html");

                return {
                    contents: [{
                        uri: quizResource.uri,
                        mimeType: UI_MIME_TYPE,
                        text: templateHTML,
                        _meta: quizResource._meta as Record<string, unknown>
                    }]
                };
            }
        );

        console.log(`[Quiz] UI resource registered: ${quizResource.uri}`);

        // ========================================================================
        // Tool: start_quiz (5 tokens)
        // ========================================================================
        this.server.registerTool(
            "start_quiz",
            {
                title: "Start General Knowledge Quiz",
                description: "Starts the interactive general knowledge quiz widget with 8 questions across various topics. Returns an embedded UI where users answer questions and see their final score. The widget manages state internally and automatically sends a completion message to the host when finished. Use this when the user wants to test their knowledge with a quick, interactive quiz.",
                inputSchema: {},
                outputSchema: z.object({
                    message: z.string().meta({ description: "User-facing confirmation message" }),
                    widget_uri: z.string().meta({ description: "UI resource URI for widget rendering" })
                }),
                annotations: {
                    readOnlyHint: true,      // Safe operation (no state mutation)
                    idempotentHint: false,   // Each quiz is unique session
                    openWorldHint: false     // No external interactions
                },
                _meta: {
                    "ui/resourceUri": UI_RESOURCES.quiz.uri
                }
            },
            async ({}) => {
                const TOOL_NAME = 'start_quiz';
                const REQUIRED_TOKENS = 5;

                // Step 0: Pre-generate idempotent actionId
                const actionId = crypto.randomUUID();

                // Step 1 & 2: Validate user authentication (handled by McpAgent)
                if (!this.props) {
                    throw new Error('User not authenticated');
                }
                const userId = this.props.userId;
                const userEmail = this.props.email;

                // Step 3: Check token balance
                const balanceCheck = await checkBalance(
                    this.env.TOKEN_DB,
                    userId,
                    REQUIRED_TOKENS
                );

                if (balanceCheck.userDeleted) {
                    throw new Error(formatAccountDeletedError(userEmail));
                }

                if (!balanceCheck.sufficient) {
                    throw new Error(
                        formatInsufficientTokensError(
                            TOOL_NAME,
                            balanceCheck.currentBalance,
                            REQUIRED_TOKENS
                        )
                    );
                }

                // Step 4: Execute business logic (no external API call)
                const result = {
                    message: "Quiz started! Complete all 8 questions to see your score.",
                    widget_uri: UI_RESOURCES.quiz.uri
                };

                let success = true;

                // Step 4.5: Security processing (minimal for widget-only)
                const sanitized = sanitizeOutput(JSON.stringify(result), {
                    maxLength: 500,
                    removeHtml: true,
                    removeControlChars: true,
                    normalizeWhitespace: true
                });

                const { redacted, detectedPII } = redactPII(sanitized, {
                    redactEmails: false,
                    redactPhones: false,
                    redactCreditCards: false,
                    redactSSN: false,
                    redactBankAccounts: false,
                    redactPESEL: false,
                    redactPolishIdCard: false,
                    redactPolishPassport: false,
                    redactPolishPhones: false,
                    placeholder: '[REDACTED]'
                });

                if (detectedPII.length > 0) {
                    console.warn(`[Security] Quiz tool: Redacted PII types:`, detectedPII);
                }

                const finalResult = JSON.parse(redacted);

                // Step 5: Consume tokens with retry logic (idempotent)
                await consumeTokensWithRetry(
                    this.env.TOKEN_DB,
                    userId,
                    REQUIRED_TOKENS,
                    'quiz',
                    TOOL_NAME,
                    {},  // No parameters
                    finalResult,
                    success,
                    actionId
                );

                // Step 6: Return with structuredContent (SDK 1.20+)
                return {
                    content: [{
                        type: 'text',
                        text: finalResult.message
                    }],
                    structuredContent: finalResult
                };
            }
        );

        console.log('[Quiz] Tool registered: start_quiz (5 tokens)');
    }
}
