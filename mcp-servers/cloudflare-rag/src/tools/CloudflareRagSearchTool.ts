import { MCPTool, MCPInput } from "mcp-framework";
import { z } from "zod";

const CloudflareRagSearchSchema = z.object({
  query: z.string().describe("The search query to find relevant information in the RAG database"),
  rag_name: z.string().optional().describe("The name of the RAG database (defaults to configured RAG name)"),
  limit: z.number().min(1).max(100).optional().describe("Maximum number of results to return (default: 10)")
});

interface CloudflareRAGResponse {
  success: boolean;
  errors?: any[];
  messages?: any[];
  result: {
    object: string;
    search_query: string;
    response: string;
    data: Array<{
      file_id: string;
      filename: string;
      score: number;
      attributes: Record<string, any>;
      content: Array<{
        id: string;
        type: string;
        text: string;
      }>;
    }>;
    has_more: boolean;
    next_page: string | null;
  };
}

class CloudflareRagSearchTool extends MCPTool {
  name = "cloudflare_rag_search";
  description = "Search the Cloudflare RAG database for relevant information using AI-powered semantic search";
  schema = CloudflareRagSearchSchema;

  async execute(input: MCPInput<this>) {
    console.log(`[CloudflareRagSearchTool] === TOOL EXECUTION STARTED ===`);
    console.log(`[CloudflareRagSearchTool] Raw input received:`, JSON.stringify(input, null, 2));
    
    const { query, rag_name, limit = 10 } = input;

    console.log(`[CloudflareRagSearchTool] Parsed params:`, { query, rag_name, limit });
    console.log(`[CloudflareRagSearchTool] Query type:`, typeof query);
    console.log(`[CloudflareRagSearchTool] Query value:`, JSON.stringify(query));
    
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "e61c0c9130c9e6736e8259692d2b0d8c";
    const CLOUDFLARE_RAG_NAME = process.env.CLOUDFLARE_RAG_NAME || "merris-rag-testing";
    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const ragName = rag_name || CLOUDFLARE_RAG_NAME;

    console.log(`[CloudflareRagSearchTool] Config:`, { 
      CLOUDFLARE_ACCOUNT_ID, 
      CLOUDFLARE_RAG_NAME, 
      ragName,
      hasToken: !!CLOUDFLARE_API_TOKEN 
    });

    if (!CLOUDFLARE_API_TOKEN) {
      const errorMsg = "CLOUDFLARE_API_TOKEN environment variable is required";
      console.error(`[CloudflareRagSearchTool] Error:`, errorMsg);
      throw new Error(errorMsg);
    }

    if (!query || !query.trim()) {
      const errorMsg = "Query cannot be empty. Please provide a search query.";
      console.error(`[CloudflareRagSearchTool] Error:`, errorMsg);
      throw new Error(errorMsg);
    }

    const endpoint = `/accounts/${CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${ragName}/ai-search`;
    const url = `https://api.cloudflare.com/client/v4${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
    };

    try {
      const requestBody = {
        query: query.trim(),
        limit: limit,
      };
      
      console.log(`[CloudflareRagSearchTool] Making API request to:`, url);
      console.log(`[CloudflareRagSearchTool] Request body:`, requestBody);
      
      const response = await this.fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      console.log(`[CloudflareRagSearchTool] Response received:`, typeof response, response);

      // MCP Framework fetch returns the parsed JSON directly, not a Response object
      const data = response as CloudflareRAGResponse;
      console.log(`[CloudflareRagSearchTool] API response data:`, JSON.stringify(data, null, 2));

      if (!data.success) {
        const errorMessage = data.errors && data.errors.length > 0 
          ? data.errors.map(e => e.message || JSON.stringify(e)).join(", ")
          : "Unknown error occurred";
        throw new Error(`RAG search failed: ${errorMessage}`);
      }

      const results = data.result.data || [];
      console.log(`[CloudflareRagSearchTool] Results count:`, results.length);
      
      if (results.length === 0) {
        const noResultsResponse = {
          query: query,
          results_count: 0,
          message: `No results found for query: "${query}"`
        };
        console.log(`[CloudflareRagSearchTool] === NO RESULTS ===`);
        console.log(`[CloudflareRagSearchTool] Returning no results:`, JSON.stringify(noResultsResponse, null, 2));
        return noResultsResponse;
      }

      // Use the AI-generated response from Cloudflare if available
      const aiResponse = data.result.response;
      console.log(`[CloudflareRagSearchTool] AI Response:`, aiResponse);

      // Format the results
      const formattedResults = results.map((result, index) => ({
        rank: index + 1,
        score: result.score,
        filename: result.filename,
        file_id: result.file_id,
        content: result.content.map(c => c.text).join('\n\n'),
        attributes: result.attributes || {}
      }));

      const successResult = {
        query: query,
        results_count: results.length,
        rag_name: ragName,
        ai_response: aiResponse,
        results: formattedResults,
        formatted_summary: aiResponse ? 
          `**AI Summary:** ${aiResponse}\n\n**Detailed Results (${results.length} found):**\n\n` + 
          formattedResults.map(r => 
            `**File:** ${r.filename} (Score: ${r.score.toFixed(3)})\n**Content Preview:** ${r.content.substring(0, 200)}...`
          ).join("\n\n---\n\n") :
          `Found ${results.length} result(s) for query: "${query}"\n\n` + 
          formattedResults.map(r => 
            `**File:** ${r.filename} (Score: ${r.score.toFixed(3)})\n**Content:** ${r.content.substring(0, 500)}...`
          ).join("\n\n---\n\n")
      };
      
      console.log(`[CloudflareRagSearchTool] === SUCCESS ===`);
      console.log(`[CloudflareRagSearchTool] Returning result:`, JSON.stringify(successResult, null, 2));
      
      return successResult;

    } catch (error) {
      console.error(`[CloudflareRagSearchTool] === ERROR OCCURRED ===`);
      console.error(`[CloudflareRagSearchTool] Error type:`, typeof error);
      console.error(`[CloudflareRagSearchTool] Error details:`, error);
      console.error(`[CloudflareRagSearchTool] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      if (error instanceof Error) {
        const errorMsg = `Failed to search RAG database: ${error.message}`;
        console.error(`[CloudflareRagSearchTool] Throwing error:`, errorMsg);
        throw new Error(errorMsg);
      }
      const unknownErrorMsg = "Failed to search RAG database: Unknown error";
      console.error(`[CloudflareRagSearchTool] Throwing unknown error:`, unknownErrorMsg);
      throw new Error(unknownErrorMsg);
    } finally {
      console.log(`[CloudflareRagSearchTool] === TOOL EXECUTION FINISHED ===`);
    }
  }
}

export default CloudflareRagSearchTool;
