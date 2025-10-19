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
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
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

export interface FileListItem {
  name: string;
  path: string;
  size?: number;
  modified?: string;
}

export interface ValidateCodeRequest {
  code: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  is_valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface ValidatePromptRequest {
  prompt: string;
}

export interface ValidatePromptResponse {
  valid: boolean;
  errors?: string[];
  variables?: string[];
}

export interface StoreComponent {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  [key: string]: any;
}

export interface ListStoreComponentsParams {
  component_id?: string;
  search?: string;
  private?: boolean;
  is_component?: boolean;
  tags?: string[];
  sort?: string[];
  liked?: boolean;
  filter_by_user?: boolean;
  fields?: string[];
  page?: number;
  limit?: number;
  category?: string;
}

export interface StoreTag {
  name: string;
  count?: number;
}

export interface UserLike {
  component_id: string;
  liked_at?: string;
}

export interface RunFlowAdvancedRequest {
  input_value?: string;
  input_type?: string;
  output_type?: string;
  output_component?: string;
  tweaks?: Record<string, unknown>;
  session_id?: string;
}

export interface ProcessFlowRequest {
  inputs?: Record<string, unknown>;
  tweaks?: Record<string, unknown>;
}

export interface PredictFlowRequest {
  inputs?: Record<string, unknown>;
  tweaks?: Record<string, unknown>;
}

export interface MonitorBuildsParams {
  flow_id: string;
}

export interface VertexBuildMapModel {
  vertex_builds: {
    [vertexId: string]: any[];
  };
}

export interface MonitorMessagesParams {
  flow_id?: string;
  session_id?: string;
  sender?: string;
  sender_name?: string;
  order_by?: string;
}

export interface MessageResponse {
  id: string;
  session_id: string;
  sender: string;
  sender_name?: string;
  text: string;
  timestamp: string;
  [key: string]: any;
}

export interface MonitorSessionsParams {
  flow_id?: string;
}

export interface DeleteMonitorMessagesRequest {
  message_ids: string[];
}

export interface MigrateSessionParams {
  old_session_id: string;
  new_session_id: string;
}

export interface MonitorTransactionsParams {
  flow_id: string;
  page?: number;
  size?: number;
}

export interface TransactionResponse {
  [key: string]: any;
}

export interface BuildVerticesRequest {
  data?: Record<string, unknown>;
  stop_component_id?: string;
  start_component_id?: string;
  vertex_ids?: string[];
}

export interface VerticesOrderResponse {
  ids: string[];
  run_id: string;
  [key: string]: any;
}

export interface GetVertexParams {
  flow_id: string;
  vertex_id: string;
}

export interface StreamVertexBuildParams {
  flow_id: string;
  vertex_id: string;
}

export interface VersionResponse {
  version: string;
  [key: string]: any;
}

export interface UserRead {
  id: string;
  username: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface UserCreate {
  username: string;
  password: string;
  email?: string;
  profile_image?: string;
  [key: string]: any;
}

export interface UserUpdate {
  username?: string;
  password?: string;
  profile_image?: string;
  [key: string]: any;
}

export interface ListUsersParams {
  skip?: number;
  limit?: number;
}

export interface ApiKeyRead {
  id: string;
  name: string;
  api_key?: string; // WARNING: Only present on creation, store securely!
  created_at: string;
  last_used_at?: string;
  total_uses?: number;
  is_active?: boolean;
  [key: string]: any;
}

export interface ApiKeyCreate {
  name: string;
}

export interface CustomComponentRead {
  id: string;
  name: string;
  code: string;
  description?: string;
  return_type?: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface CustomComponentCreate {
  code: string;
  name: string;
  description?: string;
  return_type?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  [key: string]: any;
}

export interface BatchFlowCreate {
  flows: FlowCreate[];
}

export interface TaskStatusResponse {
  task_id: string;
  status: string;
  result?: any;
  error?: string;
  [key: string]: any;
}

export interface StarterProject {
  id: string;
  name: string;
  description?: string;
  data?: any;
  [key: string]: any;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  [key: string]: any;
}

export interface HealthResponse {
  status: string;
  [key: string]: any;
}
