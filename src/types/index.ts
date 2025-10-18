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
