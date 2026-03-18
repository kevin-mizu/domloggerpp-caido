import { SDK } from "caido:plugin";
import { getProject, initDatabase } from "../../utils";
import { conditionsToSql } from "../../parser";
import type { FindingsResponse } from "../../types";

/**
 * Gets findings from the database with pagination and filtering
 * 
 * @param sdk - The Caido SDK instance
 * @param page - Page number for pagination
 * @param entriesPerPage - Number of entries per page
 * @param filter - Optional filter string
 * @returns Promise with findings and pagination info
 */
export async function getFindings(sdk: SDK, page: number = 1, entriesPerPage: number = 10, filter?: string): Promise<FindingsResponse> {
  try {
    const { tableName } = await getProject(sdk);
    const db = await initDatabase(sdk);
    const offset = (page - 1) * entriesPerPage;
    let countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    let selectQuery = `SELECT * FROM ${tableName}`;
    const queryParams: any[] = [];

    // Parse and apply filter if provided
    if (filter && filter.trim() !== '') {
      try {
        const result = conditionsToSql(filter, {});
        if (result.whereClause) {
          countQuery += ` WHERE ${result.whereClause}`;
          selectQuery += ` WHERE ${result.whereClause}`;
          queryParams.push(...result.params);
        }
      } catch (error) {
        // If parsing fails, ignore the filter
        sdk.console.warn(`Failed to parse filter: ${error}`);
      }
    }

    // Add ordering and pagination to select query
    selectQuery += ` ORDER BY id DESC LIMIT ${entriesPerPage} OFFSET ${offset}`;

    // Get total count
    const countStatement = await db.prepare(countQuery);
    const countResult = await countStatement.get(...queryParams);
    const totalCount = (countResult as any)?.count || 0;

    // Get findings
    const selectStatement = await db.prepare(selectQuery);
    const findings = await selectStatement.all(...queryParams);

    const totalPages = Math.ceil(totalCount / entriesPerPage);

    return {
      success: true,
      findings: findings.map((row: any) => ({
        ...row,
        alert: Boolean(row.alert),
        favorite: Boolean(row.favorite)
      })),
      pagination: {
        page: page,
        totalPages,
        totalEntries: totalCount,
        entriesPerPage
      }
    };
  } catch (error) {
    sdk.console.error(`Failed to get findings: ${error}`);
    return {
      success: false,
      error: String(error),
      findings: [],
      pagination: {
        page: page,
        totalPages: 0,
        totalEntries: 0,
        entriesPerPage
      }
    };
  }
}
