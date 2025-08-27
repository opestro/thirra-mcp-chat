# Cloudflare RAG MCP Server

An MCP server built with the [MCP Framework](https://mcp-framework.com) that provides access to Cloudflare's RAG (Retrieval-Augmented Generation) API for searching and retrieving relevant information from your RAG database via HTTP streaming.

## Features

- 🔍 **AI-Powered Search**: Search Cloudflare RAG databases using natural language queries with AI-generated summaries
- 🚀 **HTTP Streaming**: Real-time response streaming via MCP Framework
- 🎯 **Smart Results**: Get both AI summaries and detailed source document information
- ⚙️ **Dynamic Configuration**: Support for dynamic RAG database names and configurable result limits
- 🔒 **Secure**: Proper API token authentication with comprehensive error handling

## Setup

### Environment Variables

Create a `.env` file in this directory with the following variables:

```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=e61c0c************692d2b0d8c
CLOUDFLARE_RAG_NAME=rag-testing
```

### Installation

```bash
npm install
npm run build
```

### Dependencies

- **mcp-framework**: Modern HTTP streaming MCP server framework
- **zod**: TypeScript-first schema validation
- **dotenv**: Environment variable management

## Usage

### Available Tools

**`cloudflare_rag_search`** - AI-powered RAG database search
- `query` (required): The search query (e.g., "who is mehdi", "explain machine learning")
- `rag_name` (optional): RAG database name (defaults to configured name)
- `limit` (optional): Maximum results to return (1-100, default: 10)

**Response Format:**
- `ai_response`: AI-generated summary from Cloudflare
- `results`: Detailed source documents with scores and content
- `formatted_summary`: Human-readable formatted response

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
node build/index.js
```

### Claude Desktop Configuration

The server now runs as an HTTP server with Server-Sent Events (SSE) support. You have two options:

#### Option 1: HTTP Stream Configuration (Recommended)

First, start the server:
```bash
CLOUDFLARE_API_TOKEN=your_token PORT=3002 node build/index.js
```

Then add this to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "cloudflare-rag": {
      "url": "http://localhost:3002/mcp"
    }
  }
}
```

#### Option 2: Command-line Configuration (Alternative)

```json
{
  "mcpServers": {
    "cloudflare-rag": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/thirra-mcp-chat/mcp-servers/cloudflare-rag/build/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_token_here",
        "CLOUDFLARE_ACCOUNT_ID": "e61c0c************692d2b0d8c",
        "CLOUDFLARE_RAG_NAME": "rag-testing",
        "PORT": "3002"
      }
    }
  }
}
```

### HTTP Endpoints

When running as HTTP server, the following endpoints are available:

- **Health Check**: `GET http://localhost:3002/health`
- **Server Info**: `GET http://localhost:3002/`
- **MCP Stream**: `GET http://localhost:3002/mcp` (for MCP clients)

### Environment Variables

Set these environment variables when starting the server:

```bash
export CLOUDFLARE_API_TOKEN="your_cloudflare_api_token_here"
export CLOUDFLARE_ACCOUNT_ID="e61c0c************692d2b0d8c"
export CLOUDFLARE_RAG_NAME="rag-testing"
export PORT="3002"  # Optional, defaults to 3002
```

## Example Usage

Once configured, you can use the tool in your MCP client:

**Query**: "who is mehdi"

**Response**:
```json
{
  "query": "mehdi",
  "results_count": 1,
  "rag_name": "mrag-testing",
  "ai_response": "Mehdi Harzallah is a Software Engineer, Web Developer, and DevOps Engineer, as mentioned in his resume. He has experience working with various technologies such as Vue.js, Angular, Nuxt.js, and Docker...",
  "results": [
    {
      "rank": 1,
      "score": 0.436,
      "filename": "MehdiHarzallahResume.pdf",
      "file_id": "b50aa98b-************-c57cf32592db",
      "content": "MEHDI HARZALLAH Software Engineer | Web Development | DevOps...",
      "attributes": {
        "timestamp": 1756313340000,
        "folder": "",
        "filename": "MehdiHarzallahResume.pdf"
      }
    }
  ]
}
```

## API Reference

The server uses the Cloudflare API endpoint:
```
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/autorag/rags/{rag_name}/ai-search
```

With the request body:
```json
{
  "query": "your search query",
  "limit": 10
}
```

## Error Handling

The server includes comprehensive error handling for:
- ❌ Missing API tokens - Returns clear authentication error
- ❌ Invalid RAG database names - Validates database existence
- ❌ API rate limits - Handles Cloudflare API throttling
- ❌ Network connectivity issues - Robust retry logic
- ❌ Empty search results - Returns structured "no results" response
- ❌ Malformed queries - Input validation with descriptive errors

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - Check your `CLOUDFLARE_API_TOKEN` is valid
   - Ensure the token has permissions for RAG operations
   - Verify the token isn't expired

2. **No Results Found**
   - Check if your RAG database contains relevant documents
   - Try different search terms or queries
   - Verify `CLOUDFLARE_RAG_NAME` matches your actual RAG database

3. **Connection Errors**
   - Ensure the server is running on the correct port
   - Check firewall settings
   - Verify the MCP client is connecting to the right endpoint

4. **Tool Not Found**
   - Restart your MCP client (e.g., Claude Desktop)
   - Check the server logs for tool registration
   - Verify the server started without errors

### Debug Mode

Enable verbose logging by setting environment variables:
```bash
MCP_DEBUG_CONSOLE=true node build/index.js
```

### Server Logs

The server provides detailed logs for debugging:
- Tool execution start/finish
- API request/response details
- Error stack traces
- Response parsing information
