import { SDK } from "caido:plugin";
import { fetch } from "caido:http";
import type { ApiResponse } from "../../types";
import { getOrCreateAIConfig } from "../../utils";

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  created: number;
  architecture?: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
  };
}

export interface AIModelsResponse extends ApiResponse {
  models?: AIModel[];
}

/**
 * Fetches available OpenRouter models using the stored API key
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with available models
 */
export async function getAIModels(sdk: SDK): Promise<AIModelsResponse> {
  try {
    const config = await getOrCreateAIConfig(sdk);
    const apiKey = config.openrouter_api_key;
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'OpenRouter API key is not configured' };
    }

    sdk.console.log("Sending request to fetch OpenRouter models...");
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      try {
        const responseData = await response.json() as any;
        const allModels: AIModel[] = responseData.data || [];

        // Filter for text-to-text chat models from popular providers
        const chatModels = allModels.filter((model: AIModel) => {
          // Check if it supports text input and output
          const supportsTextInput = model.architecture?.input_modalities?.includes('text') ?? false;
          const supportsTextOutput = model.architecture?.output_modalities?.includes('text') ?? false;

          // Check if it's from a popular provider
          const isPopularProvider = model.id.includes('openai/') || 
            model.id.includes('anthropic/') ||
            model.id.includes('google/') ||
            model.id.includes('deepseek/') ||
            model.id.includes('x-ai/') ||
            model.id.includes('qwen/');

          return supportsTextInput && supportsTextOutput && isPopularProvider;
        });

        // Clean up model names by removing provider prefixes
        const cleanedModels = chatModels.map((model: AIModel) => {
          const cleanedModel = { ...model };
          // Remove provider prefix from model name (e.g., "OpenAI : GPT-4" -> "GPT-4")
          if (model.name && model.name.includes(': ')) {
            cleanedModel.name = model.name.split(': ').slice(1).join(': ');
          }
          return cleanedModel;
        });

        sdk.console.log(`Found ${cleanedModels.length} chat models out of ${allModels.length} total models`);
        return {
          success: true,
          message: `Found ${cleanedModels.length} available chat models`,
          models: cleanedModels
        };
      } catch (parseError) {
        sdk.console.error(`Failed to parse OpenRouter models response: ${parseError}`);
        return {
          success: false,
          error: 'Invalid response format from OpenRouter API'
        };
      }
    } else {
      return {
        success: false,
        error: `OpenRouter API returned error: ${response.status}`
      };
    }
  } catch (error) {
    sdk.console.error(`Failed to fetch OpenRouter models: ${error}`);
    return { 
      success: false, 
      error: `Network error: ${String(error)}` 
    };
  }
}
