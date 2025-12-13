import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";  // Zod 4: namespace import required
import { ApiClient } from "./api-client";
import type { Env } from "./types";
import { ResponseFormat } from "./types";
import type { Props } from "./props";
import { checkBalance, consumeTokensWithRetry } from "./tokenConsumption";
import { formatInsufficientTokensError } from "./tokenUtils";
import { sanitizeOutput, redactPII, validateOutput } from 'pilpat-mcp-security';

/**
 * TODO: Rename this class to match your server name (e.g., WeatherMCP, NewsMCP, etc.)
 *
 * Skeleton MCP Server with Token Integration
 *
 * This server demonstrates the complete token-based authentication pattern
 * with three example tools showing different token costs (1, 2, 3 tokens).
 *
 * Generic type parameters:
 * - Env: Cloudflare Workers environment bindings (KV, D1, WorkOS credentials, etc.)
 * - unknown: No state management (stateless server) - change if you need state
 * - Props: Authenticated user context from WorkOS (user, tokens, permissions, userId)
 *
 * Authentication flow:
 * 1. User connects via MCP client
 * 2. Redirected to WorkOS AuthKit (Magic Auth)
 * 3. User enters email → receives 6-digit code
 * 4. OAuth callback checks if user exists in token database
 * 5. If not in database → 403 error page
 * 6. If in database → Access granted, user info available via this.props
 * 7. All tools check token balance before execution
 */
export class Quiz extends McpAgent<Env, unknown, Props> {
    server = new McpServer({
        name: "Skeleton MCP Server", // TODO: Update server name
        version: "1.0.0",
    });

    // NO initialState - this is a stateless server
    // TODO: If you need state, add:
    // initialState = { yourStateHere: "value" };
    // Then change generic from 'unknown' to your State type

    async init() {
        // ========================================================================
        // API CLIENT INITIALIZATION
        // ========================================================================
        // TODO: Initialize your custom API client here when implementing tools
        // Example: const apiClient = new YourApiClient(this.env.YOUR_API_KEY);
        // DO NOT uncomment until you have implemented your custom API client class

        // ========================================================================
        // TOOL REGISTRATION SECTION
        // ========================================================================
        // Tools will be generated here by the automated boilerplate generator
        // Usage: npm run generate-tool --prp PRPs/your-prp.md --tool-id your_tool --output snippets
        //
        // Or implement tools manually following the 7-Step Token Pattern:
        // Step 0: Generate actionId for idempotency
        // Step 1: Get userId from this.props
        // Step 2: Check token balance with checkBalance()
        // Step 3: Handle insufficient balance
        // Step 4: Execute business logic
        // Step 4.5: Apply security (sanitizeOutput + redactPII)
        // Step 5: Consume tokens with consumeTokensWithRetry()
        // Step 6: Return result
        //
        // Tool Design Best Practices:
        // ✅ Consolidation: Combine multi-step operations into goal-oriented tools
        // ✅ ResponseFormat: Add format parameter for large datasets (concise/detailed)
        // ✅ Context Optimization: Return semantic data (names) not technical (IDs)
        // ✅ Token Efficiency: Implement pagination, filtering, smart defaults
        //
        // Tool Description Pattern (CRITICAL - LLMs use this for tool selection):
        // Use the 2-part structure: Purpose → Details
        //
        // Use registerTool() API (SDK 1.20+)
        //
        // this.server.registerTool(
        //     "get_currency_rate",  // snake_case tool ID
        //     {
        //         title: "Get Currency Rate",  // NEW: Display name for UI
        //         description:
        //             "Get current or historical buy/sell exchange rates from the Polish National Bank (NBP). " +
        //             "Returns bid (bank buy) and ask (bank sell) prices in PLN from NBP Table C. " +
        //             "Use this when you need to know exchange rates at Polish banks. " +
        //             "Note: NBP only publishes rates on trading days (Mon-Fri, excluding holidays).",
        //         inputSchema: {
        //             // Zod 4: Use .meta({ description }) instead of .describe()
        //             currencyCode: z.enum(["USD", "EUR", "GBP"]).meta({
        //                 description: "Three-letter ISO 4217 currency code (uppercase). " +
        //                     "Supported: USD, EUR, GBP. Example: 'USD'"
        //             }),
        //             date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().meta({
        //                 description: "Date in YYYY-MM-DD format (e.g., '2025-10-01'). " +
        //                     "If omitted, returns the most recent rate. " +
        //                     "Must be a trading day (not weekend/holiday)."
        //             })
        //         },
        //         outputSchema: z.object({  // NEW: Output validation
        //             bid: z.number(),
        //             ask: z.number(),
        //             date: z.string()
        //         })
        //     },
        //     async ({ currencyCode, date }) => {
        //         // Steps 0-4: actionId generation, userId lookup, balance check, execution
        //         const result = { bid: 3.95, ask: 4.05, date: "2025-01-21" };
        //
        //         // Step 4.5: Security processing (sanitize + redact PII)
        //         const sanitized = sanitizeOutput(JSON.stringify(result), {
        //             removeHtml: true,
        //             removeControlChars: true
        //         });
        //         const { redacted } = redactPII(sanitized, {
        //             redactPhones: true,
        //             redactCreditCards: true
        //         });
        //
        //         // Step 5: Consume tokens
        //         // await consumeTokensWithRetry(...);
        //
        //         // Step 6: Return result with BOTH content and structuredContent
        //         return {
        //             content: [{ type: 'text', text: redacted }],
        //             structuredContent: result  // Direct access for LLMs
        //         };
        //     }
        // );
        //
        // Key improvements in registerTool() API:
        // - title field for UI display (separate from name identifier)
        // - outputSchema for runtime validation
        // - Returns tool handle for dynamic enable/disable
        //
        // Reference: See development_guide.md Section 0 for comprehensive patterns
        //
        // ========================================================================
        // MCP APPS (SEP-1865) - OPTIONAL Interactive UI
        // ========================================================================
        // MCP Apps enable tools to return rich, interactive UI components
        // Reference: mcp-apps/MCP_APPS_BEST_PRACTICES.md
        //
        // MCP Apps Pattern (Two-Part Registration):
        // 1. Register UI Resource (HTML widget served via Cloudflare Assets)
        // 2. Register Tool with _meta["ui/resourceUri"] linking to the widget
        //
        // Key concepts:
        // - Widget HTML is built with Vite + viteSingleFile and served via Assets binding
        // - Tool returns structuredContent (for UI) + content (text fallback for non-UI hosts)
        // - Widget uses @modelcontextprotocol/ext-apps SDK for host communication
        //
        // WHEN TO USE MCP APPS:
        // ✅ Display data that benefits from visualization (tables, charts, dashboards)
        // ✅ Require forms or interactive configuration interfaces
        // ✅ Embed external services (Grafana, Tableau, Looker)
        // ✅ Involve multi-step workflows with user interaction
        // ✅ Handle real-time data updates
        //
        // ❌ Skip UI if: Simple text APIs, credentials only, pure data transformation
        //
        // Implementation requires:
        // 1. Add "assets" binding to wrangler.jsonc pointing to built widgets
        // 2. Create widget HTML/React components in web/widgets/
        // 3. Register UI resource with server.registerResource()
        // 4. Link tool to UI via _meta: { "ui/resourceUri": "ui://widget/name.html" }
        //
        // Learn more:
        // - mcp-apps/MCP_APPS_BEST_PRACTICES.md (comprehensive patterns)
        // - mcp-apps/sep.md (SEP-1865 specification)
        // - mcp-apps/ext_apps.md (SDK documentation)
        //
        // TODO: Add your tools here (manually or via generator)
    }
}
