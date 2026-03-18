import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { ApiResponse } from "../../types";

/**
 * Deletes a user prompt
 * 
 * @param sdk - The Caido SDK instance
 * @param id - Prompt ID
 * @returns Promise with success status
 */
export async function deleteUserPrompt(sdk: SDK, id: number): Promise<ApiResponse> {
  try {
    const db = await initDatabase(sdk);
    
    const statement = await db.prepare('DELETE FROM user_prompts WHERE id = ?');
    const result = await statement.run(id);
    
    if (result.changes === 0) {
      return { success: false, error: 'User prompt not found' };
    }
    
    sdk.console.log(`Deleted user prompt with ID: ${id}`);
    
    return { 
      success: true, 
      message: `User prompt deleted successfully`,
      count: result.changes
    };
  } catch (error) {
    sdk.console.error(`Failed to delete user prompt: ${error}`);
    return { success: false, error: String(error) };
  }
}
