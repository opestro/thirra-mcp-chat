# Cloudflare RAG MCP Server

An MCP server that provides access to Cloudflare's RAG (Retrieval-Augmented Generation) API for searching and retrieving relevant information from your RAG database.

## Features

- Search Cloudflare RAG databases using natural language queries
- Retrieve configuration information about your RAG setup
- Support for dynamic RAG database names
- Configurable result limits

## Setup

### Environment Variables

Create a `.env` file in this directory with the following variables:

```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=e61c0c9130c9e6736e8259692d2b0d8c
CLOUDFLARE_RAG_NAME=merris-rag-testing
```

### Installation

```bash
npm install
npm run build
```

## Usage

### Available Tools

1. **`cloudflare_rag_search`** - Search the RAG database
   - `query` (required): The search query
   - `rag_name` (optional): RAG database name (defaults to configured name)
   - `limit` (optional): Maximum results to return (1-100, default: 10)

2. **`cloudflare_rag_info`** - Get RAG configuration information
   - `rag_name` (optional): RAG database name (defaults to configured name)

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
node build/index.js
```

### Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cloudflare-rag": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/thirra-mcp-chat/mcp-servers/cloudflare-rag/build/index.js"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_token_here",
        "CLOUDFLARE_ACCOUNT_ID": "e61c0c9130c9e6736e8259692d2b0d8c",
        "CLOUDFLARE_RAG_NAME": "merris-rag-testing"
      }
    }
  }
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
- Missing API tokens
- Invalid RAG database names
- API rate limits
- Network connectivity issues
- Empty search results
