export interface Finding {
  id?: number;
  dupKey: string;
  debug: string;
  notification: boolean; // The browser extension uses badge + notification keys.
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
  aiScore?: AIScore;
  promptId?: number;
}

export interface PaginationInfo {
  page: number;
  totalPages: number;
  totalEntries: number;
  entriesPerPage: number;
}

export interface FindingsResponse {
  success: boolean;
  findings: Finding[];
  pagination: PaginationInfo;
  error?: string;
}

export interface ProjectInfo {
  name: string;
  tableName: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  count?: number;
  findingsWithoutPrompt?: number;
  error?: string;
  message?: string;
  data?: T;
}

// Parser types
export interface Token {
    type: 'paren' | 'string' | 'identifier' | 'logical' | 'colon';
    value: string;
}

export interface ComparisonNode {
    type: 'comparison';
    objectPath: string;
    operator: string;
    value: string;
}

export interface LogicalNode {
    type: 'and' | 'or';
    left: AstNode;
    right: AstNode;
}

export type AstNode = ComparisonNode | LogicalNode;

export interface SqlResult {
    whereClause: string;
    params: string[];
}

export interface ColumnMapping {
    [objectPath: string]: string;
}

// Supported operators
export type Operator = 'eq' | 'ne' | 'neq' | 'cont' | 'ncont' | 'like' | 'nlike';

// AI Score values
export type AIScore = '' | 'In queue' | 'In progress' | '1' | '2' | '3' | '4' | '5';

export interface Project {
  id: number;
  name: string;
  table_name: string;
  rowCount: number;
  tableSize: number;
  created_at: string;
}

export interface ProjectsResponse {
  success: boolean;
  projects?: Project[];
  error?: string;
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

export interface GraphQLResponse {
  data?: {
    requests: {
      edges: Array<{
        node: {
          response: {
            raw: string;
          };
        };
      }>;
    };
  };
}
