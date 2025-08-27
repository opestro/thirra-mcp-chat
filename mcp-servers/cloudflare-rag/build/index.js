#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from "dotenv";
// Load environment variables
dotenv.config();
// Cloudflare API configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "e61c0c9130c9e6736e8259692d2b0d8c";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_RAG_NAME = process.env.CLOUDFLARE_RAG_NAME || "merris-rag-testing";
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
// Create server instance
const server = new McpServer({
    name: "cloudflare-rag",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
// Helper function for making Cloudflare API requests
async function makeCloudflareRequest(endpoint, options = {}) {
    if (!CLOUDFLARE_API_TOKEN) {
        console.error("CLOUDFLARE_API_TOKEN environment variable is required");
        return null;
    }
    const url = `${CLOUDFLARE_API_BASE}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        ...options.headers,
    };
    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            console.error(`Cloudflare API error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error("Error details:", errorText);
            return null;
        }
        return (await response.json());
    }
    catch (error) {
        console.error("Error making Cloudflare request:", error);
        return null;
    }
}
// Register the RAG search tool
server.tool("cloudflare_rag_search", "Search the Cloudflare RAG database for relevant information", {
    query: z.string().describe("The search query to find relevant information"),
    rag_name: z.string().optional().describe("The name of the RAG database (defaults to configured RAG name)"),
    limit: z.number().min(1).max(100).optional().describe("Maximum number of results to return (default: 10)"),
}, async ({ query, rag_name, limit = 10 }) => {
    const ragName = rag_name || CLOUDFLARE_RAG_NAME;
    if (!query.trim()) {
        return {
            content: [
                {
                    type: "text",
                    text: "Query cannot be empty. Please provide a search query.",
                },
            ],
        };
    }
    const endpoint = `/accounts/${CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${ragName}/ai-search`;
    const requestBody = {
        query: query.trim(),
        limit: limit,
    };
    const response = await makeCloudflareRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(requestBody),
    });
    if (!response) {
        return {
            content: [
                {
                    type: "text",
                    text: "Failed to search the RAG database. Please check your API token and configuration.",
                },
            ],
        };
    }
    if (!response.success) {
        const errorMessage = response.errors.length > 0
            ? response.errors.map(e => e.message || JSON.stringify(e)).join(", ")
            : "Unknown error occurred";
        return {
            content: [
                {
                    type: "text",
                    text: `RAG search failed: ${errorMessage}`,
                },
            ],
        };
    }
    const results = response.result.results || [];
    if (results.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `No results found for query: "${query}"`,
                },
            ],
        };
    }
    // Format the results
    const formattedResults = results.map((result, index) => {
        const metadata = result.metadata ?
            Object.entries(result.metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ") : "No metadata";
        return `**Result ${index + 1}** (Score: ${result.score.toFixed(3)})
**Content:** ${result.content}
**Metadata:** ${metadata}
**ID:** ${result.id}`;
    }).join("\n\n---\n\n");
    const resultText = `Found ${results.length} result(s) for query: "${query}"

${formattedResults}`;
    return {
        content: [
            {
                type: "text",
                text: resultText,
            },
        ],
    };
});
// Register a tool to get RAG information
server.tool("cloudflare_rag_info", "Get information about the configured Cloudflare RAG database", {
    rag_name: z.string().optional().describe("The name of the RAG database (defaults to configured RAG name)"),
}, async ({ rag_name }) => {
    const ragName = rag_name || CLOUDFLARE_RAG_NAME;
    return {
        content: [
            {
                type: "text",
                text: `**Cloudflare RAG Configuration:**
- Account ID: ${CLOUDFLARE_ACCOUNT_ID}
- RAG Name: ${ragName}
- API Base: ${CLOUDFLARE_API_BASE}
- API Token: ${CLOUDFLARE_API_TOKEN ? "✓ Configured" : "✗ Not configured"}

**Available Tools:**
- \`cloudflare_rag_search\`: Search the RAG database for relevant information
- \`cloudflare_rag_info\`: Get configuration information (this tool)

**Usage Example:**
Use \`cloudflare_rag_search\` with a query like "What is machine learning?" to search for relevant content in the RAG database.`,
            },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Cloudflare RAG MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
