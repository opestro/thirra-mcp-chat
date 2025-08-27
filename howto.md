Building Your First MCP Server 🚀
1
Basic Server Setup ⚡
Create a new file called index.js with the following code:

📋 Copy

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "My First MCP Server",
  version: "1.0.0"
}, {
  capabilities: {
    resources: {},  // Enable resources support
    tools: {}       // Enable tools support
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
💡 Note: The server configuration object specifies which capabilities your server supports. You can enable resources, tools, and other features as needed.

2
Adding Resources 📚
Resources allow your server to expose data that can be used as context for LLM interactions:

📋 Copy

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///data/config.json",
        name: "Configuration File",
        mimeType: "application/json"
      }
    ]
  };
});

// Read resource contents
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri === "file:///data/config.json") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ key: "value" })
        }
      ]
    };
  }
  
  throw new Error("Resource not found");
});
💡 Note: Resources can be static files, dynamic data, or templates. They're perfect for providing context to LLMs.

3
Implementing Tools 🛠️
Tools are functions that LLMs can call to perform actions. Here's how to implement them:

📋 Copy

// Simple calculator tool
server.tool(
  "calculate",
  {
    operation: z.enum(["add", "subtract", "multiply", "divide"])
      .describe("The mathematical operation to perform"),
    x: z.number().describe("First number"),
    y: z.number().describe("Second number")
  },
  async ({ operation, x, y }) => {
    let result;
    switch (operation) {
      case "add": result = x + y; break;
      case "subtract": result = x - y; break;
      case "multiply": result = x * y; break;
      case "divide": 
        if (y === 0) throw new Error("Division by zero");
        result = x / y;
        break;
    }

    return {
      content: [
        {
          type: "text",
          text: `Result of ${x} ${operation} ${y} = ${result}`
        }
      ]
    };
  }
);

// Weather tool with error handling
server.tool(
  "getWeather",
  {
    city: z.string().describe("City name"),
    country: z.string().optional().describe("Country code")
  },
  async ({ city, country }) => {
    try {
      // Implementation would go here
      const weather = await fetchWeather(city, country);
      
      return {
        content: [
          {
            type: "text",
            text: `Weather in ${city}: ${weather.description}, ${weather.temperature}°C`
          }
        ]
      };
    } catch (error) {
      console.error(`Weather API error: ${error.message}`);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather: ${error.message}`
          }
        ]
      };
    }
  }
);
💡 Note: Tools should have clear parameter validation, good error handling, and return meaningful responses.

4
Advanced Features 🚀
MCP supports advanced features like resource templates and dynamic updates:

📋 Copy

// Resource template example
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [],
    templates: [
      {
        uriTemplate: "user://{userId}/profile",
        name: "User Profile",
        description: "Access user profile data"
      }
    ]
  };
});

// Resource update notifications
function notifyResourceChanged(uri) {
  server.sendNotification("notifications/resources/updated", {
    uri
  });
}

// Subscribe to resource updates
server.setRequestHandler(SubscribeResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  // Implementation for subscription
  return { success: true };
});
5
Complete WooCommerce Example 🛍️
Here's a real-world example combining tools and resources:

📋 Copy

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { z } from "zod";

const server = new McpServer({
  name: "WooCommerce Service",
  version: "1.0.0"
}, {
  capabilities: {
    resources: {},
    tools: {}
  }
});

// Tool: Get Recent Orders
server.tool(
  "getRecentOrders",
  {
    status: z.string().optional()
      .describe("Filter orders by status (e.g., processing, completed)"),
    limit: z.number().optional()
      .describe("Number of orders to return"),
    after: z.string().optional()
      .describe("Get orders after this date (YYYY-MM-DD)"),
    before: z.string().optional()
      .describe("Get orders before this date (YYYY-MM-DD)")
  },
  async ({ status, limit, after, before }) => {
    try {
      const orders = await fetchOrders({ status, limit, after, before });
      return {
        content: [
          {
            type: "text",
            text: formatOrders(orders)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`
          }
        ]
      };
    }
  }
);

// Resource: Order Statistics
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "woo://stats/daily",
        name: "Daily Order Statistics",
        mimeType: "application/json"
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);