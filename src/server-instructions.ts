/**
 * Server Instructions for Quiz MCP
 *
 * Injected into LLM system prompt during MCP initialization.
 * Provides tool usage context, performance expectations, and constraints.
 *
 * Pattern: Purpose → Capabilities → Usage → Performance → Constraints
 * Aligned with: MCP Specification 2025-11-25, server_instruction_guide.md
 */

export const SERVER_INSTRUCTIONS = `
General Knowledge Quiz - Interactive widget-based quiz with 8 questions

## Key Capabilities
- Interactive 8-question quiz across geography, science, history, and general knowledge
- Embedded UI with automatic state management
- Real-time scoring and instant feedback
- Completion notification sent to host automatically

## Usage Patterns
- Single tool: start_quiz (no parameters required)
- Widget handles all user interaction internally
- No follow-up tools needed - quiz is self-contained
- Each invocation creates a new quiz session

## Performance & Limits
- Widget load: < 2 seconds
- No external API calls (all data hardcoded)
- No rate limits (pure client-side widget)
- Results not cached (each session is unique)

## Important Notes
- Zero-latency experience (no API wait times)
- Widget auto-closes and sends completion message when finished
- Dark mode support via host context
- Fixed height container prevents resize loops
`.trim();

export default SERVER_INSTRUCTIONS;
