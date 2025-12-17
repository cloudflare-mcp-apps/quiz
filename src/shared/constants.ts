/**
 * Constants for Quiz MCP Server
 *
 * Centralizes all configuration values.
 * FREE MCP Server - No token costs.
 */

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
 * Server configuration
 *
 * Core MCP server metadata.
 */
export const SERVER_CONFIG = {
  NAME: "General Knowledge Quiz",
  VERSION: "1.0.0"
} as const;
