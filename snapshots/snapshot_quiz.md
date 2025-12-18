# General Knowledge Quiz MCP App - Infrastructure Snapshot

**Generated**: 2025-12-18
**Repository**: quiz
**Status**: Production
**Architecture**: MCP Apps (SEP-1865) - Pure Widget Server (No External API)

---

## 1. Project Identity Metrics

- **Human-Readable Name**: General Knowledge Quiz
- **Server Slug**: quiz
- **Wrangler Name**: quiz
- **Server Description**: Interactive general knowledge quiz MCP with 8 questions across various topics. Pure widget-based server with no external API dependencies. Test your knowledge with instant feedback and score tracking.
- **Primary Domain**: https://quiz.wtyczki.ai

### Visual Identity
- **Server Icon**: ✅ Implemented (📝 emoji)
- **Tool Icons**: ✅ Implemented (using tool metadata)
- **Display Name Resolution**: ✅ Title prioritization configured

### MCP Apps (SEP-1865) Configuration
- **Assets Binding**: ✅ ASSETS from ./web/dist/widgets
- **Widget Build System**: ✅ Vite + vite-plugin-singlefile
- **UI Resource URIs**: ui://quiz/widget
- **Two-Part Registration**: ✅ Resource + Tool with _meta linkage

---

## 2. Required Functionalities Status

### 2.1 Dual Authentication (WorkOS + API Keys)
- **OAuth Path Status**: ✅ Implemented
  - Provider: WorkOS AuthKit
  - `/authorize` endpoint: ✅
  - `/callback` validation: ✅
  - USER_SESSIONS KV: ✅ Shared
  - Session expiration: 30 days (2,592,000 seconds)

- **API Key Path Status**: ✅ Implemented
  - `src/api-key-handler.ts`: ✅
  - Format validation (`wtyk_*`): ✅
  - DNS rebinding protection: ✅
  - Dual registration (registerTool + executor): ✅

- **Props Extraction**: ✅ { userId, email, user, permissions }
- **Shared Infrastructure**:
  - D1 Database (mcp-oauth): ✅ eac93639-d58e-4777-82e9-f1e28113d5b2
  - OAUTH_KV: ✅ b77ec4c7e96043fab0c466a978c2f186
  - USER_SESSIONS KV: ✅ e5ad189139cd44f38ba0224c3d596c73

### 2.2 Transport Protocol (McpAgent)
- **`/mcp` Endpoint (Streamable HTTP)**: ✅ Implemented
- **Durable Object Class**: Quiz extends McpAgent
- **WebSocket Hibernation**: ✅ Configured
- **McpAgent SDK**: agents v0.2.14

### 2.3 Tool Implementation (SDK 1.25+)
- **MCP SDK Version**: @modelcontextprotocol/sdk ^1.25.1
- **registerTool() API**: ✅ Used
- **outputSchema (Zod)**: ✅ Defined for all tools
- **structuredContent**: ✅ Returned
- **isError Flag**: ✅ Implemented
- **Tool Descriptions**: ✅ 4-part pattern (Purpose → Returns → Use Case → Constraints)

### 2.4 Tool Descriptions (4-Part Pattern)
- **Part 1 (Purpose)**: ✅ "Starts [what]"
- **Part 2 (Returns)**: ✅ "Returns [outcome]"
- **Part 3 (Use Case)**: ✅ "Use this when [scenario]"
- **Part 4 (Constraints)**: ✅ "The widget [behavior]"
- **Vendor names hidden**: ✅ No vendors (pure widget)
- **Dual-path consistency**: ✅ Identical

### 2.5 Centralized Login (panel.wtyczki.ai)
- **USER_SESSIONS KV Integration**: ✅ Implemented
- **Session cookie check**: ✅ Implemented
- **Database validation**: ✅ `is_deleted` check
- **Redirect flow**: ✅ Configured (redirects to panel.wtyczki.ai/auth/login-custom)

### 2.6 Prompts (SDK 1.20+ Server Primitive)
- **Prompts Capability**: ❌ Not declared
- **Total Prompts Registered**: 0
- **registerPrompt() API**: ❌ Not used
- **Zod Validation**: N/A
- **Naming Convention**: N/A

**Prompt List**: None

---

## 3. Optional Functionalities Status

### 3.1 Stateful Session
- **Status**: ❌ Not Needed
- **initialState**: N/A (stateless server)
- **State usage**: Widget manages state internally (React component state)

### 3.2 Completions (OAuth only)
- **Status**: ❌ Not Implemented
- **completable() wrapper**: ❌
- **Use cases**: N/A

### 3.3 Workers AI (Pattern 3)
- **Status**: ❌ Not configured
- **Binding**: N/A
- **Model ID**: N/A
- **Use cases**: N/A
- **KV caching**: ❌

### 3.4 Workflows & Async Processing (Pattern 4)
- **Status**: ❌ Not configured
- **Binding**: N/A
- **Workflow Class**: N/A
- **Tool pair pattern**: ❌ N/A
- **R2 storage**: ❌ N/A

### 3.5 Rate Limiting (Pattern 5)
- **Status**: ❌ Not Needed (FREE server)
- **DO state tracking**: ❌
- **Multi-key rotation**: ❌
- **Backoff responses**: ❌

### 3.6 KV Caching Strategy
- **Status**: ❌ Not Implemented
- **Binding**: N/A (no external data to cache)
- **Cache TTL**: N/A
- **Cache key pattern**: N/A

### 3.7 R2 Storage & Export
- **Status**: ❌ Not Implemented
- **Binding**: N/A
- **Bucket name**: N/A
- **Use cases**: N/A
- **Signed URLs**: ❌

### 3.8 ResourceLinks
- **Status**: ❌ Not Implemented
- **type: 'resource_link'**: ❌

### 3.9 Elicitation
- **Status**: ❌ Not Needed
- **Form mode**: ❌
- **URL mode**: ❌

### 3.10 Dynamic Tools
- **Status**: ❌ Not Implemented
- **Dynamic control methods**: N/A

### 3.11 Tasks Protocol (Experimental)
- **Status**: ❌ Not Needed
- **TaskManager DO**: ❌
- **tasks/get endpoint**: ❌
- **tasks/result endpoint**: ❌
- **tasks/cancel endpoint**: ❌

### 3.12 Resources (MCP Apps - SEP-1865)
- **Status**: ✅ Implemented
- **registerResource() API**: ✅ Used
- **Resource URIs**: ui://quiz/widget
- **Resource Templates**: ✅ Predeclared
- **MIME Type**: text/html;profile=mcp-app (UI_MIME_TYPE constant)
- **Handler Pattern**: ✅ async handler with loadHtml()
- **_meta Field**: ✅ Includes icon, description, CSP, priority

**Example Resource Registration**:
```typescript
this.server.registerResource(
    quizResource.uri,    // "ui://quiz/widget"
    quizResource.uri,    // Same for predeclared resources
    {
        description: quizResource.description,
        mimeType: UI_MIME_TYPE,
    },
    async () => {
        const html = await loadHtml(this.env.ASSETS, "/quiz.html");
        return {
            contents: [{
                uri: quizResource.uri,
                mimeType: UI_MIME_TYPE,
                text: html,
                _meta: quizResource._meta,
            }],
        };
    }
);
```

### 3.13 Sampling
- **Status**: ❌ Not Needed
- **createMessage() API**: ❌

---

## 4. Detailed Tool Audit (Tool Inventory)

### Tool Registry
**Total Tools**: 1

---

#### Tool 1: start_quiz

**Technical Name**: `start_quiz`

**Display Title**: Start General Knowledge Quiz

**Description (Verbatim)**:
> "Starts an interactive general knowledge quiz widget with 8 questions across various topics. Returns an embedded UI where users answer questions and see their final score. Use this when the user wants to test their knowledge with a quick, interactive quiz. The widget manages state internally and automatically sends completion messages to the host when finished. Each quiz session creates a new instance with randomized question order."

**Input Schema**:
- No parameters (empty object)

**Output Schema**:
- ✅ Defined
- **Fields**: message (confirmation text), widget_uri (ui://quiz/widget)

**Dual Auth Parity**: ✅ Confirmed
- OAuth Path: src/server.ts:69-82
- API Key Path (Registration): src/api-key-handler.ts:280-298
- API Key Path (Executor): src/api-key-handler.ts:690-700

**Implementation Details**:
- **External API**: None (pure widget server)
- **Authentication**: Required (OAuth or API key)
- **Timeout**: N/A (instant widget launch)
- **Cache TTL**: N/A
- **Pricing Model**: FREE (0 tokens)
- **Special patterns**: Two-part registration with UI widget linkage

**Output Format**:
- Returns confirmation message + widget URI for rendering

**Tool Behavior Hints**:
- **readOnlyHint**: ✅ (safe operation)
- **destructiveHint**: ❌
- **idempotentHint**: ❌ (each quiz is unique session)
- **openWorldHint**: ❌ (no external interactions)

**MCP Prompt Integration**: ❌ Not referenced in prompts

---

## 5. UX & Frontend Quality Assessment (6 Pillars)

### Pillar I: Identity & First Impression
- **Unique server name**: ✅ "General Knowledge Quiz"
- **Server icons**: ✅ Configured (📝 emoji)
- **Tool icons**: ✅ Configured in tool metadata
- **Display name resolution**: ✅ Title prioritization implemented
- **4-part tool descriptions**: ✅ All tools follow pattern
- **Shared description constants**: ✅ Centralized in tool-descriptions.ts

### Pillar II: Model Control & Quality
- **Server instructions (System Prompt)**: ✅ Implemented
  - **Word count**: ~400 words
  - **Coverage**: Quiz purpose, widget functionality, auto-completion, dark mode support, error handling
- **Input schema descriptions + examples**: ✅ Schema documented (though no parameters)
- **outputSchema**: ✅ Tool has Zod schema
- **structuredContent**: ✅ Tool returns structured data
- **Format examples**: N/A (no input parameters)
- **Optional vs Required clarity**: ✅ Explicit in schemas
- **Cross-tool workflow patterns**: N/A (single tool server)

### Pillar III: Interactivity & Agency
- **Tool completions (autocomplete)**: ❌ Not implemented
- **Context-aware completions**: ❌ Not implemented
- **Elicitation (Forms/URLs)**: ❌ Not needed
- **Sampling capability**: ❌ Not needed
- **Prompt templates**: ❌ No prompts registered
- **Prompt arguments**: N/A
- **Multi-modal prompts**: N/A

### Pillar IV: Context & Data Management
- **Resource URIs & Templates**: ✅ Predeclared resource (ui://quiz/widget)
- **Resource metadata & Icons**: ✅ _meta field with CSP, prefersBorder, icon, priority
- **ResourceLinks**: ❌ Not implemented
- **Embedded resources**: ✅ Widget HTML embedded in resource
- **Last modified & Priority**: ✅ Priority set to 1
- **Resource subscriptions**: ❌ Not implemented
- **Roots support**: ❌ Not applicable
- **Size hints & Truncation warnings**: ❌ Not needed

### Pillar V: Media & Content Handling
- **MIME type declaration**: ✅ text/html;profile=mcp-app
- **Audio & Image content (base64)**: ❌ Not applicable (background image in widget)
- **Data URI support**: ❌ Not applicable
- **Content annotations (audience)**: ❌ Not implemented

### Pillar VI: Operations & Transparency
- **Tasks protocol support**: ❌ Not needed
- **Polling, Cancellation, TTL**: ❌ Not needed
- **Structured logs (RFC-5424)**: ✅ Structured logging via logger.ts
- **isError flag**: ✅ Implemented in tool handler

---

## 6. Deployment Status

### Consistency Tests
- **Script**: `../../scripts/verify-consistency.sh`
- **Result**: ✅ All checks passed

**Verified Components**:
- Durable Objects configuration: ✅
- KV namespace bindings: ✅
- D1 database binding: ✅
- R2 bucket binding: ❌ N/A
- Workers AI binding: ❌ N/A
- Workflows binding: ❌ N/A
- Custom domain configuration: ✅

### TypeScript Compilation
- **Command**: `npx tsc --noEmit`
- **Result**: ✅ No errors
- **Errors**: N/A

### Production URL
- **Primary Domain**: https://quiz.wtyczki.ai
- **Workers.dev**: ✅ Disabled

**Custom Domain Configuration**:
- Pattern: quiz.wtyczki.ai
- Custom Domain: ✅ Enabled
- Automatic DNS: ✅
- Automatic TLS: ✅

---

## 7. Infrastructure Components

### Cloudflare Assets (MCP Apps)
- **Binding**: ASSETS
- **Directory**: ./web/dist/widgets
- **Purpose**: Serving built widget HTML files for MCP Apps (SEP-1865)
- **Build Command**: npm run build:widgets
- **Widget Files**: quiz.html (single-file React bundle)

### Durable Objects
1. **Quiz extends McpAgent**: MCP protocol handling, stateless operation
   - Migration tag: v1
   - Purpose: Handle MCP protocol requests (no application state)

### KV Namespaces (Shared Across All MCP Apps)
1. **OAUTH_KV**: OAuth token storage for WorkOS AuthKit
   - ID: b77ec4c7e96043fab0c466a978c2f186
   - Preview ID: cf8ef9f38ab24ae583d20dd4e973810c
   - Purpose: McpAgent OAuth handling (required by agents SDK)

2. **USER_SESSIONS**: Centralized session management (shared with panel.wtyczki.ai)
   - ID: e5ad189139cd44f38ba0224c3d596c73
   - Preview ID: 49c43fb4d6e242db87fd885ba46b5a1d
   - Purpose: Cross-service session validation
   - TTL: 30 days (2,592,000 seconds)

### D1 Database (Shared Across All MCP Apps)
- **Binding**: TOKEN_DB
- **Database Name**: mcp-oauth
- **Database ID**: eac93639-d58e-4777-82e9-f1e28113d5b2
- **Tables**:
  - users (id, email, workos_user_id, created_at, is_deleted)
  - api_keys (id, user_id, key_hash, description, created_at, is_deleted)
- **Purpose**: Centralized authentication and authorization for all MCP servers
- **Note**: Database may contain additional tables; only authentication-related tables listed here

### R2 Storage
- **Binding**: N/A
- **Bucket Name**: N/A
- **Purpose**: N/A
- **Retention**: N/A
- **Public Access**: N/A

### Workers AI
- **Binding**: N/A
- **Status**: ❌ Not configured
- **Model(s)**: N/A
- **Use cases**: N/A
- **Integration**: ❌ Not configured

### AI Gateway (Shared)
- **Status**: ✅ Configured
- **Gateway ID**: mcp-production-gateway (shared across all MCP servers)
- **Environment Variable**: AI_GATEWAY_ID
- **Cache Policy**: Not used (no AI requests)
- **Rate Limiting**: Not used (no AI requests)
- **Purpose**: Reserved for future features

### Workflows (Cloudflare)
- **Binding**: N/A
- **Workflow Name**: N/A
- **Class**: N/A
- **Status**: ❌ Not configured
- **Use cases**: N/A

### Secrets (Wrangler)
**Required (Shared)**:
1. **WORKOS_CLIENT_ID**: ✅ Set - WorkOS AuthKit client ID
2. **WORKOS_API_KEY**: ✅ Set - WorkOS API key for user validation

**Optional (Server-Specific)**:
3. **AI_GATEWAY_TOKEN**: ✅ Set - Reserved for future AI features

---

## 8. Architecture Patterns

### Authentication Architecture
- **Dual Transport**: ✅ OAuth + API Keys
  - OAuth Path: POST /mcp (McpAgent Durable Object)
  - API Key Path: POST /mcp (Direct HTTP handler with LRU cache)

### Caching Strategy
- **Pattern**: LRU Server Cache (API Key Mode Only)
- **Implementation**: Cache MCP server instances per user (max 1000)

**Rationale**:
- No external data to cache (pure widget)
- Server instance caching improves API key response times
- OAuth path uses McpAgent (no instance caching needed)

### Concurrency Control
- **Pattern**: None (stateless tool execution)
- **Implementation**: N/A

### Storage Architecture
- **Pattern**: Pure Widget Server (No External Storage)
- **Workflow**: Widget manages all quiz data internally (hardcoded questions)

---

## 9. Code Quality

### Type Safety
- **TypeScript**: ✅ Strict mode
- **Zod Schemas**: ✅ Tool schemas defined
- **Custom Validation**: None needed (no input parameters)

### Error Handling
- **Account deleted check**: ✅ Implemented (via shared D1 database)
- **External API failures**: N/A (no external API)
- **Invalid inputs**: N/A (no input parameters)
- **Empty/Zero results**: N/A (widget always launches)
- **Widget errors**: ✅ Handled (refresh on error, centralized OAuth errors)

### Observability
- **Cloudflare Observability**: ✅ Enabled

**Console Logging**:
- Authentication events (OAuth, API key validation)
- Tool execution (start, completion)
- Widget lifecycle (tool input, tool result, teardown)
- Session management

**Monitoring Points**:
- Tool execution duration
- Widget launch success rate
- Session validation

---

## 10. Technical Specifications

### Performance
- **Tool timeout**: N/A (instant widget launch)
- **Cache TTL**: N/A (no external data)
- **Max response size**: ~200KB (single-file HTML widget)
- **Expected latency**:
  - start_quiz: <100ms (widget launch)
  - Widget render: <2 seconds (first paint)

### Dependencies

**Production (Common Across MCP Apps)**:
```json
{
  "@cloudflare/workers-oauth-provider": "^0.1.0",
  "@modelcontextprotocol/ext-apps": "^0.2.0",
  "@modelcontextprotocol/sdk": "^1.25.1",
  "@workos-inc/node": "^7.73.0",
  "agents": "^0.2.14",
  "hono": "^4.10.3",
  "jose": "^6.1.0",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "zod": "^4.1.13"
}
```

**Production (Widget-Specific)**:
```json
{
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.4.0"
}
```

**Development**:
```json
{
  "@cloudflare/workers-types": "^4.20250101.0",
  "@types/react": "^18.3.0",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.3.4",
  "autoprefixer": "^10.4.20",
  "concurrently": "^9.2.1",
  "postcss": "^8.4.49",
  "tailwindcss": "^3.4.17",
  "typescript": "^5.9.2",
  "vite": "^6.0.6",
  "vite-plugin-singlefile": "^2.0.3",
  "wrangler": "^4.40.1"
}
```

### SDK Versions
- **MCP SDK**: @modelcontextprotocol/sdk ^1.25.1
- **MCP Apps Extension**: @modelcontextprotocol/ext-apps ^0.2.0
- **Cloudflare Agents SDK**: agents ^0.2.14
- **WorkOS SDK**: @workos-inc/node ^7.73.0
- **Hono Framework**: hono ^4.10.3
- **Zod Validation**: zod ^4.1.13
- **JWT Handling**: jose ^6.1.0

---

## 11. Compliance Summary

| Check | Status | Notes |
|---|---|---|
| Vendor Hiding | ✅ | No vendors (pure widget) |
| Dual Auth Parity | ✅ | OAuth and API key paths identical |
| 4-Part Descriptions | ✅ | Tool follows pattern |
| Custom Domain | ✅ | quiz.wtyczki.ai |
| Workers.dev Disabled | ✅ | Production security enforced |
| Consistency Tests | ✅ | All infrastructure checks passed |
| TypeScript Compilation | ✅ | No errors |
| Prompts Implemented | ❌ | No prompts (not needed for quiz) |

---

## 12. Unique Architectural Features

### Pure Widget Server Pattern
The Quiz MCP server represents the "Pure Widget Server" pattern - no external API integration:
- **Zero External Dependencies**: All data hardcoded in widget (quizData.ts)
- **Instant Response**: No API wait times, immediate interaction
- **Offline Capable**: Could work completely disconnected
- **Simplicity**: Minimal infrastructure requirements

**Why This Matters**:
- Fastest possible user experience (no network latency)
- Lowest operational costs (no API rate limits or quotas)
- Highest reliability (no external failure points)
- Ideal for educational/demo MCP servers

### Fixed Height Container Pattern
Implements the "Fixed Height Container" pattern to prevent infinite resize loops:
```typescript
<div style={{ minHeight: '600px', maxHeight: '600px', overflow: 'auto' }}>
  {/* Quiz content */}
</div>
```

**Rationale**:
- Prevents resize loop between widget and host
- Ensures consistent layout across all screens
- Borrowed from OpenSky Flight Tracker implementation
- MCP Apps best practice for complex widgets

### Automatic Completion Messaging
Widget automatically sends completion messages to host:
```typescript
app?.message({
  role: 'user',
  content: [{
    type: 'text',
    text: `Quiz completed! Final score: ${score}/${total}`
  }]
});
```

**Benefits**:
- Host knows when quiz is finished
- Enables conversation continuity
- Provides structured completion data
- Supports multi-turn interactions

### Single-File Widget Bundle
Uses vite-plugin-singlefile to bundle entire React app into one HTML file:
- **Bundle Size**: ~200KB (all CSS/JS inlined)
- **No External Requests**: Fully self-contained
- **Easy Distribution**: Single file to deploy
- **Security**: No CDN dependencies

**Rationale**:
- Simplifies deployment (one file in Assets binding)
- Improves loading performance (no waterfall requests)
- Reduces attack surface (no external resources)
- Aligns with MCP Apps security model

### Free Public Service Model
Like OpenSky and NBP Exchange, Quiz operates as a free service:
- **No token consumption**: Tool costs 0 tokens
- **No balance checks**: No database queries for balances
- **Educational focus**: Accessible to all users
- **Demo/reference**: Shows MCP Apps value without paywalls

**Rationale**:
- Quiz data is trivial (public knowledge questions)
- Educational and entertainment use cases
- Demonstrates pure widget pattern
- Reference implementation for widget-only servers

### LRU Server Cache (API Key Mode)
Implements ephemeral LRU cache for MCP server instances:
- **Max Size**: 1000 servers
- **Eviction**: Least Recently Used (LRU)
- **Cache Hit**: ~1ms response time
- **Cache Miss**: ~10-50ms server creation

**Safety**:
- Ephemeral (Worker-instance-specific)
- Non-persistent (cleared on Worker eviction)
- No critical state (widget data is hardcoded)

### Centralized Session Management
Sessions stored in shared KV namespace (USER_SESSIONS):
- **TTL**: 30 days (2,592,000 seconds)
- **Auto-Refresh**: Token refresh on expiration
- **Redirect Flow**: Unified login via panel.wtyczki.ai/auth/login-custom

**Benefits**:
- Single login across all MCP servers
- Persistent sessions (30 days)
- Unified user experience

---

## 13. Known Issues & Limitations

1. **Hardcoded Questions**: Only 8 questions, no variation (future: question bank)
2. **No Persistence**: Quiz scores not saved (stateless widget)
3. **No Leaderboards**: No competitive features
4. **Single Language**: English only
5. **Fixed Difficulty**: No easy/medium/hard modes
6. **No Categories**: All questions mixed together

---

## 14. Future Roadmap

**Planned Components**:
- Question bank expansion (100+ questions)
- Multiple quiz categories (science, history, geography, etc.)
- Difficulty levels (easy, medium, hard)
- Score persistence (save to D1 database)
- Leaderboards (global and friends)
- Multi-language support (Polish, Spanish, French)

**Planned Use Cases**:
1. Educational assessment (teachers assign quizzes)
2. Team building (multiplayer quiz competitions)
3. Study tool (review questions in specific subjects)
4. Entertainment (casual knowledge testing)

---

## 15. Testing Status

### Unit Tests
- **Status**: ❌ Not implemented
- **Coverage**: N/A

### Integration Tests
- **Status**: ❌ Not implemented
- **Endpoints tested**: N/A

### Manual Testing Checklist
- [x] OAuth flow (desktop client)
- [x] API key authentication
- [x] Tool execution
- [x] Widget rendering
- [x] Quiz state machine (IDLE → PLAYING → FINISHED)
- [x] Dark mode support
- [x] Completion message
- [ ] Error recovery scenarios
- [ ] Session expiration

---

## 16. Documentation Status

- **README.md**: ✅ Complete
- **API Documentation**: ✅ Complete (server-instructions.ts)
- **Setup Guide**: ✅ Complete
- **Troubleshooting Guide**: ⚠️ Incomplete
- **Deployment Guide**: ✅ Complete

---

## 17. File Structure (MCP Apps Standard)

### Source Files (`src/`)
```
src/
├── index.ts                    # Entry point (Dual auth router, DO exports)
├── server.ts                   # McpAgent class (OAuth path)
├── api-key-handler.ts          # API key authentication path with LRU cache
├── api-client.ts               # Placeholder (unused - no external API)
├── types.ts                    # TypeScript type definitions
├── tool-descriptions.ts        # Tool metadata (4-part pattern)
├── server-instructions.ts      # System prompt for LLM
├── auth/                       # Authentication helpers
│   ├── authkit-handler.ts      # WorkOS OAuth flow
│   ├── apiKeys.ts              # API key generation/validation
│   ├── props.ts                # Auth context type
│   ├── auth-utils.ts           # Helper functions
│   └── session-types.ts        # Session interfaces
├── helpers/                    # Utility functions
│   └── assets.ts               # loadHtml() for Assets binding
├── resources/                  # UI resource definitions
│   └── ui-resources.ts         # UI_RESOURCES constant with uri, _meta
├── schemas/                    # Zod schemas
│   ├── inputs.ts               # Input validation schemas
│   └── outputs.ts              # Output schemas for structuredContent
├── shared/                     # Shared utilities
│   ├── logger.ts               # Logging helper
│   └── constants.ts            # Configuration constants
└── tools/                      # Tool implementations
    ├── index.ts                # Tool exports
    └── quiz-tools.ts           # executeStartQuiz
```

### Widget Files (`web/widgets/`)
```
web/widgets/
├── quiz.html                   # HTML entry point for Vite
├── quiz.tsx                    # Widget implementation (React)
└── photo_background.webp       # Background image (8KB)
```

### Widget Support Files (`web/`)
```
web/
├── lib/
│   ├── quizData.ts             # 8 hardcoded questions
│   ├── types.ts                # Widget types (QuizState, QuizData)
│   └── security-test.ts        # Security validation
└── styles/
    └── globals.css             # Tailwind CSS
```

### Build Output (`web/dist/widgets/`)
```
web/dist/widgets/
└── quiz.html                   # Single-file HTML output (~200KB)
```

### Configuration Files
```
├── wrangler.jsonc              # Cloudflare Workers configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # Server TypeScript configuration
├── vite.config.ts              # Vite build configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration
```

### Common Scripts (package.json)
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "dev:full": "concurrently \"npm run dev\" \"npm run watch:widgets\"",
    "deploy": "npm run build:widgets && wrangler deploy",
    "build:widget:quiz": "INPUT=widgets/quiz.html vite build",
    "build:widgets": "npm run build:widget:quiz",
    "watch:widgets": "npm run dev:widget",
    "dev:widget": "INPUT=widgets/quiz.html vite build --watch"
  }
}
```

---

**End of Snapshot**

---

## Appendix A: MCP Apps (SEP-1865) Quick Reference

### Two-Part Registration Pattern

**Part 1: Register Resource**
```typescript
this.server.registerResource(
    resourceUri,                    // "ui://quiz/widget"
    resourceUri,                    // Same for predeclared
    { description, mimeType },
    async () => ({ contents: [{ uri, mimeType, text, _meta }] })
);
```

**Part 2: Register Tool with _meta Linkage**
```typescript
this.server.registerTool(
    toolId,
    {
        description,
        inputSchema,
        outputSchema,
        _meta: {
            [RESOURCE_URI_META_KEY]: resourceUri  // Links to UI
        }
    },
    async (params) => ({
        content: [{
            type: 'text',
            text: result
        }],
        structuredContent: validatedOutput,
        isError: false
    })
);
```

### Widget Build Configuration (vite.config.ts)
```typescript
export default defineConfig({
    plugins: [
        react(),
        viteSingleFile()  // Bundles to single HTML
    ],
    build: {
        rollupOptions: {
            input: process.env.INPUT || 'widgets/default.html'
        }
    }
});
```

---

## Appendix B: AnythingLLM Configuration Example

**Standard MCP Configuration** (for API key authentication):
```json
{
  "mcpServers": {
    "quiz": {
      "url": "https://quiz.wtyczki.ai/mcp",
      "transport": "http",
      "headers": {
        "Authorization": "Bearer wtyk_YOUR_API_KEY_HERE"
      }
    }
  }
}
```

**Notes**:
- Server name ("quiz") is a local identifier - customize as needed
- API key must start with `wtyk_` prefix
- Use `/mcp` endpoint for streamable HTTP transport

---

## Appendix C: Common Architecture Patterns

### Pattern 1: Stateless External API Server
**Example**: nbp-exchange (NBP Exchange Rates)
- No Durable Object state management
- Direct API calls to external service
- No caching (real-time data expected)
- Simple, synchronous tool execution

### Pattern 2: Stateful OAuth Token Caching
**Example**: opensky (OpenSky Flight Tracker)
- Durable Object stores OAuth access token
- Token auto-refresh every 30 minutes
- State: `{ opensky_access_token, opensky_token_expires_at }`

### Pattern 3: Pure Widget Server
**Example**: quiz (General Knowledge Quiz)
- No external API calls
- Widget manages state internally
- Single tool launches widget
- Hardcoded data in widget

---

## Appendix D: Checklist References

This snapshot template is based on the following checklists:
- `features/CHECKLIST_BACKEND.md` - Backend requirements
- `features/CHECKLIST_FRONTEND.md` - 6 Pillars of MCP Server Maturity
- `features/OPTIONAL_FEATURES.md` - Optional features guide
- `features/SERVER_REQUIREMENTS_CHECKLIST.md` - Required vs optional breakdown
- `features/UX_IMPLEMENTATION_CHECKLIST.md` - UX quality checklist

---

## Appendix E: Quick Commands

**Development**:
```bash
npm run dev                    # Start local dev server
npm run dev:full              # Dev server + widget watch mode
npm run type-check            # TypeScript validation
```

**Building & Deployment**:
```bash
npm run build:widgets         # Build all widgets
npm run deploy                # Build widgets + deploy to Cloudflare
```

**Secrets Management**:
```bash
wrangler secret put WORKOS_CLIENT_ID
wrangler secret put WORKOS_API_KEY
wrangler secret put AI_GATEWAY_TOKEN
wrangler secret list          # View configured secrets
```

**Testing**:
```bash
../../scripts/verify-consistency.sh    # Verify infrastructure consistency
npx tsc --noEmit                       # Type check without building
```

---

## Appendix F: Quiz Data Structure

**Location**: `/Users/patpil/cloudflare_mcp_projects/cloudflare_mcp_apps/projects/quiz/web/lib/quizData.ts`

**Structure**:
```typescript
export const quizData = [
  {
    question: "What is the capital of France?",
    answers: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2  // Index of correct answer (0-based)
  },
  // ... 7 more questions
];
```

**Topics Covered**:
1. Geography (capitals, countries)
2. Science (elements, discoveries)
3. History (events, dates)
4. General knowledge (mixed topics)

**Total Questions**: 8
**Format**: Multiple choice (4 options)
**Scoring**: 1 point per correct answer
**Feedback**: Immediate (green/red) after each answer
