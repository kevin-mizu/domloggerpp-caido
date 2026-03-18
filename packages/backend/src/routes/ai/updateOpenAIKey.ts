import { SDK } from "caido:plugin";
import { initDatabase, verifyOpenAIToken, getOrCreateAIConfig } from "../../utils";
import type { AIConfigResponse } from "../../types";
import { getAIConfig } from "./getAIConfig";

/**
 * Updates the OpenRouter API key in AI configuration
 * 
 * @param sdk - The Caido SDK instance
 * @param openaiApiKey - The new OpenRouter API key
 * @returns Promise with success status
 */
export async function updateOpenAIKey(sdk: SDK, openaiApiKey: string): Promise<AIConfigResponse> {
  try {
    // If API key is not empty, verify it first
    if (openaiApiKey && openaiApiKey.trim() !== '') {
      const verificationResult = await verifyOpenAIToken(sdk, openaiApiKey);
      if (!verificationResult.success) {
        return { success: false, error: verificationResult.error };
      }
    }
    const config = await getOrCreateAIConfig(sdk);
    const db = await initDatabase(sdk);
    const updateStatement = await db.prepare(`
      UPDATE ai_config 
      SET openrouter_api_key = ? 
      WHERE id = ?
    `);
    await updateStatement.run(openaiApiKey, config.id);

    sdk.console.log('OpenRouter API key updated successfully');
    return await getAIConfig(sdk);
  } catch (error) {
    sdk.console.error(`Failed to update OpenRouter API key: ${error}`);
    return { success: false, error: String(error) };
  }
}
