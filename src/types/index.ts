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
  output_component?: string;
  output_type?: string;
  input_type?: string;
  session_id?: string;
  tweaks?: Record<string, unknown>;
}

export interface RunResponse {
  outputs: any[];
  session_id: string;
  [key: string]: any;
}

export interface SimplifiedAPIRequest {
  input_value?: string;
  input_type?: string;
  output_component?: string;
  output_type?: string;
  session_id?: string;
  tweaks?: Record<string, unknown>;
  context?: Record<string, unknown>;
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

export interface RunFlowSessionRequest {
  input_value?: string;
  input_type?: string;
  output_type?: string;
  output_component?: string;
  tweaks?: Record<string, unknown>;
  session_id: string;
  context?: Record<string, unknown>;
}

export interface RegistrationResponse {
  email?: string;
  registered: boolean;
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
  context_id?: string;
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
  is_active?: boolean;
  is_superuser?: boolean;
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

// --- Langflow 1.9.x additional endpoints ---

export interface FlowEventCreate {
  type:
    | 'component_added'
    | 'component_removed'
    | 'component_configured'
    | 'connection_added'
    | 'connection_removed'
    | 'flow_updated'
    | 'flow_settled';
  summary?: string;
}

export interface ListFlowVersionsParams {
  limit?: number;
  offset?: number;
  deployment_provider_id?: string;
}

export interface FlowEventsParams {
  since?: number;
}

export interface DetectVarsRequest {
  flow_version_ids: string[];
}

export interface DetectVarsResponse {
  variables: string[];
}

export interface UpdateCustomComponentRequest {
  code: string;
  field: string;
  template: Record<string, any>;
  field_value?: any;
  frontend_node?: Record<string, any>;
  tool_mode?: boolean;
}

export interface StoreComponentCreate {
  name: string;
  description: string | null;
  data: Record<string, any>;
  tags: string[] | null;
  is_component: boolean | null;
  parent?: string;
  last_tested_version?: string;
  private?: boolean;
  [key: string]: any;
}

export interface OpenAIResponsesRequest {
  model: string;
  input: string;
  stream?: boolean;
  background?: boolean;
  previous_response_id?: string;
  include?: string[];
  tools?: any[];
  [key: string]: any;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  optins?: Record<string, any>;
  [key: string]: any;
}

export interface UploadFileV2Params {
  append?: boolean;
  ephemeral?: boolean;
}

export interface GetFileV2Params {
  return_content?: boolean;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  embedding_provider: string;
  embedding_model: string;
  column_config?: any[];
}

export interface ListKnowledgeBaseChunksParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface KnowledgeBaseFile {
  buffer: Buffer;
  filename?: string;
}

export interface MessageUpdate {
  context_id?: string;
  edit?: boolean;
  error?: boolean;
  files?: string[];
  properties?: Record<string, any>;
  sender?: string;
  sender_name?: string;
  session_id?: string;
  session_metadata?: Record<string, any>;
  text?: string;
  [key: string]: any;
}

export interface SharedMessagesParams {
  source_flow_id: string;
  session_id?: string;
  order_by?: string;
}

export interface MigrateSharedSessionParams {
  new_session_id: string;
  source_flow_id: string;
}

export interface ListTracesParams {
  flow_id?: string;
  session_id?: string;
  status?: 'unset' | 'ok' | 'error';
  query?: string;
  start_time?: string;
  end_time?: string;
  page?: number;
  size?: number;
}

export interface ListModelsParams {
  provider?: string;
  model_name?: string;
  model_type?: string;
  include_unsupported?: boolean;
  include_deprecated?: boolean;
  tool_calling?: boolean;
  reasoning?: boolean;
  search?: string;
  preview?: boolean;
  deprecated?: boolean;
  not_supported?: boolean;
  [key: string]: any;
}

export interface EnabledProvidersParams {
  providers?: string[];
}

export interface EnabledModelsParams {
  model_names?: string[];
}

export interface ModelStatusUpdate {
  provider: string;
  model_id: string;
  enabled: boolean;
}

export interface DefaultModelTypeParams {
  model_type: string;
}

export interface DefaultModelRequest {
  provider: string;
  model_name: string;
  model_type: string;
}

export interface ValidateProviderRequest {
  provider: string;
  variables: Record<string, any>;
}

export interface ValidateProviderResponse {
  valid: boolean;
  error?: string;
  [key: string]: any;
}

export interface AssistantRequest {
  flow_id: string;
  input_value?: string;
  session_id?: string;
  component_id?: string;
  field_name?: string;
  model_name?: string;
  provider?: string;
  max_retries?: number;
}

export interface GetWorkflowResultParams {
  job_id?: string;
}

export interface RunWorkflowRequest {
  flow_id: string;
  inputs?: Record<string, any>;
  // Langflow 1.10.0: request-level global variables (preferred over deprecated
  // X-LANGFLOW-GLOBAL-VAR-* headers). Keys <= 256 chars, values <= 64 KB.
  globals?: Record<string, string>;
  stream?: boolean;
  background?: boolean;
  [key: string]: any;
}

export interface StopWorkflowResponse {
  job_id: string;
  message?: string;
  [key: string]: any;
}

export interface ListMcpServersParams {
  action_count?: boolean;
}

export interface MCPProjectConfigParams {
  mcp_enabled?: boolean;
}

export interface MCPProjectUpdateRequest {
  settings: any[];
  auth_settings?: Record<string, any>;
}

export interface MCPInstallRequest {
  client: string;
  transport?: 'sse' | 'streamablehttp';
  [key: string]: any;
}

export interface MCPServerConfigBody {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  [key: string]: any;
}

export interface WebhookEventsParams {
  user_id?: string;
}

// --- Langflow 1.10.0 additional endpoints ---

// authz: roles
export interface ListAuthzRolesParams {
  is_system?: boolean;
  name?: string;
  limit?: number;
  offset?: number;
}

export interface AuthzRoleCreate {
  name: string;
  description?: string;
  permissions?: string[];
  parent_role_id?: string;
}

export interface AuthzRoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
  parent_role_id?: string;
}

// authz: role assignments
export interface ListAuthzRoleAssignmentsParams {
  user_id?: string;
  role_id?: string;
  domain_type?: string;
  domain_id?: string;
  limit?: number;
  offset?: number;
}

export interface AuthzRoleAssignmentCreate {
  user_id: string;
  role_id: string;
  domain_type?: 'global' | 'org' | 'workspace' | 'project';
  domain_id?: string;
}

// authz: teams
export interface ListAuthzTeamsParams {
  search?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface AuthzTeamCreate {
  team_name: string;
  adom_name: string;
  description?: string;
  is_active?: boolean;
}

export interface AuthzTeamUpdate {
  team_name?: string;
  adom_name?: string;
  description?: string;
  is_active?: boolean;
}

export interface ListAuthzTeamMembersParams {
  limit?: number;
  offset?: number;
}

export interface AuthzTeamMemberCreate {
  user_id: string;
  source?: 'manual' | 'sso';
}

// authz: shares
export interface ListAuthzSharesParams {
  resource_type?: string;
  resource_id?: string;
  target_id?: string;
  scope?: string;
  limit?: number;
  offset?: number;
}

export interface AuthzShareCreate {
  resource_type: 'flow' | 'deployment' | 'project' | 'knowledge_base' | 'variable' | 'file';
  resource_id: string;
  scope: 'private' | 'team' | 'user' | 'public';
  target_id?: string;
  permission_level?: 'read' | 'write' | 'execute' | 'admin';
}

export interface AuthzShareUpdate {
  permission_level: 'read' | 'write' | 'execute' | 'admin';
}

// authz: audit
export interface AuthzAuditParams {
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  result?: string;
  since?: string;
  until?: string;
  page?: number;
  size?: number;
}

// authz: effective permissions (me)
export interface EffectivePermissionsRequest {
  resource_type: 'flow' | 'deployment' | 'project' | 'knowledge_base' | 'variable' | 'file' | 'component';
  resource_ids: string[];
  actions?: string[];
  domain?: string;
}

// MemoryBases (hidden/experimental router in Langflow OpenAPI)
export interface ListMemoryBasesParams {
  flow_id?: string;
  page?: number;
  size?: number;
}

export interface MemoryBaseCreate {
  name: string;
  flow_id: string;
  threshold?: number;
  auto_capture?: boolean;
  embedding_model?: string;
  preprocessing?: boolean;
  preproc_model?: string;
  preproc_instructions?: string;
  preproc_kill_phrase?: string;
}

export interface MemoryBaseUpdate {
  name?: string;
  threshold?: number;
  auto_capture?: boolean;
}

export interface ListMemoryBaseSessionsParams {
  page?: number;
  size?: number;
}

export interface ListMemoryBaseMessagesParams {
  session_id?: string;
  page?: number;
  size?: number;
}

export interface MemoryBaseFlushRequest {
  session_id: string;
}

// Knowledge base overhaul (new in 1.10.0)
export interface TestKnowledgeBaseConnectionRequest {
  backend_type: string;
  backend_config?: Record<string, any>;
}

export interface IngestKnowledgeBaseFolderRequest {
  path: string;
  recursive?: boolean;
  extensions?: string[];
  max_file_size_bytes?: number;
  source_name?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  separator?: string;
  metadata?: Record<string, any>;
  per_file_metadata?: Record<string, Record<string, any>>;
}

export interface IngestKnowledgeBaseConnectorRequest {
  source_type: string;
  source_config?: Record<string, any>;
  source_name?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  separator?: string;
}

export interface ListKnowledgeBaseRunsParams {
  page?: number;
  limit?: number;
}

// Extensions
export interface ExtensionEventsParams {
  since?: number;
}

// Agentic file system + sessions (new in 1.10.0)
export interface AgenticFileParams {
  path: string;
  download?: boolean;
}

export interface ResetAgenticSessionParams {
  session_id?: string;
}
