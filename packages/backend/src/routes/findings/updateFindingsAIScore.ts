import { SDK } from "caido:plugin";
import { getProject, initDatabase, getOrCreateAIConfig } from "../../utils";
import { parseCondition } from "../../parser";
import type { ApiResponse, UserPrompt, Finding } from "../../types";

/**
 * Updates the AI score for multiple findings
 * 
 * @param sdk - The Caido SDK instance
 * @param findingIds - Array of finding IDs to update
 * @param aiScore - New AI score value
 * @returns Promise with success status
 */
export async function updateFindingsAIScore(
  sdk: SDK, 
  findingIds: number[], 
  aiScore: string
): Promise<ApiResponse> {
  // We don't need to check if AI is enable as this route is used to manually set the AI score.
  try {
    if (!findingIds || findingIds.length === 0) {
      return { success: false, error: "No finding IDs provided" };
    }

    const { tableName } = await getProject(sdk);
    const db = await initDatabase(sdk);

    const placeholders = findingIds.map(() => '?').join(',');
    const selectQuery = `SELECT * FROM ${tableName} WHERE id IN (${placeholders})`;
    const selectStatement = await db.prepare(selectQuery);
    const findings = await selectStatement.all(...findingIds) as Finding[];

    let findingsWithoutPrompt = 0;
    const updateResults = [];

    let userPrompts: UserPrompt[] = [];
    if (aiScore === "In queue") {
      const promptsStatement = await db.prepare('SELECT * FROM user_prompts WHERE enabled = 1');
      userPrompts = await promptsStatement.all();
    }

    if (aiScore === "In progress") {
      return { 
        success: false, 
        error: "Cannot manually set AI score to 'In progress'" 
      };
    }

    for (const finding of findings) {
      let matchedPromptId = null;
      let finalAiScore = aiScore;

      // Only check prompts if setting to "In queue"
      if (aiScore === "In queue" && userPrompts.length > 0) {
        for (const prompt of userPrompts) {
          try {
            if (parseCondition(prompt.condition, { sink: finding })) {
              matchedPromptId = prompt.id;
              sdk.console.log(`Prompt ${prompt.name} matched for finding ${finding.id}`);
              break;
            }
          } catch (error) {
            sdk.console.error(`Error checking prompt ${prompt.name} for finding ${finding.id}: ${error}`);
          }
        }

        // If no prompt found for "In queue", keep existing score
        if (!matchedPromptId) {
          finalAiScore = finding.aiScore || '';
          findingsWithoutPrompt++;
        }
      }

      if (finding.id !== undefined) {
        const updateQuery = `UPDATE ${tableName} SET aiScore = ?, promptId = ? WHERE id = ?`;
        const updateStatement = await db.prepare(updateQuery);
        const updateResult = await updateStatement.run(finalAiScore, matchedPromptId || null, finding.id);
        updateResults.push(updateResult);
      }
    }

    sdk.console.log(`Updated AI score for ${findings.length} findings to: ${aiScore}. ${findingsWithoutPrompt} findings had no matching prompts.`);
    return { 
      success: true, 
      count: findings.length,
      findingsWithoutPrompt,
      message: `Updated AI score for ${findings.length} findings. ${findingsWithoutPrompt} findings had no matching prompts.`
    };
  } catch (error) {
    sdk.console.error(`Failed to update AI scores: ${error}`);
    return { 
      success: false, 
      error: String(error) 
    };
  }
}
