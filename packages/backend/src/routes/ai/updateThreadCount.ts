import { SDK } from "caido:plugin";
import { initDatabase, getOrCreateAIConfig } from "../../utils";
import type { ApiResponse } from "../../types";
import { getAIConfig } from "./getAIConfig";

/**
 * Updates the thread count in AI configuration
 * 
 * @param sdk - The Caido SDK instance
 * @param threadCount - The new thread count (1-10)
 * @returns Promise with success status
 */
export async function updateThreadCount(sdk: SDK, threadCount: number): Promise<ApiResponse> {
  try {
    if (threadCount < 1 || threadCount > 10) {
      return { success: false, error: 'Thread count must be between 1 and 10' };
    }

    const config = await getOrCreateAIConfig(sdk);
    const db = await initDatabase(sdk);
    const updateStatement = await db.prepare(`
      UPDATE ai_config 
      SET thread_count = ? 
      WHERE id = ?
    `);
    await updateStatement.run(threadCount, config.id);

    sdk.console.log(`Thread count updated to: ${threadCount}`);
    return await getAIConfig(sdk);
  } catch (error) {
    sdk.console.error(`Failed to update thread count: ${error}`);
    return { success: false, error: String(error) };
  }
}
