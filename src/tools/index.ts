/**
 * Tool Registry
 *
 * Central export point for all quiz tools.
 * Provides clean imports for server.ts and api-key-handler.ts
 *
 * @module tools
 */

// Tool extractors
export { executeStartQuiz } from './quiz-tools';

// Tool metadata
export { TOOL_METADATA, getToolDescription, getToolCost, getToolCostRationale, getToolExamples } from '../tool-descriptions';
export type { ToolMetadata, ToolName } from '../tool-descriptions';
