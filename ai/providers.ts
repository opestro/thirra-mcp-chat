import { createGroq } from "@ai-sdk/groq";
import { createXai } from "@ai-sdk/xai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

import {
  customProvider,
  wrapLanguageModel,
  extractReasoningMiddleware
} from "ai";

export interface ModelInfo {
  provider: string;
  name: string;
  description: string;
  apiVersion: string;
  capabilities: string[];
}

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

// Helper to get API keys from environment variables first, then localStorage
const getApiKey = (key: string): string | undefined => {
  // Check for environment variables first
  if (process.env[key]) {
    return process.env[key] || undefined;
  }

  // Fall back to localStorage if available
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key) || undefined;
  }

  return undefined;
};

// const groqClient = createGroq({
//   apiKey: getApiKey('GROQ_API_KEY'),
// });
const geminiClient = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: getApiKey('GOOGLE_API_KEY'),
});
// Create different OpenAI clients for different models with specific configurations
const openaiClient = createOpenAI({
  apiKey: getApiKey('OPENAI_API_KEY'),
});

// GPT-5 Mini client with specific configuration to avoid temperature issues
const openaiGpt5MiniClient = createOpenAI({
  apiKey: getApiKey('OPENAI_API_KEY'),
  // No temperature setting to use model defaults
});
// const xaiClient = createXai({
//   apiKey: getApiKey('XAI_API_KEY'),
// });

const languageModels = {
  // "qwen3-32b": wrapLanguageModel(
  //   {
  //     model: groqClient('qwen/qwen3-32b'),
  //     middleware
  //   }
  // ),
  // "grok-3-mini": xaiClient("grok-3-mini-latest"),
  // "kimi-k2": groqClient('moonshotai/kimi-k2-instruct'),
  // "llama4": groqClient('meta-llama/llama-4-scout-17b-16e-instruct'),
  "google/gemini-2.0-flash-001": geminiClient('google/gemini-2.0-flash-001'), // No middleware - thinking not supported
  // "gemini-2.5-pro-thinking": wrapLanguageModel({
  //   model: geminiClient('gemini-2.5-pro'),
  //   middleware
  // }),
  "gpt-5-mini": openaiGpt5MiniClient('gpt-5-mini'),
  // "gpt-5-thinking": wrapLanguagModel({
  //   model: openaiClient('gpt-5'),
  //   middleware
  // }),
};

export const modelDetails: Record<keyof typeof languageModels, ModelInfo> = {
  // "kimi-k2": {
  //   provider: "Groq",
  //   name: "Kimi K2",
  //   description: "Latest version of Moonshot AI's Kimi K2 with good balance of capabilities.",
  //   apiVersion: "kimi-k2-instruct",
  //   capabilities: ["Balanceed", "Efficient", "Agentic"]
  // },
  // "qwen3-32b": {
  //   provider: "Groq",
  //   name: "Qwen 3 32B",
  //   description: "Latest version of Alibaba's Qwen 32B with strong reasoning and coding capabilities.",
  //   apiVersion: "qwen3-32b",
  //   capabilities: ["Reasoning", "Efficient", "Agentic"]
  // },
  // "grok-3-mini": {
  //   provider: "XAI",
  //   name: "Grok 3 Mini",
  //   description: "Latest version of XAI's Grok 3 Mini with strong reasoning and coding capabilities.",
  //   apiVersion: "grok-3-mini-latest",
  //   capabilities: ["Reasoning", "Efficient", "Agentic"]
  // },
  // "llama4": {
  //   provider: "Groq",
  //   name: "Llama 4",
  //   description: "Latest version of Meta's Llama 4 with good balance of capabilities.",
  //   apiVersion: "llama-4-scout-17b-16e-instruct",
  //   capabilities: ["Balanced", "Efficient", "Agentic"]
  // },
  "google/gemini-2.0-flash-001": {
    provider: "Google",
    name: "Gemini Flash",
    description: "Google's Gemini 2.5 Flash model optimized for speed and efficiency.",
    apiVersion: "google/gemini-2.0-flash-001",
    capabilities: ["Balanced", "Efficient", "Agentic"]
  },
  // "gemini-2.5-pro-thinking": {
  //   provider: "Google",
  //   name: "Gemini 2.5 Pro Thinking",
  //   description: "Google's Gemini 2.5 Pro model with enhanced reasoning and thinking capabilities.",
  //   apiVersion: "gemini-2.5-pro",
  //   capabilities: ["Reasoning", "Thinking", "Agentic"]
  // },
  "gpt-5-mini": {
    provider: "OpenAI",
    name: "GPT-5 M",
    description: "OpenAI's latest model with enhanced reasoning and thinking capabilities.",
    apiVersion: "gpt-5-mini",
    capabilities: ["Reasoning", "Fast", "Agentic"]
  }
  // "gpt-5-thinking": {
  //   provider: "OpenAI",
  //   name: "GPT-5",
  //   description: "OpenAI's latest model with enhanced reasoning and thinking capabilities.",
  //   apiVersion: "gpt-5",
  //   capabilities: ["Reasoning", "Thinking", "Agentic"]
  // }
};

// Update API keys when localStorage changes (for runtime updates)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // Reload the page if any API key changed to refresh the providers
    if (event.key?.includes('API_KEY')) {
      window.location.reload();
    }
  });
}

export const model = customProvider({
  languageModels,
});

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "google/gemini-2.0-flash-001";
