import { SDK } from "caido:plugin";
import { initDatabase, getOrCreateAIConfig } from "../../utils";
import type { AIConfigResponse } from "../../types";
import { getAIConfig } from "./getAIConfig";

/**
 * Updates the system prompt in AI configuration
 * 
 * @param sdk - The Caido SDK instance
 * @param systemPrompt - The new system prompt
 * @returns Promise with success status
 */
export async function updateSystemPrompt(sdk: SDK, systemPrompt: string): Promise<AIConfigResponse> {
  try {
    const config = await getOrCreateAIConfig(sdk);
    
    var db = await initDatabase(sdk);
    const updateStatement = await db.prepare(`
      UPDATE ai_config 
      SET system_prompt = ? 
      WHERE id = ?
    `);
    await updateStatement.run(systemPrompt, config.id);

    sdk.console.log('System prompt updated successfully');
    return await getAIConfig(sdk);
  } catch (error) {
    sdk.console.error(`Failed to update system prompt: ${error}`);
    return { success: false, error: String(error) };
  }
}
