MCP Server Idea Template (v7.0 - OpenSky Architecture Edition)
Based on: OpenSky Flight Map Case Study Architecture: Cloudflare Workers + Hono (Router) + McpAgent (Logic) + Assets (UI) Key Feature: Embedded React Widget via io.modelcontextprotocol/ui

Instructions for AI Agent:
You are building an MCP App following the exact architectural patterns found in the OpenSky MCP Server. The goal is to create a "General Knowledge Quiz" where the logic resides in a React Widget, and the MCP Server acts as the delivery mechanism and host communicator.

Critical Reference: Refer to opensky implementation patterns for:

loadHtml helper implementation.

vite-plugin-singlefile build pipeline.

Fixed height container (h-[600px]) logic to prevent iframe loops.

1. Core Server Identity
Human-Readable Name: General Knowledge Quiz MCP

Class Name (PascalCase): QuizMCP

Server Slug (kebab-case): quiz-mcp

2. Project Purpose & Goals
Core Purpose: Provide a zero-latency, interactive quiz experience within the LLM chat window using MCP Apps. Instead of a chat-based loop, the user interacts with a React widget.

Success Criteria:

Architecture: Clean separation between Hono Router (src/index.ts) and MCP Logic (src/server.ts).

Asset Delivery: The Worker successfully serves the index.html widget via Cloudflare Assets binding (ASSETS).

Protocol Compliance: The server implements resources/list and resources/read to define the UI, and tools link to it via _meta.

UX Stability: The widget renders with a fixed height (600px) to avoid the "Infinite Resize Loop" issue documented in OpenSky.

3. Implementation Blueprint
Foundation / Scaffolding:

Base: mcp-server-skeleton-minimal (augmented with Hono).

Structure:

Plaintext

├── src/
│   ├── index.ts              # Hono Router (Entry Point)
│   ├── server.ts             # QuizMCP class (McpAgent)
│   ├── types.ts              # Env definition (incl. ASSETS: Fetcher)
│   ├── helpers/
│   │   └── assets.ts         # loadHtml() helper (Copy from OpenSky)
│   └── resources/
│       └── ui-resources.ts   # UI Constants & CSP
├── web/
│   ├── widgets/
│   │   └── quiz.tsx          # Main React Component
│   ├── index.html            # Vite Entry Point
│   └── styles/globals.css    # Tailwind + Fixed Height rules
├── vite.config.ts            # vite-plugin-singlefile config
└── wrangler.jsonc            # ASSETS binding configuration
Key Features (Tools):

Tool 1: start-quiz

Functionality: Returns the metadata triggering the UI.

Input Schema: Empty (Zero-shot).

Return Payload:

content: Text fallback ("Quiz started in UI...").

_meta: {"ui/resourceUri": "ui://quiz/widget"}.

UI Resource Definition (in src/resources/ui-resources.ts):

URI: ui://quiz/widget

MIME: text/html;profile=mcp-app

CSP: Strict (no connect-src needed as quiz is local state).

SDK Requirements:

Server: @modelcontextprotocol/sdk

Router: hono (for handling /mcp and /sse routing like in OpenSky).

Client: @modelcontextprotocol/ext-apps (for useApp hook).

4. Frontend Logic (The Widget)
Technology Stack: React 18 + Tailwind CSS + Vite (Single File).

State Machine (inside quiz.tsx):

IDLE: Start screen ("Start Quiz" button).

PLAYING:

Render Question i from hardcoded JSON.

Render 4 buttons.

On click -> feedback (Green/Red) -> Delay 800ms -> i++.

FINISHED:

Show Score (e.g., "6/8").

CRITICAL: Automatically fire app.message() to Host: "User completed the quiz. Score: 6/8".

> **Note (v0.2.0+):** Use `app.message()` instead of the deprecated `app.sendMessage()`.

Styling & Layout (Crucial for OpenSky compliance):

Container: div.h-[600px].overflow-hidden.flex.flex-col

Dark Mode: Implement app.onhostcontextchanged to toggle .dark class.

5. Token Costs & Security
Token Cost:

Tool (start-quiz): 5 tokens.

Justification: Replaces ~20 separate LLM interactions (questions/answers).

Security:

CSP: Enforce in src/server.ts during resource registration.

Sanitization: Use pilpat-mcp-security on the backend tool return.

6. Prompts Design
Prompt 1: play-quiz

Description: "Starts the interactive general knowledge quiz."

Workflow: Calls start-quiz.

7. Build & Deployment Config
vite.config.ts Strategy:

Use vite-plugin-singlefile.

Set root: "web/".

Build output to web/dist/widgets.

wrangler.jsonc:

Enable assets binding pointing to ./web/dist/widgets.

Main entry point: src/index.ts.