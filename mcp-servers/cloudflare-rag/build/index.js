#!/usr/bin/env node
import { MCPServer } from "mcp-framework";
import * as dotenv from "dotenv";
// Load environment variables
dotenv.config();
// Import tools for registration
console.log(`[Server] Importing CloudflareRagSearchTool...`);
import "./tools/CloudflareRagSearchTool.js";
// Cloudflare API configuration
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "e61c0c9130c9e6736e8259692d2b0d8c";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_RAG_NAME = process.env.CLOUDFLARE_RAG_NAME || "merris-rag-testing";
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
// Create server with HTTP Stream Transport
const server = new MCPServer({
    transport: {
        type: "http-stream",
        options: {
            port: PORT,
            cors: {
                allowOrigin: "*"
            },
            responseMode: "stream"
        }
    }
});
// Start the server
server.start().then(() => {
    console.log(`🚀 Cloudflare RAG MCP Server (Framework) running on http://localhost:${PORT}`);
    console.log(`📡 MCP Stream endpoint: http://localhost:${PORT}/mcp`);
    console.log(`❤️  Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Configuration:`);
    console.log(`   - Account ID: ${CLOUDFLARE_ACCOUNT_ID}`);
    console.log(`   - RAG Name: ${CLOUDFLARE_RAG_NAME}`);
    console.log(`   - API Token: ${CLOUDFLARE_API_TOKEN ? "✓ Configured" : "✗ Not configured"}`);
    console.log(`🛠️  Tools will be auto-discovered from src/tools/ directory`);
}).catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
