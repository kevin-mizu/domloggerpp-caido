import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { ApiResponse } from "../../types";

/**
 * Deletes the temporary project and its findings table
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with success status
 */
export async function deleteTempProject(sdk: SDK): Promise<ApiResponse> {
  try {
    const db = await initDatabase(sdk);
    const tempProjectName = 'temp_recording';
    const tempTableName = 'findings_temp_recording';

    // Check if temp project exists
    const checkStatement = await db.prepare('SELECT name FROM projects WHERE name = ?');
    const existingProject = await checkStatement.get(tempProjectName);

    if (!existingProject) {
      return { success: false, error: 'Temporary project does not exist' };
    }

    // Drop the temporary table
    await db.exec(`DROP TABLE IF EXISTS ${tempTableName};`);

    // Remove temp project from registry
    const deleteStatement = await db.prepare(`DELETE FROM projects WHERE name = ?;`);
    await deleteStatement.run(tempProjectName);

    sdk.console.log(`Deleted temporary project: ${tempProjectName} and table: ${tempTableName}`);

    return { success: true, message: 'Temporary project deleted successfully' };
  } catch (error) {
    sdk.console.error(`Failed to delete temporary project: ${error}`);
    return { success: false, error: String(error) };
  }
}
