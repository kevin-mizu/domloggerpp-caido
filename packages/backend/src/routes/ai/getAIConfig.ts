import { SDK } from "caido:plugin";
import { getOrCreateAIConfig } from "../../utils";
import type { AIConfigResponse } from "../../types";

/**
 * Gets the current AI configuration
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with AI configuration
 */
export async function getAIConfig(sdk: SDK): Promise<AIConfigResponse> {
  try {
    const config = await getOrCreateAIConfig(sdk);

    return {
      success: true,
      config: config
    };
  } catch (error) {
    sdk.console.error(`Failed to get AI config: ${error}`);
    return { success: false, error: String(error) };
  }
}
