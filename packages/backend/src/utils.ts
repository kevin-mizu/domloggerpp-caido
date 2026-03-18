import { SDK } from "caido:plugin";
import { fetch } from "caido:http";
import type { Database } from "sqlite";
import type { ProjectInfo, ApiResponse, GraphQLResponse } from "./types";

let db: Database | null = null;

/**
 * Initializes the SQLite database connection and creates required tables.
 * 
 * This function ensures the database is properly set up with all necessary tables:
 * - projects: Stores project registry information
 * - findings: Default findings table (legacy support)
 * 
 * The function uses a singleton pattern - if the database is already initialized,
 * it returns the existing connection.
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise<Database> - The initialized database connection
 * @throws Error if database initialization fails
 */
export async function initDatabase(sdk: SDK): Promise<Database> {
  try {
    if (db) return db;

    db = await sdk.meta.db();
    const dataPath = sdk.meta.path();
    sdk.console.log(`Database will be stored in: ${dataPath}`);

    // Create projects table if needed (only once during database init)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        table_name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create AI configuration table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        openrouter_api_key TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        ai_enabled BOOLEAN DEFAULT 1,
        selected_model TEXT DEFAULT 'openai/gpt-3.5-turbo',
        temperature REAL DEFAULT 0.7,
        thread_count INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user prompts table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS user_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        condition TEXT NOT NULL,
        prompt TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    sdk.console.log("Database tables initialized successfully");
    
    // Run migrations for existing databases
    await migrateDatabase(sdk);
    
    return db;
  } catch (error) {
    sdk.console.error(`Database initialization failed: ${error}`);
    throw error;
  }
}

/**
 * Migrates existing database schema to handle column renames
 * 
 * @param sdk - The Caido SDK instance
 */
async function migrateDatabase(sdk: SDK): Promise<void> {
  try {
    const db = await initDatabase(sdk);
    
    // Check if openai_api_key column exists (old schema)
    const tableInfo = await db.prepare("PRAGMA table_info(ai_config)");
    const columns = await tableInfo.all();
    const hasOldColumn = columns.some((col: any) => col.name === 'openai_api_key');
    const hasNewColumn = columns.some((col: any) => col.name === 'openrouter_api_key');
    
    if (hasOldColumn && !hasNewColumn) {
      sdk.console.log('Migrating openai_api_key to openrouter_api_key...');
      
      // Add new column
      await db.exec('ALTER TABLE ai_config ADD COLUMN openrouter_api_key TEXT NOT NULL DEFAULT ""');
      
      // Copy data from old column to new column
      await db.exec('UPDATE ai_config SET openrouter_api_key = openai_api_key WHERE openai_api_key IS NOT NULL');
      
      // Drop old column (SQLite doesn't support DROP COLUMN directly, so we'll recreate the table)
      const dataStatement = await db.prepare('SELECT * FROM ai_config');
      const data = await dataStatement.all();
      
      // Create new table
      await db.exec(`
        CREATE TABLE ai_config_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          openrouter_api_key TEXT NOT NULL,
          system_prompt TEXT NOT NULL,
          ai_enabled BOOLEAN DEFAULT 1,
          selected_model TEXT DEFAULT 'openai/gpt-3.5-turbo',
          temperature REAL DEFAULT 0.7,
          thread_count INTEGER DEFAULT 1,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Copy data to new table
      for (const row of data as any[]) {
        const insertStatement = await db.prepare(`
          INSERT INTO ai_config_new (id, openrouter_api_key, system_prompt, ai_enabled, selected_model, temperature, thread_count, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        await insertStatement.run(
          row.id,
          row.openrouter_api_key || row.openai_api_key || '',
          row.system_prompt,
          row.ai_enabled,
          row.selected_model,
          row.temperature,
          row.thread_count,
          row.created_at
        );
      }
      
      // Drop old table and rename new one
      await db.exec('DROP TABLE ai_config');
      await db.exec('ALTER TABLE ai_config_new RENAME TO ai_config');
      
      sdk.console.log('Migration completed: openai_api_key renamed to openrouter_api_key');
    }
  } catch (error) {
    sdk.console.error(`Database migration failed: ${error}`);
    // Don't throw - migration failures shouldn't break the app
  }
}

/**
 * Gets the current project information and ensures the project's findings table exists.
 * Prioritizes temporary project if it exists.
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise with project name and table name
 */
export async function getProject(sdk: SDK): Promise<ProjectInfo> {
  const database = await initDatabase(sdk);
  
  // Check if temporary project exists first
  const tempStatement = await database.prepare('SELECT name, table_name FROM projects WHERE name = ?');
  const tempProject = await tempStatement.get('temp_recording');
  
  if (tempProject) {
    // Use temporary project if it exists
    return { name: 'temp_recording', tableName: (tempProject as any).table_name };
  }
  
  // Otherwise use current project
  const currentProjectObj = await sdk.projects.getCurrent();
  const currentProject = currentProjectObj?.getName() || 'default';
  const tableName = `findings_${currentProject.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Check if project exists
  const statement = await database.prepare('SELECT name, table_name FROM projects WHERE name = ?');
  const existingProject = await statement.get(currentProject);

  if (!existingProject) {
    // Project doesn't exist - create table and add to registry
    await database.exec(`
      CREATE TABLE ${tableName} (
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

    const insertStatement = await database.prepare(`INSERT INTO projects (name, table_name) VALUES (?, ?);`);
    await insertStatement.run(currentProject, tableName);
    sdk.console.log(`Created new project: ${currentProject} with table: ${tableName}`);

    return { name: currentProject, tableName };
  } else {
    // Project exists, use stored table name
    return { name: currentProject, tableName: (existingProject as any).table_name };
  }
}

/**
 * Gets the database instance (must be initialized first)
 * 
 * @returns Database instance
 * @throws Error if database not initialized
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error("Database not initialized");
  }
  return db;
}




/**
 * Check if a finding already exists in the database by dupKey
 * 
 * @param sdk - The Caido SDK instance
 * @param dupKey - The duplicate key to check for
 * @param tableName - The table name to check in
 * @returns Promise with boolean indicating if finding exists
 */
export async function findingExists(sdk: SDK, dupKey: string, tableName: string): Promise<boolean> {
  try {
    const db = await initDatabase(sdk);
    const statement = await db.prepare(`SELECT 1 FROM ${tableName} WHERE dupKey = ? LIMIT 1`);
    const result = await statement.get(dupKey);
    return result !== undefined;
  } catch (error) {
    sdk.console.error(`Failed to check if finding exists: ${error}`);
    return false;
  }
}

/**
 * Verifies an OpenRouter API key by calling the /key endpoint
 * 
 * @param sdk - The Caido SDK instance
 * @param apiKey - The OpenRouter API key to verify
 * @returns Promise with verification result
 */
export async function verifyOpenAIToken(sdk: SDK, apiKey: string): Promise<ApiResponse & { user?: any }> {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API key is required' };
    }

    // Basic format validation first - OpenRouter keys typically start with 'sk-or-'
    if (!apiKey.startsWith('sk-or-') || apiKey.length < 20) {
      return { 
        success: false, 
        error: 'Invalid API key format. OpenRouter API keys should start with "sk-or-" and be at least 20 characters long' 
      };
    }

    // Create HTTP request to verify the API key
    const response = await fetch("https://openrouter.ai/api/v1/key", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      try {
        const responseData = await response.json() as any;
        const keyData = responseData.data;
        sdk.console.log(`OpenRouter API key verified successfully. Label: ${keyData?.label || 'unknown'}, Usage: ${keyData?.usage || 0}`);
        return {
          success: true,
          message: 'API key verified successfully',
          user: keyData
        };
      } catch (parseError) {
        sdk.console.error(`Failed to parse OpenRouter response: ${parseError}`);
        return {
          success: false,
          error: 'Invalid response format from OpenRouter API'
        };
      }
    } else {
      sdk.console.error(`OpenRouter API returned status code: ${response.status}`);
      return {
        success: false,
        error: `OpenRouter API returned error: ${response.status}`
      };
    }
  } catch (error) {
    sdk.console.error(`Failed to verify OpenRouter API token: ${error}`);
    return { 
      success: false, 
      error: `Network error: ${String(error)}` 
    };
  }
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse extends ApiResponse {
  response?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Sends a message to OpenRouter using the provided parameters
 * 
 * @param sdk - The Caido SDK instance
 * @param apiKey - The OpenRouter API key
 * @param model - The model to use (e.g., 'openai/gpt-3.5-turbo', 'anthropic/claude-3-sonnet')
 * @param systemPrompt - The system prompt
 * @param userPrompt - The user's message/prompt
 * @param temperature - The temperature setting (0.0 to 2.0)
 * @returns Promise with AI response
 */
export async function sendAIMessage(
  sdk: SDK, 
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<AIResponse> {
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { success: false, error: 'API key is required' };
    }

    if (!model || model.trim() === '') {
      return { success: false, error: 'Model is required' };
    }

    if (!userPrompt || userPrompt.trim() === '') {
      return { success: false, error: 'User prompt is required' };
    }

    // Prepare messages array
    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
      { role: 'user', content: userPrompt.trim() }
    ];

    // Create HTTP request to OpenRouter Chat Completions API
    const requestBody = {
      model: model,
      messages: messages,
      temperature: temperature
    };

    sdk.console.log(`Sending AI message to model: ${model}`);
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/kevin-mizu/domloggerpp-caido",
        "X-Title": "DOMLogger++ Caido"
      },
      body: JSON.stringify(requestBody) as any
    });

    if (response.ok) {
      try {
        const responseData = await response.json() as any;
        const aiResponse = responseData.choices?.[0]?.message?.content;
        const usage = responseData.usage;

        if (aiResponse) {
          sdk.console.log(`AI response received (prompt: ${usage?.prompt_tokens || 0}, completion: ${usage?.completion_tokens || 0}, total: ${usage?.total_tokens || 0} tokens)`);
          return {
            success: true,
            message: 'AI response received successfully',
            response: aiResponse,
            usage: usage
          };
        } else {
          return {
            success: false,
            error: 'No response content received from AI'
          };
        }
      } catch (parseError) {
        sdk.console.error(`Failed to parse AI response: ${parseError}`);
        return {
          success: false,
          error: 'Invalid response format from OpenRouter API'
        };
      }
    } else {
      const errorText = await response.text();
      sdk.console.error(`OpenRouter API returned status code: ${response.status}> ${errorText}`);
      return {
        success: false,
        error: `OpenRouter API error: ${response.status}> ${errorText}`
      };
    }
  } catch (error) {
    sdk.console.error(`Failed to send AI message: ${error}`);
    return { 
      success: false, 
      error: `Network error: ${String(error)}` 
    };
  }
}

/**
 * Gets the AI configuration, creating a default one if none exists.
 * This ensures there's always a config available.
 * 
 * @param sdk - The Caido SDK instance
 * @returns Promise<AIConfig> - The AI configuration (existing or default)
 */
export async function getOrCreateAIConfig(sdk: SDK): Promise<any> {
  try {
    const db = await initDatabase(sdk);

    // Try to get existing config
    const statement = await db.prepare('SELECT * FROM ai_config ORDER BY id DESC LIMIT 1');
    const config = await statement.get();

    if (config) {
      // Return existing config with proper type conversion
      return {
        ...(config as any),
        ai_enabled: Boolean((config as any).ai_enabled),
        selected_model: (config as any).selected_model || 'gpt-3.5-turbo',
        temperature: Number((config as any).temperature) || 0.7,
        thread_count: Number((config as any).thread_count) || 1
      };
    }

    // Create default config if none exists
    const defaultSystemPrompt = 'You are an AI security analyst specializing in client-side code vulnerabilities. Your task is to assess the exploitability of potential issues described in data.\n\nInstructions:\n\n1. You will receive plain text describing a potential client-side vulnerability.\n2. Evaluate the exploitability of the issue.\n3. Return a JSON object containing only the exploitability score as an integer from 1 to 5. Use this exact format:\n"""\n{\n  "score": X\n}\n"""\n\n1=Very Low: Highly unlikely to be a true vulnerability.\n2=Low: Some chance of being vulnerable, but uncommon.\n3=Medium: May be vulnerable under certain conditions.\n4=High: Likely to be a true vulnerability.\n5=Very High: Almost certainly a true vulnerability.\n\n4. Do not include reasoning, explanations, or any additional text.\n5. Respond only with the JSON. Example:\n"""\n{\n"score": 4\n}\n"""';
    const insertStatement = await db.prepare(`
      INSERT INTO ai_config (openrouter_api_key, system_prompt, ai_enabled, selected_model, temperature, thread_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = await insertStatement.run(
      '',                           // openrouter_api_key
      defaultSystemPrompt,          // system_prompt
      1,                            // ai_enabled
      'openai/gpt-3.5-turbo',       // selected_model
      0.7,                          // temperature
      1                             // thread_count
    );

    sdk.console.log('Created default AI configuration');
    return {
      id: result.lastInsertRowid,
      openrouter_api_key: '',
      system_prompt: defaultSystemPrompt,
      ai_enabled: true,
      selected_model: 'openai/gpt-3.5-turbo',
      temperature: 0.7,
      thread_count: 1
    };
  } catch (error) {
    sdk.console.error(`Failed to get or create AI config: ${error}`);
    throw error;
  }
}

// Declare atob for Caido backend environment
declare const atob: (str: string) => string;

const MAX_CONTEXT_WINDOW_SIZE = 1000;

/**
 * Extracts code context from HTTP response body around a specific character index
 * 
 * @param responseBody - The decoded HTTP response body
 * @param charIndex - The character index where the error occurred
 * @param funcName - Optional function name to extract complete function
 * @returns Extracted code context as a string
 */
function extractCodeContext(responseBody: string, charIndex: number, funcName?: string): string {
  let startIndex = Math.max(0, charIndex - MAX_CONTEXT_WINDOW_SIZE);
  let endIndex = charIndex + MAX_CONTEXT_WINDOW_SIZE;

  // Find the start of the script tag
  const scriptStart = responseBody.lastIndexOf('<script', charIndex);
  if (scriptStart !== -1 && scriptStart < charIndex + MAX_CONTEXT_WINDOW_SIZE) {
    const scriptTagEnd = responseBody.indexOf('>', scriptStart);
    if (scriptTagEnd !== -1) {
      startIndex = Math.max(startIndex, scriptTagEnd + 1);
    }
  }

  // Find the end of the script tag
  const scriptEnd = responseBody.indexOf('</script', charIndex);
  if (scriptEnd !== -1 && scriptEnd < charIndex + MAX_CONTEXT_WINDOW_SIZE) {
    endIndex = Math.min(endIndex, scriptEnd);
  }

  // Find the function opening (look for {)
  let braceCount = 0;
  const searchStart = Math.max(startIndex, charIndex - MAX_CONTEXT_WINDOW_SIZE);

  for (let i = charIndex; i >= searchStart; i--) {
    const char = responseBody[i];
    if (char === '}') {
      braceCount++;
    } else if (char === '{') {
      braceCount--;
      if (braceCount === -1) {
        startIndex = i;
        // Find the opening parenthesis for function arguments
        const paramsIndex = responseBody.lastIndexOf('(', i);
        if (paramsIndex !== -1 && paramsIndex >= searchStart) {
          startIndex = paramsIndex;
        }
        break;
      }
    }
  }

  // Find the function closing (look for })
  braceCount = 0;
  const searchEnd = Math.min(endIndex, charIndex + MAX_CONTEXT_WINDOW_SIZE);
  
  for (let i = charIndex; i < searchEnd; i++) {
    const char = responseBody[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === -1) {
        endIndex = i + 1;
        break;
      }
    }
  }

  return responseBody.substring(startIndex, endIndex).trim();
}

/**
 * Enhances a stack trace by extracting code context from HTTP responses
 * 
 * @param sdk - The Caido SDK instance
 * @param trace - The original stack trace string
 * @returns Promise with enhanced trace including code context
 */
export const BETTER_TRACE_MARKER = '--- BETTER TRACE ---\n';

/**
 * Extract original trace from an enhanced trace
 * Original stack lines are prefixed with '// ' in the enhanced trace
 */
function extractOriginalTrace(enhancedTrace: string): string {
  const lines = enhancedTrace.split('\n');
  const originalLines: string[] = [];
  
  for (const line of lines) {
    // Original stack lines start with '// ' and contain '@' or 'at '
    if (line.startsWith('// ') && (line.includes('@') || line.includes('at '))) {
      originalLines.push(line.slice(3)); // Remove '// ' prefix
    }
  }

  return originalLines.join('\n');
}

export async function getBetterTrace(sdk: SDK, trace: string): Promise<string> {
  // If trace is already enhanced, extract the original trace first
  let originalTrace = trace;
  if (trace.startsWith(BETTER_TRACE_MARKER)) {
    originalTrace = extractOriginalTrace(trace);
  }

  let betterTrace = BETTER_TRACE_MARKER;
  let cachedResponse: Record<string, string> = {};
  
  for (let stackLine of originalTrace.trim().split('\n')) {
    stackLine = stackLine.trim();
    betterTrace += '// ' + stackLine + '\n';

    let funcName: string | undefined;
    let fullUrl: string | undefined;
    let url: URL | undefined;
    let line: string | undefined;
    let column: string | undefined;

    try {
      if (stackLine.startsWith('at ')) {
        // Sometimes it as "at xxx (<anonymous>)", I can't handle this case yet
        const splitedLine = stackLine.split(' ');
        funcName = splitedLine.length === 2 ? '' : splitedLine[1];
        fullUrl = splitedLine[splitedLine.length - 1]; // sometimes it looks like "at R2.V [as fn] (https://example.com.com/x/y.js:15:23614)"

        if (fullUrl && fullUrl.startsWith('(')) {
          fullUrl = fullUrl.slice(1, -1);
        }
      } else {
          [funcName, fullUrl] = stackLine.trim().split('@');
      }
      const urlParts = fullUrl?.split(':');
      column = urlParts?.pop();
      line = urlParts?.pop();
      url = new URL(urlParts?.join(':') || '');
    } catch (error) {
      sdk.console.error(`Error parsing stack line: ${error} ${stackLine} ${funcName} ${fullUrl}`);
      continue;
    }

    if (!url || !line || !column) {
      sdk.console.log("No url, line, or column");
      continue;
    }

    let rawResponse: string;
    
    if (cachedResponse[url.toString()]) {
      rawResponse = cachedResponse[url.toString()]!;
    } else {
      const response = await sdk.graphql.execute(`
      query getResponseByUrl {
        requests(filter: "req.host.eq:\\"${url.host.replace(/"/g, '\\"')}\\" AND req.path.eq:\\"${url.pathname.replace(/"/g, '\\"')}\\"", first: 1) {
          edges {
            node {
              response {
                raw
              }
            }
          }
        }
      }
      `) as GraphQLResponse;
      rawResponse = response.data?.requests?.edges?.[0]?.node?.response?.raw || '';
      cachedResponse[url.toString()] = rawResponse;
    }

    if (rawResponse) {
      try {
        const responseBody = atob(rawResponse).split('\r\n\r\n').slice(1).join('\r\n\r\n');
        const lineNumber = parseInt(line, 10);
        const columnNumber = parseInt(column, 10);

        const lines = responseBody.split('\n');
        const targetLine = lines[lineNumber - 1];

        if (targetLine) {
          const lineStartIndex = responseBody.indexOf(targetLine);
          const charIndex = lineStartIndex + columnNumber - 1;

          const context = extractCodeContext(responseBody, charIndex, funcName);
          betterTrace += context + '\n----\n';
        }
      } catch (error) {
        sdk.console.error(`Error decoding raw response: ${error}`);
      }
    }
  }
  
  return betterTrace;
}
