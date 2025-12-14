/**
 * Tool Descriptions and Metadata
 *
 * Centralized metadata for all Quiz MCP tools.
 * Follows the 4-part description pattern from TOOL_DESCRIPTION_BEST_PRACTICES.md
 *
 * Pattern: Purpose → Returns → Use Case → Constraints
 *
 * Security Notes:
 * - NO API/service names in descriptions (only functional capabilities)
 * - NO token costs in descriptions (kept separate in metadata)
 * - NO implementation details
 *
 * @module tools/descriptions
 */

/**
 * Metadata structure for a single tool
 */
export interface ToolMetadata {
  /** Display name for UI and tool listings */
  title: string;

  /** 4-part description pattern */
  description: {
    /** Part 1: Action verb + what it does (1-2 sentences) */
    part1_purpose: string;

    /** Part 2: Explicit data fields returned (1 sentence) */
    part2_returns: string;

    /** Part 3: When/why to use this tool (1 sentence) */
    part3_useCase: string;

    /** Part 4: Limitations, edge cases, constraints (1-3 sentences) */
    part4_constraints: string;
  };

  /** Token economics (NOT exposed in tool descriptions) */
  cost: {
    /** Cost in wtyczki.ai tokens */
    tokens: number;

    /** Why this cost? (e.g., "Interactive widget session") */
    rationale: string;

    /** Optional: What factors affect cost */
    costFactors?: string[];
  };

  /** Use case examples for documentation and testing */
  examples: {
    /** Short scenario name */
    scenario: string;

    /** Detailed description of the use case */
    description: string;
  }[];
}

/**
 * Tool metadata registry for Quiz MCP
 *
 * Contains complete metadata for all tools including descriptions,
 * cost information, and use case examples.
 */
export const TOOL_METADATA = {
  /**
   * Tool: Start Quiz
   *
   * Interactive general knowledge quiz widget with 8 questions.
   * Medium-cost operation (5 tokens) for educational entertainment.
   */
  start_quiz: {
    title: "Start General Knowledge Quiz",

    description: {
      part1_purpose: "Starts an interactive general knowledge quiz widget with 8 questions across various topics.",

      part2_returns: "Returns an embedded UI where users answer questions and see their final score.",

      part3_useCase: "Use this when the user wants to test their knowledge with a quick, interactive quiz.",

      part4_constraints: "The widget manages state internally and automatically sends completion messages to the host when finished. Each quiz session creates a new instance with randomized question order."
    },

    cost: {
      tokens: 5,
      rationale: "Interactive widget session with 8 questions and scoring logic",
      costFactors: undefined // Fixed cost, no variable factors
    },

    examples: [
      {
        scenario: "Knowledge test",
        description: "User wants to test general knowledge across multiple topics (history, science, geography, etc.)"
      },
      {
        scenario: "Learning break",
        description: "Quick educational quiz during study sessions for mental engagement"
      },
      {
        scenario: "Trivia practice",
        description: "Practice trivia skills with randomized question order and immediate feedback"
      }
    ]
  } as const satisfies ToolMetadata
} as const;

/**
 * Type-safe tool name (for autocomplete and validation)
 */
export type ToolName = keyof typeof TOOL_METADATA;

/**
 * Generate full tool description from metadata
 *
 * Concatenates all 4 parts of the description pattern into a single string
 * suitable for the MCP tool registration `description` field.
 *
 * @param toolName - Name of the tool (type-safe)
 * @returns Full description string following 4-part pattern
 *
 * @example
 * ```typescript
 * const desc = getToolDescription("start_quiz");
 * // Returns: "Starts an interactive general knowledge quiz widget..."
 * ```
 */
export function getToolDescription(toolName: ToolName): string {
  const meta = TOOL_METADATA[toolName];
  const { part1_purpose, part2_returns, part3_useCase, part4_constraints } = meta.description;

  return `${part1_purpose} ${part2_returns} ${part3_useCase} ${part4_constraints}`;
}

/**
 * Get token cost for a tool
 *
 * Retrieves the token cost from metadata. This should be used instead of
 * hardcoding TOOL_COST constants throughout the codebase.
 *
 * @param toolName - Name of the tool (type-safe)
 * @returns Token cost for this tool
 *
 * @example
 * ```typescript
 * const cost = getToolCost("start_quiz"); // Returns: 5
 * ```
 */
export function getToolCost(toolName: ToolName): number {
  return TOOL_METADATA[toolName].cost.tokens;
}

/**
 * Get cost rationale for a tool
 *
 * Retrieves the explanation for why a tool costs what it costs.
 * Useful for documentation and debugging.
 *
 * @param toolName - Name of the tool (type-safe)
 * @returns Cost rationale string
 *
 * @example
 * ```typescript
 * const rationale = getToolCostRationale("start_quiz");
 * // Returns: "Interactive widget session with 8 questions and scoring logic"
 * ```
 */
export function getToolCostRationale(toolName: ToolName): string {
  return TOOL_METADATA[toolName].cost.rationale;
}

/**
 * Get all use case examples for a tool
 *
 * Retrieves documented use cases for testing and documentation purposes.
 *
 * @param toolName - Name of the tool (type-safe)
 * @returns Array of use case examples
 *
 * @example
 * ```typescript
 * const examples = getToolExamples("start_quiz");
 * // Returns: [{ scenario: "Knowledge test", description: "User wants to test..." }, ...]
 * ```
 */
export function getToolExamples(toolName: ToolName): readonly { scenario: string; description: string }[] {
  return TOOL_METADATA[toolName].examples;
}
