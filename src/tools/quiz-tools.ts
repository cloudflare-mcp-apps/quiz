/**
 * Quiz Tool Extractors
 *
 * Tool extractors implement business logic for all quiz tools.
 * This is the SINGLE SOURCE OF TRUTH - eliminates duplication between
 * OAuth (server.ts) and API key (api-key-handler.ts) paths.
 *
 * FREE MCP Server - No token consumption required.
 *
 * @module tools/quiz-tools
 */

import type { Env } from "../types";
import { UI_RESOURCES } from "../resources/ui-resources";
import { logger } from "../shared/logger";

/**
 * Execute start_quiz tool
 *
 * Starts the interactive quiz widget. No external API calls - pure widget response.
 * FREE tool - no token consumption.
 *
 * @param params - Tool parameters (currently empty, but typed for consistency)
 * @param env - Cloudflare Workers environment bindings
 * @param userId - Authenticated user ID
 * @param userEmail - User email for logging
 * @returns MCP tool response with widget URI
 */
export async function executeStartQuiz(
  _params: {},
  _env: Env,
  userId: string,
  userEmail: string
): Promise<{ content: any[]; structuredContent?: any; isError?: boolean }> {
  logger.info({
    event: "tool_completed",
    tool: "start_quiz",
    user_id: userId,
    user_email: userEmail,
    action_id: crypto.randomUUID(),
    duration_ms: 0,
    tokens_consumed: 0  // FREE tool
  });

  const result = {
    message: "Quiz started! Complete all 8 questions to see your score.",
    widget_uri: UI_RESOURCES.quiz.uri
  };

  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify(result, null, 2)
    }],
    structuredContent: result
  };
}
