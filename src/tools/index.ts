/**
 * Tool Registry
 *
 * Central export point for all quiz tools.
 * Provides clean imports for server.ts and api-key-handler.ts
 *
 * FREE MCP Server - No token consumption.
 *
 * @module tools
 */

// Tool extractors
export { executeStartQuiz } from './quiz-tools';

// Tool metadata
export { TOOL_METADATA, getToolDescription, getToolExamples } from '../tool-descriptions';
export type { ToolMetadata, ToolName } from '../tool-descriptions';
