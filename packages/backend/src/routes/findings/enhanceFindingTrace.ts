import { SDK } from "caido:plugin";
import { getProject, initDatabase, getBetterTrace } from "../../utils";
import type { ApiResponse, Finding } from "../../types";

/**
 * Enhances a finding's stack trace by extracting code context from HTTP responses
 * 
 * @param sdk - The Caido SDK instance
 * @param findingId - The ID of the finding to enhance
 * @returns Promise with success status and updated finding
 */
export async function enhanceFindingTrace(sdk: SDK, findingId: number): Promise<ApiResponse & { finding?: Finding }> {
  try {
    const { tableName } = await getProject(sdk);
    const db = await initDatabase(sdk);

    // Get the finding
    const selectStatement = await db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const finding = await selectStatement.get(findingId) as Finding | undefined;

    if (!finding) {
      return { success: false, error: "Finding not found" };
    }

    if (!finding.trace) {
      return { success: false, error: "Finding has no trace to enhance" };
    }

    // Generate enhanced trace
    sdk.console.log(`Enhancing trace for finding ${findingId}...`);
    const enhancedTrace = await getBetterTrace(sdk, finding.trace);

    // Update the finding with enhanced trace
    const updateStatement = await db.prepare(`UPDATE ${tableName} SET trace = ? WHERE id = ?`);
    await updateStatement.run(enhancedTrace, findingId);

    sdk.console.log(`Successfully enhanced trace for finding ${findingId}`);

    return {
      success: true,
      message: "Trace enhanced successfully",
      finding: {
        ...finding,
        trace: enhancedTrace
      }
    };
  } catch (error) {
    sdk.console.error(`Failed to enhance trace: ${error}`);
    return { success: false, error: String(error) };
  }
}
