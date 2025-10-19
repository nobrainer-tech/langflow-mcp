export interface MCPServerConfig {
  port: number;
  host: string;
  authToken?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean | Record<string, any>;
  };
  outputSchema?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean | Record<string, any>;
  };
}

export interface LangflowConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface FlowCreate {
  name: string;
  description?: string;
  data?: any;
  folder_id?: string;
}

export interface FlowRead {
  id: string;
  name: string;
  description?: string;
  data?: any;
  user_id: string;
  folder_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FlowUpdate {
  name?: string;
  description?: string;
  data?: any;
  folder_id?: string;
}

export interface ComponentInfo {
  name: string;
  display_name: string;
  description: string;
  type: string;
}

export interface ListFlowsParams {
  page?: number;
  size?: number;
  folder_id?: string;
  components_only?: boolean;
  get_all?: boolean;
}

export interface DeleteFlowsRequest {
  flow_ids: string[];
}

export interface RunFlowRequest {
  input_value?: string;
  output_type?: string;
  input_type?: string;
  tweaks?: Record<string, unknown>;
}

export interface RunResponse {
  outputs: any[];
  session_id: string;
  [key: string]: any;
}

export interface SimplifiedAPIRequest {
  input_value?: string;
  tweaks?: Record<string, unknown>;
}

export interface FolderRead {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FolderCreate {
  name: string;
  description?: string;
  parent_id?: string;
}

export interface FolderUpdate {
  name?: string;
  description?: string;
  parent_id?: string;
}

export interface ListFoldersParams {
  page?: number;
  size?: number;
}

export interface ProjectRead {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

export interface ListProjectsParams {
  page?: number;
  size?: number;
}

export interface VariableRead {
  id: string;
  name: string;
  value: string;
  type?: string;
  default_fields?: string[];
  created_at: string;
  updated_at: string;
}

export interface VariableCreate {
  name: string;
  value: string;
  type?: string;
  default_fields?: string[];
}

export interface VariableUpdate {
  name?: string;
  value?: string;
  type?: string;
}

export interface FileUpload {
  name: string;
  content: string;
  type?: string;
}

export interface BuildFlowRequest {
  inputs?: Record<string, unknown>;
  data?: Record<string, unknown>;
  files?: string[];
}

export interface BuildFlowParams {
  stop_component_id?: string;
  start_component_id?: string;
  log_builds?: boolean;
  flow_name?: string;
  event_delivery?: 'polling' | 'streaming' | 'direct';
}

export interface BuildFlowResponse {
  job_id: string;
}

export interface BuildStatusResponse {
  [key: string]: any;
}

export interface CancelBuildResponse {
  success: boolean;
  message?: string;
  cancelled?: boolean;
}

export interface KnowledgeBaseInfo {
  name: string;
  description?: string;
  [key: string]: any;
}

export interface BulkDeleteKnowledgeBasesRequest {
  kb_names: string[];
}
