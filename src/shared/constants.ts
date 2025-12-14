/**
 * Constants for Quiz MCP Server
 *
 * Centralizes all magic numbers and configuration values.
 * Eliminates hardcoded values scattered across the codebase.
 */

/**
 * Tool cost configuration
 *
 * Defines token costs for each tool in the MCP server.
 */
export const TOOL_COSTS = {
  START_QUIZ: 5
} as const;

/**
 * LRU cache configuration for API key handler
 *
 * Controls server instance caching behavior to optimize performance.
 */
export const CACHE_CONFIG = {
  MAX_SERVERS: 1000,
  EVICTION_POLICY: 'LRU' as const
} as const;

/**
 * Security configuration for Step 4.5 processing
 *
 * Controls output sanitization and PII redaction behavior.
 * These settings are specifically tuned for quiz widget responses.
 */
export const SECURITY_CONFIG = {
  /** Maximum output length before truncation */
  MAX_OUTPUT_LENGTH: 500,

  /** PII redaction flags - all disabled for widget-only responses */
  REDACT_EMAILS: false,
  REDACT_PHONES: false,
  REDACT_CREDIT_CARDS: false,
  REDACT_SSN: false,
  REDACT_BANK_ACCOUNTS: false,
  REDACT_PESEL: false,
  REDACT_POLISH_ID: false,
  REDACT_POLISH_PASSPORT: false,
  REDACT_POLISH_PHONES: false,

  /** Placeholder text for redacted PII */
  PII_PLACEHOLDER: '[REDACTED]'
} as const;

/**
 * Server configuration
 *
 * Core MCP server metadata.
 */
export const SERVER_CONFIG = {
  NAME: "General Knowledge Quiz",
  VERSION: "1.0.0"
} as const;
