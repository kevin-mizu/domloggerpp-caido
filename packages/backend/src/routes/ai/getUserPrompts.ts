import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { UserPromptsResponse, UserPrompt } from "../../types";

/**
 * Gets all user prompts
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with all user prompts
 */
export async function getUserPrompts(sdk: SDK): Promise<UserPromptsResponse> {
  try {
    const db = await initDatabase(sdk);
    
    const statement = await db.prepare('SELECT * FROM user_prompts ORDER BY created_at DESC');
    const prompts = await statement.all();
    
    return {
      success: true,
      prompts: prompts.map((row: any) => ({
        ...row,
        enabled: Boolean(row.enabled)
      })) as UserPrompt[]
    };
  } catch (error) {
    sdk.console.error(`Failed to get user prompts: ${error}`);
    return { success: false, error: String(error) };
  }
}
