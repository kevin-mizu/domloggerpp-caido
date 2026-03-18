import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { UserPromptResponse, UserPrompt } from "../../types";

/**
 * Gets a specific user prompt by ID
 * 
 * @param sdk - The Caido SDK instance
 * @param id - Prompt ID
 * @returns Promise with user prompt
 */
export async function getUserPrompt(sdk: SDK, id: number): Promise<UserPromptResponse> {
  try {
    const db = await initDatabase(sdk);
    
    const statement = await db.prepare('SELECT * FROM user_prompts WHERE id = ?');
    const prompt = await statement.get(id);
    
    if (!prompt) {
      return { success: false, error: 'User prompt not found' };
    }
    
    return {
      success: true,
      prompt: {
        ...(prompt as any),
        enabled: Boolean((prompt as any).enabled)
      } as UserPrompt
    };
  } catch (error) {
    sdk.console.error(`Failed to get user prompt: ${error}`);
    return { success: false, error: String(error) };
  }
}
