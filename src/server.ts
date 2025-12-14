import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Env } from "./types";
import type { Props } from "./auth/props";
import { loadHtml } from "./helpers/assets.js";
import { UI_RESOURCES, UI_MIME_TYPE } from "./resources/ui-resources.js";
import { SERVER_INSTRUCTIONS } from './server-instructions.js';
import { executeStartQuiz } from "./tools";
import { TOOL_METADATA, getToolDescription } from "./tools/descriptions";
import { StartQuizInput } from "./schemas/inputs";
import { StartQuizOutputSchema } from "./schemas/outputs";
import { logger } from "./shared/logger";
import { SERVER_CONFIG } from "./shared/constants";

const RESOURCE_URI_META_KEY = "ui/resourceUri";

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
            name: SERVER_CONFIG.NAME,
            version: SERVER_CONFIG.VERSION,
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

        logger.info({ event: 'server_started', auth_mode: 'oauth' });

        // ========================================================================
        // Tool: start_quiz (5 tokens)
        // ========================================================================
        this.server.registerTool(
            "start_quiz",
            {
                title: TOOL_METADATA.start_quiz.title,
                description: getToolDescription("start_quiz"),
                inputSchema: StartQuizInput,
                outputSchema: StartQuizOutputSchema,
                annotations: {
                    readOnlyHint: true,      // Safe operation (no state mutation)
                    idempotentHint: false,   // Each quiz is unique session
                    openWorldHint: false     // No external interactions
                },
                _meta: {
                    [RESOURCE_URI_META_KEY]: UI_RESOURCES.quiz.uri
                }
            },
            async (params) => {
                if (!this.props) {
                    throw new Error('User not authenticated');
                }
                return executeStartQuiz(params, this.env, this.props.userId, this.props.email);
            }
        );

        logger.info({ event: 'server_started', auth_mode: 'oauth' });
    }
}
