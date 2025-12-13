/**
 * UI Resource definitions for MCP Apps (SEP-1865)
 * Each resource represents an interactive widget delivered via Assets binding.
 */

export interface UIResourceMeta {
  ui: {
    csp: {
      connectDomains: string[];    // Domains for fetch/XHR/WebSocket
      resourceDomains: string[];   // Domains for images/scripts/fonts/media
    };
    prefersBorder: boolean;
    domain?: string;
  };
}

export interface UIResourceDefinition {
  uri: string;                     // ui://quiz/widget
  name: string;                    // quiz_widget (for logging)
  description: string;
  mimeType: "text/html;profile=mcp-app";
  _meta: UIResourceMeta;
}

export const UI_RESOURCES = {
  quiz: {
    uri: "ui://quiz/widget",
    name: "quiz_widget",
    description: "Interactive general knowledge quiz with 8 questions. Widget manages state internally and sends completion message to host.",
    mimeType: "text/html;profile=mcp-app" as const,
    _meta: {
      ui: {
        csp: {
          connectDomains: [],      // No external API calls
          resourceDomains: [],     // All assets bundled in HTML
        },
        prefersBorder: true,
      },
    },
  },
} satisfies Record<string, UIResourceDefinition>;

export const UI_MIME_TYPE = "text/html;profile=mcp-app";
