import { SDK } from "caido:plugin";
import { initDatabase, getOrCreateAIConfig } from "../../utils";
import type { AIConfigResponse } from "../../types";
import { getAIConfig } from "./getAIConfig";

/**
 * Updates the AI enabled status in AI configuration
 * 
 * @param sdk - The Caido SDK instance
 * @param aiEnabled - Whether AI features should be enabled
 * @returns Promise with success status
 */
export async function updateAIEnabled(sdk: SDK, aiEnabled: boolean): Promise<AIConfigResponse> {
  try {
    const config = await getOrCreateAIConfig(sdk);
    const db = await initDatabase(sdk);
    const updateStatement = await db.prepare(`
      UPDATE ai_config 
      SET ai_enabled = ? 
      WHERE id = ?
    `);
    await updateStatement.run(aiEnabled ? 1 : 0, config.id);

    sdk.console.log(`AI enabled status updated to: ${aiEnabled}`);
    return await getAIConfig(sdk);
  } catch (error) {
    sdk.console.error(`Failed to update AI enabled status: ${error}`);
    return { success: false, error: String(error) };
  }
}
