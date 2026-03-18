import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { ApiResponse } from "../types.js";

/**
 * Deletes a project and all its findings data
 * 
 * @param sdk - The Caido SDK instance
 * @param projectName - Name of the project to delete
 * @returns Promise with success status
 */
export async function deleteProject(sdk: SDK, projectName: string): Promise<ApiResponse> {
  try {
    if (!projectName || projectName.trim() === '') {
      return { success: false, error: 'Project name is required' };
    }

    const db = await initDatabase(sdk);
    
    // Check if project exists and get project data
    const projectStatement = await db.prepare('SELECT id, name, table_name, created_at FROM projects WHERE name = ?');
    const project = await projectStatement.get(projectName);
    
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    const tableName = (project as any).table_name;
    
    // Delete the findings table
    try {
      await db.exec(`DROP TABLE IF EXISTS ${tableName}`);
      sdk.console.log(`Dropped table: ${tableName}`);
    } catch (error) {
      sdk.console.warn(`Failed to drop table ${tableName}: ${error}`);
      // Continue anyway as the table might not exist
    }
    
    // Remove project from registry
    const deleteStatement = await db.prepare('DELETE FROM projects WHERE name = ?');
    const result = await deleteStatement.run(projectName);
    
    if (result.changes === 0) {
      return { success: false, error: 'Project not found in registry' };
    }
    
    sdk.console.log(`Successfully deleted project: ${projectName}`);
    return { 
      success: true, 
      message: `Project "${projectName}" and all its data have been deleted successfully`
    };
  } catch (error) {
    sdk.console.error(`Failed to delete project: ${error}`);
    return { success: false, error: String(error) };
  }
}
