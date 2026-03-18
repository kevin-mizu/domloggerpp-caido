import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import { getUserPrompt } from "./getUserPrompt";
import type { UserPromptResponse } from "../../types";

/**
 * Updates an existing user prompt
 * 
 * @param sdk - The Caido SDK instance
 * @param id - Prompt ID
 * @param prompt - Updated prompt data
 * @returns Promise with updated user prompt
 */
export async function updateUserPrompt(sdk: SDK, id: number, prompt: { name: string; condition: string; prompt: string; enabled: boolean }): Promise<UserPromptResponse> {
  try {
    
    const db = await initDatabase(sdk);
    const checkStatement = await db.prepare('SELECT id FROM user_prompts WHERE id = ?');
    const existingPrompt = await checkStatement.get(id);

    if (!existingPrompt) {
      return { success: false, error: 'User prompt not found' };
    }

    const statement = await db.prepare(`
      UPDATE user_prompts 
      SET name = ?, condition = ?, prompt = ?, enabled = ? 
      WHERE id = ?
    `);

    await statement.run(
      prompt.name,
      prompt.condition,
      prompt.prompt,
      prompt.enabled ? 1 : 0,
      id
    );

    sdk.console.log(`Updated user prompt with ID: ${id}`);
    return await getUserPrompt(sdk, id);
  } catch (error) {
    sdk.console.error(`Failed to update user prompt: ${error}`);
    return { success: false, error: String(error) };
  }
}
