import { SDK } from "caido:plugin";
import { getOrCreateAIConfig, getProject, initDatabase, findingExists } from "../../utils";
import type { Finding, ApiResponse, UserPrompt } from "../../types";
import { parseCondition } from "../../parser";

/**
 * Adds findings to the database for the current project
 * 
 * @param sdk - The Caido SDK instance
 * @param data - Object containing array of findings to add
 * @returns Promise with success status and count
 */
export async function addFindings(sdk: SDK, data: {findings: Finding[]}): Promise<ApiResponse> {
  const { tableName } = await getProject(sdk);
  const db = await initDatabase(sdk);

  // AI information
  const aiConfig = await getOrCreateAIConfig(sdk);
  const statement = await db.prepare('SELECT * FROM user_prompts');
  const user_prompts = await statement.all() as UserPrompt[];

  try {
    const insertStatement = await db.prepare(`
      INSERT OR IGNORE INTO ${tableName} 
      (dupKey, debug, alert, tag, type, date, href, frame, sink, data, trace, favorite, aiScore, promptId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const results = [];
    for (const finding of data.findings) {
      // Check if the finding isn't already in the database. Need for AI prompts.
      const exists = await findingExists(sdk, finding.dupKey, tableName);
      if (exists) {
        continue;
      }

      if (aiConfig.ai_enabled) {
        for (const prompt of user_prompts) {
          try {
            if (prompt.enabled && parseCondition(prompt.condition, { sink: finding })) {
              sdk.console.log(`Prompt ${prompt.name} matched for finding ${finding.dupKey}`);
              finding.aiScore = "In queue";
              finding.promptId = prompt.id;
              break;
            }
          } catch (error) {
            sdk.console.error(`Error for prompt ${prompt.name}: ${error}`);
          }
        }
      }

      const result = await insertStatement.run(
        finding.dupKey,
        finding.debug,
        finding.notification ? 1 : 0,
        finding.tag || "",
        finding.type || "",
        finding.date || "",
        finding.href || "",
        finding.frame || "",
        finding.sink || "",
        finding.data || "",
        finding.trace || "",
        finding.favorite ? 1 : 0,
        finding.aiScore || "",
        finding.promptId || null
      );
      results.push(result);
    }

    sdk.console.log(`Successfully added ${results.length} findings`);
    return { success: true, count: results.length };
  } catch (error) {
    sdk.console.error(`Failed to add findings: ${error}`);
    return { success: false, error: String(error) };
  }
}
