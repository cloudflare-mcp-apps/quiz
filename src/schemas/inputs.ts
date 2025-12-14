/**
 * Input Schemas for Quiz MCP Tools
 *
 * Zod validation schemas for tool input parameters.
 * Extracted from inline definitions for reusability.
 *
 * @module schemas/inputs
 */

import * as z from "zod/v4";

/**
 * Input schema for start_quiz tool
 *
 * Currently empty, but structured for future parameters like:
 * - difficulty: 'easy' | 'medium' | 'hard'
 * - category: 'science' | 'history' | 'geography' | 'all'
 * - questionCount: number (e.g., 5, 8, 10)
 */
export const StartQuizInput = z.object({
  // Currently empty - widget has no parameters
  // Future: Add difficulty, category, questionCount
});

/**
 * Type inference from schema
 */
export type StartQuizParams = z.infer<typeof StartQuizInput>;
