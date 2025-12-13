/**
 * API Key Authentication Handler for Skeleton MCP Server
 *
 * This module provides API key authentication support for MCP clients that don't support
 * OAuth flows (like AnythingLLM, Cursor IDE, custom scripts).
 *
 * Authentication flow:
 * 1. Extract API key from Authorization header
 * 2. Validate key using validateApiKey()
 * 3. Get user from database
 * 4. Create MCP server with tools
 * 5. Handle MCP protocol request
 * 6. Return response
 *
 * TODO: When you add new tools to server.ts, you MUST also:
 * 1. Register them in getOrCreateServer() (around line 260)
 * 2. Add tool executor functions (around line 770)
 * 3. Add cases to handleToolsCall() (around line 750)
 * 4. Add tool schemas to handleToolsList() (around line 625)
 */

import { validateApiKey } from "./apiKeys";
import { getUserById } from "./tokenUtils";
import type { Env, ResponseFormat } from "./types";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";  // Zod 4: namespace import required
import { ApiClient } from "./api-client";
import { checkBalance, consumeTokensWithRetry } from "./tokenConsumption";
import { formatInsufficientTokensError, formatAccountDeletedError } from "./tokenUtils";
import { sanitizeOutput, redactPII, validateOutput } from 'pilpat-mcp-security';

/**
 * Simple LRU (Least Recently Used) Cache for MCP Server instances
 *
 * IMPORTANT: This cache is ephemeral and Worker-instance-specific:
 *
 * 🔸 **Ephemeral (Non-Persistent):**
 *   - Cache is cleared when the Worker is evicted from memory
 *   - Eviction can happen at any time (deployments, inactivity, memory pressure)
 *   - NO guarantee of cache persistence between requests
 *
 * 🔸 **Worker-Instance-Specific:**
 *   - Different Worker instances (different data centers) have separate caches
 *   - A user in Warsaw and a user in New York access different caches
 *   - Cache is NOT replicated globally (unlike D1 database)
 *
 * 🔸 **Performance Optimization Only:**
 *   - This is a PERFORMANCE optimization, not critical state storage
 *   - Cache misses simply recreate the MCP server (acceptable overhead)
 *   - Critical state (balances, tokens, transactions) is stored in D1 database
 *
 * 🔸 **Why This Is Safe:**
 *   - MCP servers are stateless (tools query database on each call)
 *   - Recreating a server doesn't cause data loss or corruption
 *   - Token consumption is atomic via D1 transactions (not cached)
 *   - User balances are ALWAYS queried from database (never cached)
 *
 * 🔸 **LRU Eviction:**
 *   - When cache reaches MAX_SIZE, the least recently used server is evicted
 *   - This prevents unbounded memory growth
 *   - Evicted servers are simply garbage collected
 *
 * Reference: Cloudflare Docs - "In-memory state in Durable Objects"
 * https://developers.cloudflare.com/durable-objects/reference/in-memory-state/
 */
class LRUCache<K, V> {
  private cache: Map<K, { value: V; lastAccessed: number }>;
  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get value from cache and update last accessed time
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update last accessed time (LRU tracking)
      entry.lastAccessed = Date.now();
      return entry.value;
    }
    return undefined;
  }

  /**
   * Set value in cache with automatic LRU eviction
   */
  set(key: K, value: V): void {
    // If cache is full, evict least recently used entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Check if key exists in cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Get current cache size
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used entry from cache
   */
  private evictLRU(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    // Find least recently used entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
      console.log(`🗑️  [LRU Cache] Evicted server for user: ${String(oldestKey)}`);
    }
  }

  /**
   * Clear entire cache (useful for testing)
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Global MCP server cache
 *
 * Configuration:
 * - Max size: 1000 servers (prevents unbounded memory growth)
 * - Eviction policy: LRU (Least Recently Used)
 * - Lifetime: Until Worker is evicted from memory
 *
 * Typical memory usage:
 * - Each MCP server: ~50-100 KB
 * - 1000 servers: ~50-100 MB (acceptable for Workers)
 *
 * Workers have 128 MB memory limit, so 1000 servers leaves plenty of headroom.
 */
const MAX_CACHED_SERVERS = 1000;
const serverCache = new LRUCache<string, McpServer>(MAX_CACHED_SERVERS);

/**
 * Main entry point for API key authenticated MCP requests
 *
 * @param request - Incoming HTTP request
 * @param env - Cloudflare Workers environment
 * @param ctx - Execution context
 * @param pathname - Request pathname (/sse or /mcp)
 * @returns MCP protocol response
 */
export async function handleApiKeyRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  pathname: string
): Promise<Response> {
  try {
    console.log(`🔐 [API Key Auth] Request to ${pathname}`);

    // 1. Extract API key from Authorization header
    const authHeader = request.headers.get("Authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey) {
      console.log("❌ [API Key Auth] Missing Authorization header");
      return jsonError("Missing Authorization header", 401);
    }

    // 2. Validate API key and get user_id
    const userId = await validateApiKey(apiKey, env);

    if (!userId) {
      console.log("❌ [API Key Auth] Invalid or expired API key");
      return jsonError("Invalid or expired API key", 401);
    }

    // 3. Get user from database
    const dbUser = await getUserById(env.TOKEN_DB, userId);

    if (!dbUser) {
      // getUserById already checks is_deleted, so null means not found OR deleted
      console.log(`❌ [API Key Auth] User not found or deleted: ${userId}`);
      return jsonError("User not found or account deleted", 404);
    }

    console.log(
      `✅ [API Key Auth] Authenticated user: ${dbUser.email} (${userId}), balance: ${dbUser.current_token_balance} tokens`
    );

    // 4. Create or get cached MCP server with tools
    const server = await getOrCreateServer(env, userId, dbUser.email);

    // 5. Handle the MCP request using the appropriate transport
    if (pathname === "/sse") {
      return await handleSSETransport(server, request);
    } else if (pathname === "/mcp") {
      return await handleHTTPTransport(server, request, env, userId, dbUser.email);
    } else {
      return jsonError("Invalid endpoint. Use /sse or /mcp", 400);
    }
  } catch (error) {
    console.error("[API Key Auth] Error:", error);
    return jsonError(
      `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

/**
 * Get or create MCP server instance for API key user
 *
 * This creates a standalone MCP server (not using McpAgent) with all tools.
 * The server instance is cached per user to avoid recreating it on every request.
 *
 * Cache behavior:
 * - Cache hit: Returns existing server immediately (~1ms)
 * - Cache miss: Creates new server (~10-50ms), then caches it
 * - Cache full: Evicts least recently used server automatically
 *
 * TODO: When you add new tools to server.ts, you MUST add them here too!
 *
 * @param env - Cloudflare Workers environment
 * @param userId - User ID for token management
 * @param email - User email for logging
 * @returns Configured MCP server instance
 */
async function getOrCreateServer(
  env: Env,
  userId: string,
  email: string
): Promise<McpServer> {
  // Check cache first
  const cached = serverCache.get(userId);
  if (cached) {
    console.log(
      `📦 [LRU Cache] HIT for user ${userId} (cache size: ${serverCache.size}/${MAX_CACHED_SERVERS})`
    );
    return cached;
  }

  console.log(
    `🔧 [LRU Cache] MISS for user ${userId} - creating new server (cache size: ${serverCache.size}/${MAX_CACHED_SERVERS})`
  );

  // Create new MCP server
  const server = new McpServer({
    name: "Skeleton MCP Server (API Key)", // TODO: Update server name
    version: "1.0.0",
  });

  // ========================================================================
  // API CLIENT INITIALIZATION
  // ========================================================================
  // TODO: Initialize your custom API client here when implementing tools
  // Example: const apiClient = new YourApiClient(env.YOUR_API_KEY);
  // DO NOT uncomment until you have implemented your custom API client class

  // ========================================================================
  // LOCATION 1: TOOL REGISTRATION SECTION
  // ========================================================================
  // Tools will be generated here by the automated boilerplate generator
  // Usage: npm run generate-tool --prp PRPs/your-prp.md --tool-id your_tool --output snippets
  //
  // Or implement tools manually following the 7-Step Token Pattern:
  // Step 0: Generate actionId for idempotency
  // Step 1: userId parameter is already available in this function scope
  // Step 2: Check token balance with checkBalance(env.TOKEN_DB, userId, TOOL_COST)
  // Step 3: Handle insufficient balance and deleted users
  // Step 4: Execute business logic
  // Step 4.5: Apply security (sanitizeOutput + redactPII)
  // Step 5: Consume tokens with consumeTokensWithRetry()
  // Step 6: Return result with BOTH content and structuredContent
  //
  // Use registerTool() API (SDK 1.20+)
  //
  // server.registerTool(
  //   "get_currency_rate",
  //   {
  //     title: "Get Currency Rate",  // NEW: Display name for UI
  //     description: "Get current or historical buy/sell exchange rates from the Polish National Bank (NBP). " +
  //                  "Returns bid/ask prices in PLN from NBP Table C. Use this when you need exchange rates. " +
  //                  "Note: NBP only publishes rates on trading days.",
  //     inputSchema: { ... },
  //     outputSchema: z.object({...})  // NEW: Output validation
  //   },
  //   async ({ currencyCode, date }) => { ... }
  // );
  //
  // Tool Description Pattern (2-Part Structure):
  // "[Action Verb] [functionality] from [source]. " +           // Part 1: Purpose
  // "Returns [specific fields]. Use this when [scenario]. " +   // Part 2: Details
  // "Note: [constraint]. "                                       // Part 2: Constraints (if applicable)
  //
  // CRITICAL: Tool descriptions MUST be IDENTICAL in both OAuth (server.ts) and API Key paths
  // CRITICAL: Return values MUST include structuredContent for LLM comprehension
  //
  // TODO: Add your tools here using server.registerTool() calls

  // Cache the server (automatic LRU eviction if cache is full)
  serverCache.set(userId, server);

  console.log(
    `✅ [LRU Cache] Server created and cached for user ${userId} (cache size: ${serverCache.size}/${MAX_CACHED_SERVERS})`
  );
  return server;
}

/**
 * Handle HTTP (Streamable HTTP) transport for MCP protocol
 *
 * Streamable HTTP is the modern MCP transport protocol that replaced SSE.
 * It uses standard HTTP POST requests with JSON-RPC 2.0 protocol.
 *
 * Supported JSON-RPC methods:
 * - initialize: Protocol handshake and capability negotiation
 * - ping: Health check (required by AnythingLLM)
 * - tools/list: List all available tools
 * - tools/call: Execute a specific tool
 *
 * SECURITY: Token-Based Authentication (Primary Protection)
 * ═══════════════════════════════════════════════════════════
 * Security is enforced through token validation at the application layer:
 *
 * Protection Layers:
 * 1. API key validation (database lookup, format check, bcrypt verification)
 * 2. User account verification (is_deleted flag check)
 * 3. Token balance validation before tool execution
 * 4. Cloudflare Workers infrastructure (runs on *.workers.dev, not localhost)
 *
 * ⚠️ DO NOT use origin whitelists (ALLOWED_ORIGINS):
 * - Breaks compatibility with legitimate MCP clients
 * - Cannot track all clients (Claude, Cursor, AnythingLLM, custom/enterprise)
 * - Token authentication provides sufficient protection
 * - DNS rebinding mitigated by Cloudflare infrastructure
 *
 * @param server - Configured MCP server instance
 * @param request - Incoming HTTP POST request with JSON-RPC message
 * @param env - Cloudflare Workers environment
 * @param userId - User ID for logging
 * @param userEmail - User email for logging
 * @returns JSON-RPC response
 */
async function handleHTTPTransport(
  server: McpServer,
  request: Request,
  env: Env,
  userId: string,
  userEmail: string
): Promise<Response> {
  console.log(`📡 [API Key Auth] HTTP transport request from ${userEmail}`);

  /**
   * Security: Token-based authentication provides primary protection
   * - API key validation (database lookup, format check)
   * - User account verification (is_deleted flag)
   * - Token balance validation
   * - Cloudflare Workers infrastructure (runs on *.workers.dev, not localhost)
   * No origin whitelist - breaks compatibility with MCP clients (Claude, Cursor, custom clients)
   */

  try {
    // Parse JSON-RPC request
    const jsonRpcRequest = await request.json() as {
      jsonrpc: string;
      id: number | string;
      method: string;
      params?: any;
    };

    console.log(`📨 [HTTP] Method: ${jsonRpcRequest.method}, ID: ${jsonRpcRequest.id}, Origin: ${origin}`);

    // Validate JSON-RPC 2.0 format
    if (jsonRpcRequest.jsonrpc !== "2.0") {
      return jsonRpcResponse(jsonRpcRequest.id, null, {
        code: -32600,
        message: "Invalid Request: jsonrpc must be '2.0'",
      });
    }

    // Route to appropriate handler based on method
    switch (jsonRpcRequest.method) {
      case "initialize":
        return handleInitialize(jsonRpcRequest);

      case "ping":
        return handlePing(jsonRpcRequest);

      case "tools/list":
        return await handleToolsList(server, jsonRpcRequest);

      case "tools/call":
        return await handleToolsCall(server, jsonRpcRequest, env, userId, userEmail);

      default:
        return jsonRpcResponse(jsonRpcRequest.id, null, {
          code: -32601,
          message: `Method not found: ${jsonRpcRequest.method}`,
        });
    }
  } catch (error) {
    console.error("❌ [HTTP] Error:", error);
    return jsonRpcResponse("error", null, {
      code: -32700,
      message: `Parse error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Handle initialize request (MCP protocol handshake)
 */
function handleInitialize(request: {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}): Response {
  console.log("✅ [HTTP] Initialize request");

  return jsonRpcResponse(request.id, {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "Skeleton MCP Server", // TODO: Update server name
      version: "1.0.0",
    },
  });
}

/**
 * Handle ping request (health check)
 */
function handlePing(request: {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}): Response {
  console.log("✅ [HTTP] Ping request");

  return jsonRpcResponse(request.id, {});
}

/**
 * Handle tools/list request (list all available tools)
 *
 * TODO: When you add new tools, update this list to match!
 */
async function handleToolsList(
  server: McpServer,
  request: {
    jsonrpc: string;
    id: number | string;
    method: string;
    params?: any;
  }
): Promise<Response> {
  console.log("✅ [HTTP] Tools list request");

  // ========================================================================
  // LOCATION 2: TOOL SCHEMA DEFINITIONS
  // ========================================================================
  // Manually define tools since McpServer doesn't expose listTools()
  // These schemas MUST match the tools registered in getOrCreateServer() using registerTool()
  // These must also match the schemas in Location 1 of src/server.ts
  //
  // CRITICAL: Descriptions MUST be IDENTICAL across all 3 locations:
  // - Location 1 (server.ts): server.registerTool() calls
  // - Location 1 (api-key-handler.ts): server.registerTool() calls
  // - Location 2 (api-key-handler.ts): handleToolsList() schemas
  // - Use the SAME description string from registerTool() description field
  //
  // TODO: Add tool schemas here when implementing tools
  //
  // Example:
  // {
  //   name: "get_currency_rate",
  //   description: "Get current or historical buy/sell exchange rates from the Polish National Bank (NBP). " +
  //                "Returns bid/ask prices in PLN from NBP Table C. Use this when you need exchange rates. " +
  //                "Note: NBP only publishes rates on trading days.",
  //   inputSchema: {
  //     type: "object",
  //     properties: {
  //       currencyCode: {
  //         type: "string",
  //         enum: ["USD", "EUR", "GBP"],
  //         description: "Three-letter ISO 4217 code. Example: 'USD'"
  //       },
  //       date: {
  //         type: "string",
  //         description: "Date in YYYY-MM-DD format (e.g., '2025-10-01'). If omitted, returns most recent rate."
  //       }
  //     },
  //     required: ["currencyCode"]
  //   }
  // }
  const tools: any[] = [
    // Tools will be added here (manually or via generator)
  ];

  return jsonRpcResponse(request.id, {
    tools,
  });
}

/**
 * Handle tools/call request (execute a tool)
 *
 * TODO: When you add new tools, add cases to the switch statement!
 */
async function handleToolsCall(
  server: McpServer,
  request: {
    jsonrpc: string;
    id: number | string;
    method: string;
    params?: {
      name: string;
      arguments?: Record<string, any>;
    };
  },
  env: Env,
  userId: string,
  userEmail: string
): Promise<Response> {
  if (!request.params || !request.params.name) {
    return jsonRpcResponse(request.id, null, {
      code: -32602,
      message: "Invalid params: name is required",
    });
  }

  const toolName = request.params.name;
  const toolArgs = request.params.arguments || {};

  console.log(`🔧 [HTTP] Tool call: ${toolName} by ${userEmail}`, toolArgs);

  try {
    // Execute tool logic based on tool name
    // This duplicates the logic from getOrCreateServer() but is necessary
    // because McpServer doesn't expose a way to call tools directly

    let result: any;

    // ========================================================================
    // LOCATION 3: TOOL SWITCH CASES
    // ========================================================================
    // Route tool calls to executor functions
    // TODO: Add cases for your tools here!
    //
    // Example:
    // case "get_currency_rate":
    //   result = await executeGetCurrencyRateTool(toolArgs, env, userId);
    //   break;
    //
    // CRITICAL: Case names MUST match tool IDs from getOrCreateServer() and handleToolsList()
    // CRITICAL: Executor functions MUST return { content: [...], structuredContent: data }

    switch (toolName) {
      // Tools will be added here (manually or via generator)

      default:
        return jsonRpcResponse(request.id, null, {
          code: -32601,
          message: `Unknown tool: ${toolName}`,
        });
    }

    console.log(`✅ [HTTP] Tool ${toolName} completed successfully`);

    return jsonRpcResponse(request.id, result);
  } catch (error) {
    console.error(`❌ [HTTP] Tool ${toolName} failed:`, error);
    return jsonRpcResponse(request.id, null, {
      code: -32603,
      message: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

// ==============================================================================
// LOCATION 4: TOOL EXECUTOR FUNCTIONS
// ==============================================================================
// Executor functions implement the actual tool logic for API key authentication
// These functions are called from the switch statement in handleToolsCall()
//
// TODO: Add tool executor functions here
//
// Example format:
// async function executeGetCurrencyRateTool(
//   args: Record<string, any>,
//   env: Env,
//   userId: string
// ): Promise<any> {
//   const TOOL_COST = 1;
//   const TOOL_NAME = "get_currency_rate";
//   const actionId = crypto.randomUUID();
//
//   // Step 2: Check token balance
//   const balanceCheck = await checkBalance(env.TOKEN_DB, userId, TOOL_COST);
//
//   // Step 3: Handle insufficient balance
//   if (balanceCheck.userDeleted) {
//     throw new Error(formatAccountDeletedError(TOOL_NAME));
//   }
//   if (!balanceCheck.sufficient) {
//     throw new Error(formatInsufficientTokensError(TOOL_NAME, balanceCheck.currentBalance, TOOL_COST));
//   }
//
//   // Step 4: Execute business logic
//   const { currencyCode, date } = args;
//   const endpoint = date
//     ? `${NBP_API}/rates/c/${currencyCode}/${date}?format=json`
//     : `${NBP_API}/rates/c/${currencyCode}?format=json`;
//   const response = await fetch(endpoint);
//   const data = await response.json();
//
//   // Step 4.5: Apply security (sanitizeOutput + redactPII)
//   const sanitized = sanitizeOutput(JSON.stringify(data), {
//     removeHtml: true,
//     removeControlChars: true,
//     normalizeWhitespace: true,
//     maxLength: 5000
//   });
//   const { redacted, detectedPII } = redactPII(sanitized, {
//     redactPhones: true,
//     redactCreditCards: true,
//     redactPESEL: true
//   });
//
//   // Step 5: Consume tokens
//   await consumeTokensWithRetry(
//     env.TOKEN_DB,
//     userId,
//     TOOL_COST,
//     "skeleton-mcp",  // TODO: Replace with your server slug
//     TOOL_NAME,
//     args,
//     redacted,
//     true,
//     actionId
//   );
//
//   // Step 6: Return result with BOTH content and structuredContent
//   // structuredContent (NEW in SDK 1.20+) provides machine-readable data for LLMs
//   return {
//     content: [{ type: "text", text: redacted }],
//     structuredContent: data  // NEW: Direct structured access (raw API response)
//   };
// }
//
// CRITICAL: Executor logic MUST be IDENTICAL to OAuth path (src/server.ts)

// ==============================================================================
// JSON-RPC & UTILITY FUNCTIONS
// ==============================================================================

/**
 * Create a JSON-RPC 2.0 response
 */
function jsonRpcResponse(
  id: number | string,
  result: any = null,
  error: { code: number; message: string } | null = null
): Response {
  const response: any = {
    jsonrpc: "2.0",
    id,
  };

  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Handle SSE (Server-Sent Events) transport for MCP protocol
 *
 * SSE is used by AnythingLLM and other clients for real-time MCP communication.
 * This uses the standard MCP SDK SSEServerTransport for Cloudflare Workers.
 *
 * @param server - Configured MCP server instance
 * @param request - Incoming HTTP request
 * @returns SSE response stream
 */
async function handleSSETransport(server: McpServer, request: Request): Promise<Response> {
  console.log("📡 [API Key Auth] Setting up SSE transport");

  try {
    // For Cloudflare Workers, we need to return a Response with a ReadableStream
    // The MCP SDK's SSEServerTransport expects Node.js streams, so we'll implement
    // SSE manually for Cloudflare Workers compatibility

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Send SSE headers
    const response = new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });

    // Connect server to client (handle in background)
    // Note: This is a simplified implementation for API key auth
    // Full SSE support would require handling POST messages from client

    (async () => {
      try {
        // Send initial connection event
        await writer.write(encoder.encode("event: message\n"));
        await writer.write(encoder.encode('data: {"status":"connected"}\n\n'));

        console.log("✅ [API Key Auth] SSE connection established");

        // Keep connection alive
        const keepAliveInterval = setInterval(async () => {
          try {
            await writer.write(encoder.encode(": keepalive\n\n"));
          } catch (e) {
            clearInterval(keepAliveInterval);
          }
        }, 30000);

        // Note: Full MCP protocol implementation would go here
        // For MVP, we're providing basic SSE connectivity
      } catch (error) {
        console.error("❌ [API Key Auth] SSE error:", error);
        await writer.close();
      }
    })();

    return response;
  } catch (error) {
    console.error("❌ [API Key Auth] SSE transport error:", error);
    throw error;
  }
}

/**
 * Helper function to return JSON error responses
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @returns JSON error response
 */
function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({
      error: message,
      status: status,
    }),
    {
      status: status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
