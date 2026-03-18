import { SDK } from "caido:plugin";
import { initDatabase, getOrCreateAIConfig } from "../../utils";
import type { AIConfigResponse } from "../../types";
import { getAIConfig } from "./getAIConfig";

/**
 * Updates the selected model in AI configuration
 * 
 * @param sdk - The Caido SDK instance
 * @param selectedModel - The model ID to select
 * @returns Promise with success status
 */
export async function updateSelectedModel(sdk: SDK, selectedModel: string): Promise<AIConfigResponse> {
  try {
    if (!selectedModel || selectedModel.trim() === '') {
      return { success: false, error: 'Model selection is required' };
    }
    const config = await getOrCreateAIConfig(sdk);
    const db = await initDatabase(sdk);
    const updateStatement = await db.prepare(`
      UPDATE ai_config 
      SET selected_model = ? 
      WHERE id = ?
    `);
    await updateStatement.run(selectedModel, config.id);

    sdk.console.log(`Selected model updated to: ${selectedModel}`);
    return await getAIConfig(sdk);
  } catch (error) {
    sdk.console.error(`Failed to update selected model: ${error}`);
    return { success: false, error: String(error) };
  }
}
