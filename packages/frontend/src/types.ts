import { type Caido } from "@caido/sdk-frontend";
import { type API } from "backend";

export interface Finding {
  id?: number;
  dupKey: string;
  debug: string;
  alert: boolean;
  tag: string;
  type: string;
  date: string;
  href: string;
  frame: string;
  sink: string;
  data: string;
  trace: string;
  favorite?: boolean;
  aiScore?: string;
  promptId?: number;
}

export interface Suggestion {
  display: string;
  value: string;
  description?: string;
  icon?: string;
}

export interface SuggestionConfigItem {
  name: string;
  description: string;
  variables?: Array<{ name: string; description: string }>;
}

export interface SuggestionConfig {
  globalObjects: SuggestionConfigItem[];
  functions: Array<{ name: string; description: string }>;
  operators: Array<{ name: string; description: string }>;
}

export interface PaginationInfo {
  page: number;
  entriesPerPage: number;
  totalEntries: number;
  totalPages: number;
}

export interface GetFindingsResponse {
  success: boolean;
  findings?: Finding[];
  pagination?: PaginationInfo;
  error?: string;
}

export interface AddFindingsResponse {
  success: boolean;
  count?: number;
  error?: string;
}

export type FrontendSDK = Caido<API, Record<string, never>>;

export interface Project {
  id: number;
  name: string;
  table_name: string;
  rowCount: number;
  tableSize: number;
  created_at: string;
}

export interface AIConfig {
  id?: number;
  openrouter_api_key: string;
  system_prompt: string;
  ai_enabled: boolean;
  selected_model: string;
  temperature: number;
  thread_count: number;
  created_at?: string;
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  created: number;
}

export interface UserPrompt {
  id?: number;
  name: string;
  condition: string;
  prompt: string;
  enabled: boolean;
  created_at?: string;
}

export interface AIConfigResponse {
  success: boolean;
  config?: AIConfig;
  error?: string;
}

export interface UserPromptsResponse {
  success: boolean;
  prompts?: UserPrompt[];
  error?: string;
}

export interface UserPromptResponse {
  success: boolean;
  prompt?: UserPrompt;
  error?: string;
}
