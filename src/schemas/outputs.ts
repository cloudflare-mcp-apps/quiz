/**
 * Output Schemas for Quiz MCP Tools
 *
 * Zod validation schemas for tool output responses.
 * Extracted from inline definitions for reusability.
 *
 * @module schemas/outputs
 */

import * as z from "zod/v4";

/**
 * Output schema for start_quiz tool
 *
 * Returns confirmation message and widget URI for rendering.
 */
export const StartQuizOutputSchema = z.object({
  message: z.string().meta({
    description: "User-facing confirmation message"
  }),
  widget_uri: z.string().meta({
    description: "UI resource URI for widget rendering (ui://quiz/main)"
  })
});

/**
 * Type inference from schema
 */
export type StartQuizOutput = z.infer<typeof StartQuizOutputSchema>;
