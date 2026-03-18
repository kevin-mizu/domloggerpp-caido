import { SDK } from "caido:plugin";
import { getProject, initDatabase } from "../../utils";
import type { ApiResponse } from "../../types";

/**
 * Deletes findings by their IDs from the current project
 * 
 * @param sdk - The Caido SDK instance
 * @param ids - Array of finding IDs to delete
 * @returns Promise with success status and count
 */
export async function deleteFindings(sdk: SDK, ids: number[]): Promise<ApiResponse> {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: 'No IDs provided' };
    }

    const { tableName } = await getProject(sdk);
    const db = await initDatabase(sdk);

    // Convert ids array to placeholders (?, ?, ?)
    const placeholders = ids.map(() => '?').join(',');

    // Delete the findings with the specified IDs
    const deleteStatement = await db.prepare(`
      DELETE FROM ${tableName} 
      WHERE id IN (${placeholders})
    `);

    const result = await deleteStatement.run(...ids);

    sdk.console.log(`Deleted ${result.changes} findings`);
    return { 
      success: true, 
      count: result.changes,
      message: `Successfully deleted ${result.changes} finding(s)` 
    };
  } catch (error) {
    sdk.console.error(`Failed to delete findings: ${error}`);
    return { success: false, error: String(error) };
  }
}
