/**
 * Quiz Tool Extractors
 *
 * Tool extractors implement business logic for all quiz tools.
 * This is the SINGLE SOURCE OF TRUTH - eliminates duplication between
 * OAuth (server.ts) and API key (api-key-handler.ts) paths.
 *
 * Pattern: Use generic tool executor for 7-step workflow
 *
 * @module tools/quiz-tools
 */

import type { Env } from "../types";
import { executeToolWithTokenConsumption } from "../shared/tool-executor";
import { UI_RESOURCES } from "../resources/ui-resources";
import { getToolCost } from "../tool-descriptions";

/**
 * Execute start_quiz tool
 *
 * Starts the interactive quiz widget. No external API calls - pure widget response.
 *
 * @param params - Tool parameters (currently empty, but typed for consistency)
 * @param env - Cloudflare Workers environment bindings
 * @param userId - Authenticated user ID
 * @param userEmail - User email for error messages
 * @returns MCP tool response with widget URI
 */
export async function executeStartQuiz(
  params: {},
  env: Env,
  userId: string,
  userEmail: string
): Promise<{ content: any[]; structuredContent?: any; isError?: boolean }> {
  return executeToolWithTokenConsumption({
    toolName: 'start_quiz',
    toolCost: getToolCost('start_quiz'),  // 5 tokens from metadata
    userId,
    userEmail,
    tokenDb: env.TOKEN_DB,
    inputs: params,
    execute: async () => ({
      message: "Quiz started! Complete all 8 questions to see your score.",
      widget_uri: UI_RESOURCES.quiz.uri
    })
  });
}
