import { SDK } from "caido:plugin";
import { initDatabase, getOrCreateAIConfig } from "../../utils";
import type { ApiResponse } from "../../types";

/**
 * Updates the AI temperature setting
 * 
 * @param sdk - The Caido SDK instance
 * @param temperature - The temperature value (0.0 to 2.0)
 * @returns Promise with update result
 */
export async function updateTemperature(sdk: SDK, temperature: number): Promise<ApiResponse> {
  try {
    if (temperature < 0 || temperature > 2) {
      return { success: false, error: 'Temperature must be between 0.0 and 2.0' };
    }
    const config = await getOrCreateAIConfig(sdk);
    const db = await initDatabase(sdk);
    const updateStatement = await db.prepare('UPDATE ai_config SET temperature = ? WHERE id = ?');
    await updateStatement.run(temperature, config.id);

    sdk.console.log(`Temperature updated to: ${temperature}`);
    return { success: true, message: 'Temperature updated successfully' };
  } catch (error) {
    sdk.console.error(`Failed to update temperature: ${error}`);
    return { success: false, error: String(error) };
  }
}
