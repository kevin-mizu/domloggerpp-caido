import { SDK } from "caido:plugin";
import { initDatabase } from "../../utils";
import type { ApiResponse } from "../../types";

/**
 * Creates a temporary project for recording findings
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with success status
 */
export async function createTempProject(sdk: SDK): Promise<ApiResponse> {
  try {
    const db = await initDatabase(sdk);
    const tempProjectName = 'temp_recording';
    const tempTableName = 'findings_temp_recording';

    // Check if temp project already exists
    const checkStatement = await db.prepare('SELECT name FROM projects WHERE name = ?');
    const existingProject = await checkStatement.get(tempProjectName);

    if (existingProject) {
      return { success: false, error: 'Temporary project already exists' };
    }

    // Create temporary findings table
    await db.exec(`
      CREATE TABLE ${tempTableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dupKey TEXT UNIQUE NOT NULL,
        debug TEXT,
        alert BOOLEAN,
        tag TEXT,
        type TEXT,
        date TEXT,
        href TEXT,
        frame TEXT,
        sink TEXT,
        data TEXT,
        trace TEXT,
        favorite BOOLEAN DEFAULT 0,
        aiScore TEXT DEFAULT '',
        promptId INTEGER
      );
    `);

    // Add temp project to registry
    const insertStatement = await db.prepare(`INSERT INTO projects (name, table_name) VALUES (?, ?);`);
    await insertStatement.run(tempProjectName, tempTableName);

    sdk.console.log(`Created temporary project: ${tempProjectName} with table: ${tempTableName}`);

    return { success: true, message: 'Temporary project created successfully' };
  } catch (error) {
    sdk.console.error(`Failed to create temporary project: ${error}`);
    return { success: false, error: String(error) };
  }
}
