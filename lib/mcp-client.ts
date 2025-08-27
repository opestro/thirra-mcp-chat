import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface MCPServerConfig {
  url: string;
  type: 'sse' | 'http';
  headers?: KeyValuePair[];
}

export interface MCPClientManager {
  tools: Record<string, any>;
  clients: any[];
  cleanup: () => Promise<void>;
}

/**
 * Wrap specific tools during tool discovery to inject user_id
 */
function wrapSpecificTools(tools: Record<string, any>, userId: string): Record<string, any> {
  const wrappedTools: Record<string, any> = {};
  
  for (const [toolName, tool] of Object.entries(tools)) {
    if (toolName === 'cloudflare_rag_search') {
      console.log(`[MCP Client] Pre-wrapping tool during discovery: ${toolName} with userId: ${userId}`);
      
      // Create a new tool that always includes user_id
      wrappedTools[toolName] = async (args: any) => {
        const enhancedArgs = {
          ...args,
          filter_key: userId
        };
        console.log(`[MCP Client] Pre-wrapped tool execution for ${toolName}:`, enhancedArgs);
        return await tool(enhancedArgs);
      };
      
      // Copy over tool metadata
      Object.setPrototypeOf(wrappedTools[toolName], tool);
      Object.assign(wrappedTools[toolName], tool);
    } else {
      wrappedTools[toolName] = tool;
    }
  }
  
  return wrappedTools;
}

/**
 * Wrap MCP tools to inject user_id for specific tools that require it (fallback method)
 */
function wrapToolsWithUserId(tools: Record<string, any>, userId: string): Record<string, any> {
  const wrappedTools: Record<string, any> = {};
  
  for (const [toolName, tool] of Object.entries(tools)) {
    if (toolName === 'cloudflare_rag_search') {
      console.log(`[MCP Client] Wrapping tool: ${toolName} with userId: ${userId}`);
      
      // Wrap the cloudflare_rag_search tool to automatically inject user_id
      wrappedTools[toolName] = {
        ...tool,
        // Override the parameters to include user_id automatically
        parameters: {
          ...tool.parameters,
          properties: {
            ...tool.parameters?.properties,
            filter_key: {
              type: 'string',
              description: 'User ID (automatically injected)',
              default: userId
            }
          }
        },
        execute: async (args: any) => {
          // Always inject user_id into the arguments, even if not provided
          const enhancedArgs = {
            ...args,
            filter_key: userId
          };
          console.log(`[MCP Client] Executing ${toolName} with injected user_id:`, enhancedArgs);
          return await tool.execute(enhancedArgs);
        }
      };
    } else {
      // Keep other tools as-is
      wrappedTools[toolName] = tool;
    }
  }
  
  return wrappedTools;
}

/**
 * Initialize MCP clients for API calls
 * This uses the already running persistent HTTP or SSE servers
 */
export async function initializeMCPClients(
  mcpServers: MCPServerConfig[] = [],
  userId?: string,
  abortSignal?: AbortSignal
): Promise<MCPClientManager> {
  // Initialize tools
  let tools = {};
  const mcpClients: any[] = [];

  // Process each MCP server configuration
  for (const mcpServer of mcpServers) {
    try {
      const headers = mcpServer.headers?.reduce((acc, header) => {
        if (header.key) acc[header.key] = header.value || '';
        return acc;
      }, {} as Record<string, string>);

      const transport = mcpServer.type === 'sse'
        ? {
          type: 'sse' as const,
          url: mcpServer.url,
          headers,
        }
        : new StreamableHTTPClientTransport(new URL(mcpServer.url), {
          requestInit: {
            headers,
          },
        });

      const mcpClient = await createMCPClient({ transport });
      mcpClients.push(mcpClient);

      const mcptools = await mcpClient.tools();

      console.log(`MCP tools from ${mcpServer.url}:`, Object.keys(mcptools));
      
      // Pre-process tools to inject user_id for cloudflare_rag_search if userId is available
      const processedTools = userId ? wrapSpecificTools(mcptools, userId) : mcptools;

      // Add MCP tools to tools object
      tools = { ...tools, ...processedTools };
    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      // Continue with other servers instead of failing the entire request
    }
  }

  // Wrap tools with user ID injection if userId is provided
  if (userId) {
    tools = wrapToolsWithUserId(tools, userId);
  }

  // Register cleanup for all clients if an abort signal is provided
  if (abortSignal && mcpClients.length > 0) {
    abortSignal.addEventListener('abort', async () => {
      await cleanupMCPClients(mcpClients);
    });
  }

  return {
    tools,
    clients: mcpClients,
    cleanup: async () => await cleanupMCPClients(mcpClients)
  };
}

/**
 * Clean up MCP clients
 */
async function cleanupMCPClients(clients: any[]): Promise<void> {
  await Promise.all(
    clients.map(async (client) => {
      try {
        await client.disconnect?.();
      } catch (error) {
        console.error("Error during MCP client cleanup:", error);
      }
    })
  );
} 