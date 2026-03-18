import { SDK, DefineAPI } from "caido:plugin";
import { initDatabase } from "./utils";

// Findings routes
import { addFindings } from "./routes/findings/addFindings";
import { getFindings } from "./routes/findings/getFindings";
import { deleteFindings } from "./routes/findings/deleteFindings";
import { updateFindingFavorite } from "./routes/findings/updateFindingFavorite";
import { updateFindingsAIScore } from "./routes/findings/updateFindingsAIScore";
import { enhanceFindingTrace } from "./routes/findings/enhanceFindingTrace";

// Projects routes
import { getProjects } from "./routes/projects/getProjects";
import { deleteProject } from "./routes/projects/deleteProject";

// Temp Project routes
import { createTempProject } from "./routes/tempProject/createTempProject";
import { deleteTempProject } from "./routes/tempProject/deleteTempProject";

// AI routes
import { getAIConfig } from "./routes/ai/getAIConfig";
import { updateSystemPrompt } from "./routes/ai/updateSystemPrompt";
import { updateOpenAIKey } from "./routes/ai/updateOpenAIKey";
import { updateAIEnabled } from "./routes/ai/updateAIEnabled";
import { getAIModels } from "./routes/ai/getAIModels";
import { updateSelectedModel } from "./routes/ai/updateSelectedModel";
import { updateTemperature } from "./routes/ai/updateTemperature";
import { updateThreadCount } from "./routes/ai/updateThreadCount";
import { getUserPrompts } from "./routes/ai/getUserPrompts";
import { getUserPrompt } from "./routes/ai/getUserPrompt";
import { createUserPrompt } from "./routes/ai/createUserPrompt";
import { updateUserPrompt } from "./routes/ai/updateUserPrompt";
import { deleteUserPrompt } from "./routes/ai/deleteUserPrompt";
import { testAIConfiguration } from "./routes/ai/testAIConfiguration";
import { initAICron } from "./aiCron";

// import { loadSampleData } from "./sampleData";

export type API = DefineAPI<{
  addFindings: typeof addFindings;
  getFindings: typeof getFindings;
  deleteFindings: typeof deleteFindings;
  updateFindingFavorite: typeof updateFindingFavorite;
  updateFindingsAIScore: typeof updateFindingsAIScore;
  enhanceFindingTrace: typeof enhanceFindingTrace;
  getProjects: typeof getProjects;
  deleteProject: typeof deleteProject;
  createTempProject: typeof createTempProject;
  deleteTempProject: typeof deleteTempProject;
  getAIConfig: typeof getAIConfig;
  updateSystemPrompt: typeof updateSystemPrompt;
  updateOpenAIKey: typeof updateOpenAIKey;
  updateAIEnabled: typeof updateAIEnabled;
  getAIModels: typeof getAIModels;
  updateSelectedModel: typeof updateSelectedModel;
  updateTemperature: typeof updateTemperature;
  updateThreadCount: typeof updateThreadCount;
  getUserPrompts: typeof getUserPrompts;
  getUserPrompt: typeof getUserPrompt;
  createUserPrompt: typeof createUserPrompt;
  updateUserPrompt: typeof updateUserPrompt;
  deleteUserPrompt: typeof deleteUserPrompt;
  testAiConfiguration: typeof testAIConfiguration;
}>;

/**
 * Plugin initialization function
 * Sets up the database and registers all API endpoints
 * 
 * @param sdk - The Caido SDK instance
 */
export async function init(sdk: SDK<API>) {
  // Initialize database and create tables
  await initDatabase(sdk);

  // Register Findings routes
  sdk.api.register("addFindings", addFindings);
  sdk.api.register("getFindings", getFindings);
  sdk.api.register("deleteFindings", deleteFindings);
  sdk.api.register("updateFindingFavorite", updateFindingFavorite);
  sdk.api.register("updateFindingsAIScore", updateFindingsAIScore);
  sdk.api.register("enhanceFindingTrace", enhanceFindingTrace);

  // Register Projects routes
  sdk.api.register("getProjects", getProjects);
  sdk.api.register("deleteProject", deleteProject);

  // Register Temp Project routes
  sdk.api.register("createTempProject", createTempProject);
  sdk.api.register("deleteTempProject", deleteTempProject);

  // Register AI routes
  sdk.api.register("getAIConfig", getAIConfig);
  sdk.api.register("updateSystemPrompt", updateSystemPrompt);
  sdk.api.register("updateOpenAIKey", updateOpenAIKey);
  sdk.api.register("updateAIEnabled", updateAIEnabled);
  sdk.api.register("getAIModels", getAIModels);
  sdk.api.register("updateSelectedModel", updateSelectedModel);
  sdk.api.register("updateTemperature", updateTemperature);
  sdk.api.register("updateThreadCount", updateThreadCount);
  sdk.api.register("getUserPrompts", getUserPrompts);
  sdk.api.register("getUserPrompt", getUserPrompt);
  sdk.api.register("createUserPrompt", createUserPrompt);
  sdk.api.register("updateUserPrompt", updateUserPrompt);
  sdk.api.register("deleteUserPrompt", deleteUserPrompt);
  sdk.api.register("testAiConfiguration", testAIConfiguration);

  // Load sample data during initialization
  // sdk.console.log("Loading sample data");
  // await loadSampleData(sdk);

  // Initialize AI cron
  initAICron(sdk);

  sdk.console.log("DOMLogger++ backend initialized successfully");
}