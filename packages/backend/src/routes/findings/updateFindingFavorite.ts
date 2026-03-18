import { SDK } from "caido:plugin";
import { getProject, initDatabase } from "../../utils";
import type { ApiResponse } from "../../types";

/**
 * Updates the favorite status of a finding
 * 
 * @param sdk - The Caido SDK instance
 * @param findingId - ID of the finding to update
 * @param favorite - New favorite status
 * @returns Promise with success status
 */
export async function updateFindingFavorite(sdk: SDK, findingId: number, favorite: boolean): Promise<ApiResponse> {
  try {
    if (!findingId) {
      return { success: false, error: 'Finding ID is required' };
    }
    
    const { tableName } = await getProject(sdk);
    const db = await initDatabase(sdk);
    
    // Check if finding exists
    const checkStatement = await db.prepare(`SELECT id FROM ${tableName} WHERE id = ?`);
    const existingFinding = await checkStatement.get(findingId);
    
    if (!existingFinding) {
      return { success: false, error: 'Finding not found' };
    }
    
    // Update the favorite status
    const updateStatement = await db.prepare(`
      UPDATE ${tableName} 
      SET favorite = ? 
      WHERE id = ?
    `);
    
    const result = await updateStatement.run(favorite ? 1 : 0, findingId);
    
    if (result.changes === 0) {
      return { success: false, error: 'No changes made' };
    }
    
    sdk.console.log(`Updated favorite status for finding ${findingId} to ${favorite}`);
    
    return { 
      success: true, 
      message: `Finding ${favorite ? 'added to' : 'removed from'} favorites`,
      count: result.changes
    };
  } catch (error) {
    sdk.console.error(`Failed to update finding favorite: ${error}`);
    return { success: false, error: String(error) };
  }
}
