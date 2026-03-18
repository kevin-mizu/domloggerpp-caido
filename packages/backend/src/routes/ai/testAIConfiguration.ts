import { SDK } from "caido:plugin";
import { sendAIMessage, getOrCreateAIConfig, type AIResponse } from "../../utils";

export interface TestAIConfigurationRequest {
  // No parameters needed - this is a simple test function
}

/**
 * Tests the AI configuration by sending a PING message to OpenRouter
 * 
 * @param sdk - The Caido SDK instance
 * @param request - Empty request object (no parameters needed)
 * @returns Promise with AI response
 */
export async function testAIConfiguration(
  sdk: SDK, 
  request: TestAIConfigurationRequest
): Promise<AIResponse> {
  try {
    const config = await getOrCreateAIConfig(sdk);

    if (!config.openrouter_api_key) {
      return { success: false, error: 'OpenRouter API key is not configured' };
    }

    const apiKey = config.openrouter_api_key;
    const systemPrompt = 'You are a helpful assistant.';
    const userPrompt = 'PING - Please respond with "PONG" to confirm the AI configuration is working.';
    const model = config.selected_model;
    const temperature = config.temperature;

    const result = await sendAIMessage(sdk, apiKey, model, systemPrompt, userPrompt, temperature);
    return result;
  } catch (error) {
    sdk.console.error(`Failed to test AI configuration: ${error}`);
    return { 
      success: false, 
      error: `Failed to test AI configuration: ${String(error)}` 
    };
  }
}
