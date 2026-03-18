import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import { getUserPrompt } from "./getUserPrompt";
import type { UserPromptResponse } from "../../types";

/**
 * Creates a new user prompt
 * 
 * @param sdk - The Caido SDK instance
 * @param prompt - User prompt data
 * @returns Promise with created user prompt
 */
export async function createUserPrompt(sdk: SDK, prompt: { name: string; condition: string; prompt: string; enabled: boolean }): Promise<UserPromptResponse> {
  try {
    
    const db = await initDatabase(sdk);
    
    const statement = await db.prepare(`
      INSERT INTO user_prompts (name, condition, prompt, enabled) 
      VALUES (?, ?, ?, ?)
    `);
    
    const result = await statement.run(
      prompt.name,
      prompt.condition,
      prompt.prompt,
      prompt.enabled ? 1 : 0
    );
    
    sdk.console.log(`Created user prompt with ID: ${result.lastInsertRowid}`);
    
    // Return the created prompt
    return await getUserPrompt(sdk, result.lastInsertRowid as number);
  } catch (error) {
    sdk.console.error(`Failed to create user prompt: ${error}`);
    return { success: false, error: String(error) };
  }
}
