import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { ProjectsResponse, Project } from "../types.js";

/**
 * Gets statistics for all projects including row counts
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with project statistics
 */
export async function getProjects(sdk: SDK): Promise<ProjectsResponse> {
  try {
    const db = await initDatabase(sdk);
    const projects: Project[] = [];

    // Get all projects
    const projectsStatement = await db.prepare('SELECT id, name, table_name, created_at FROM projects ORDER BY created_at DESC');
    const projectsResult = await projectsStatement.all();

    if (!projectsResult || projectsResult.length === 0) {
      return { success: true, projects: [] };
    }

    // Get row count for each project using stored table name
    for (const project of projectsResult as any[]) {
      const tableName = project.table_name;

      try {
        const countStatement = await db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
        const countResult = await countStatement.get();
        const rowCount = (countResult as any)?.count || 0;

        // Get table size using SQLite's dbstat virtual table (most reliable method)
        let tableSize = 0;
        try {
          // Get the total page size for the table using dbstat
          const sizeStatement = await db.prepare(`SELECT SUM(pgsize) AS size_bytes FROM dbstat WHERE name = '${tableName}'`);
          const sizeResult = await sizeStatement.get();
          tableSize = (sizeResult as any)?.size_bytes || 0;
        } catch (error) {
          sdk.console.log(`Table size error for ${tableName}: ${error}`);
          tableSize = 0;
        }

        projects.push({
          id: project.id,
          name: project.name,
          table_name: project.table_name,
          rowCount: rowCount,
          tableSize: tableSize,
          created_at: project.created_at
        });
      } catch (error) {
        // Table might not exist, set count to 0
        projects.push({
          id: project.id,
          name: project.name,
          table_name: project.table_name,
          rowCount: 0,
          tableSize: 0,
          created_at: project.created_at
        });
      }
    }

    return { success: true, projects };
  } catch (error) {
    sdk.console.error(`Failed to get project stats: ${error}`);
    return { success: false, error: String(error) };
  }
}
