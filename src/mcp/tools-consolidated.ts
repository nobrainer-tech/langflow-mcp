import { ToolDefinition } from '../types';

export const consolidatedTools: ToolDefinition[] = [
  {
    name: 'flow',
    description: `Manage Langflow workflows - create, read, update, delete, and organize flows.

Actions:
- list: List all flows with optional pagination and folder filter
- get: Get a specific flow by ID
- create: Create a new flow
- update: Update an existing flow
- delete: Delete a single flow
- delete_many: Delete multiple flows
- batch_create: Create multiple flows at once
- download: Download flows as JSON
- upload: Upload a flow from JSON
- get_public: Get a publicly shared flow
- get_examples: Get basic flow examples
- get_starters: List starter project templates
- replace: Replace (PUT) an entire flow by ID
- expand: Expand bundled/expandable flows

Examples:
- List flows: { "action": "list", "page": 1, "size": 10 }
- Get flow: { "action": "get", "flow_id": "uuid" }
- Create flow: { "action": "create", "name": "My Flow" }
- Delete flow: { "action": "delete", "flow_id": "uuid" }
- Replace flow: { "action": "replace", "flow_id": "uuid", "name": "New" }
- Expand flows: { "action": "expand", "body": {} }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete', 'delete_many', 'batch_create', 'download', 'upload', 'get_public', 'get_examples', 'get_starters', 'replace', 'expand'],
          description: 'Action to perform'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID) - required for get, update, delete, get_public, replace' },
        flow_ids: { type: 'array', items: { type: 'string' }, description: 'Array of flow IDs - for delete_many, download' },
        name: { type: 'string', description: 'Flow name - for create, update, replace' },
        description: { type: 'string', description: 'Flow description - for create, update, replace' },
        data: { type: 'object', description: 'Flow data/structure - for create, update, replace' },
        folder_id: { type: 'string', description: 'Folder ID - for list, create, update, replace' },
        page: { type: 'number', description: 'Page number for pagination' },
        size: { type: 'number', description: 'Page size (max 100)' },
        file: { type: 'object', description: 'File object {name, content} - for upload' },
        flows: { type: 'array', description: 'Array of flow objects - for batch_create' },
        body: { type: 'object', description: 'Request body - for expand' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'flow_execution',
    description: `Execute Langflow workflows with various modes and configurations.

Actions:
- run: Simple flow execution with input
- run_advanced: Advanced execution with full control (tweaks, session, streaming)
- run_session: Session-based execution with persistent state
- webhook: Trigger flow via webhook
- process: Legacy process endpoint
- predict: Legacy predict endpoint

Examples:
- Simple run: { "action": "run", "flow_id_or_name": "my-flow", "input_value": "Hello" }
- Advanced: { "action": "run_advanced", "flow_id_or_name": "uuid", "input_value": "Hi", "session_id": "sess-1" }
- Session: { "action": "run_session", "flow_id_or_name": "my-flow", "session_id": "sess-1", "input_value": "Continue" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['run', 'run_advanced', 'run_session', 'webhook', 'process', 'predict'],
          description: 'Execution mode'
        },
        flow_id_or_name: { type: 'string', description: 'Flow ID (UUID) or flow name' },
        flow_id: { type: 'string', description: 'Flow ID (UUID) - for process, predict' },
        input_value: { type: 'string', description: 'Input value for the flow' },
        input_type: { type: 'string', description: 'Input type (e.g., "chat", "text")' },
        output_type: { type: 'string', description: 'Expected output type' },
        output_component: { type: 'string', description: 'Specific output component' },
        tweaks: { type: 'object', description: 'Component parameter overrides' },
        session_id: { type: 'string', description: 'Session ID for conversation continuity' },
        context: { type: 'object', description: 'Request context for simplified run/session execution' },
        user_id: { type: 'string', description: 'User ID for user-scoped execution' },
        stream: { type: 'boolean', description: 'Streaming is currently rejected by this MCP client for run and run_session' },
        inputs: { type: 'object', description: 'Input values - for process, predict' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'build',
    description: `Manage flow builds - start builds, check status, cancel, and work with vertices.

Actions:
- start: Start building a flow
- status: Get build job status
- cancel: Cancel a running build
- vertices: Build specific vertices
- stream_vertex: Stream vertex build (deprecated)
- task_status: Get async task status

Examples:
- Start build: { "action": "start", "flow_id": "uuid" }
- Check status: { "action": "status", "job_id": "job-123" }
- Cancel: { "action": "cancel", "job_id": "job-123" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['start', 'status', 'cancel', 'vertices', 'stream_vertex', 'task_status'],
          description: 'Build action'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID)' },
        job_id: { type: 'string', description: 'Build job ID - for status, cancel' },
        task_id: { type: 'string', description: 'Task ID - for task_status' },
        vertex_id: { type: 'string', description: 'Vertex ID - for stream_vertex' },
        inputs: { type: 'object', description: 'Build inputs' },
        data: { type: 'object', description: 'Build data - for vertices' },
        files: { type: 'array', description: 'Files for build' },
        stop_component_id: { type: 'string', description: 'Stop at component' },
        start_component_id: { type: 'string', description: 'Start from component' },
        event_delivery: { type: 'string', enum: ['polling', 'streaming', 'direct'], description: 'Event delivery mode' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'folder',
    description: `Manage folders for organizing flows.

Actions:
- list: List all folders
- get: Get folder details
- create: Create a new folder
- update: Update folder
- delete: Delete folder
- download: Download folder as archive
- upload: Upload folder from archive

Examples:
- List: { "action": "list" }
- Create: { "action": "create", "name": "My Folder" }
- Delete: { "action": "delete", "folder_id": "uuid" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete', 'download', 'upload'],
          description: 'Folder action'
        },
        folder_id: { type: 'string', description: 'Folder ID (UUID)' },
        name: { type: 'string', description: 'Folder name' },
        description: { type: 'string', description: 'Folder description' },
        parent_id: { type: 'string', description: 'Parent folder ID' },
        page: { type: 'number', description: 'Page number' },
        size: { type: 'number', description: 'Page size' },
        file_content: { type: 'string', description: 'Base64 file content - for upload' },
        file_name: { type: 'string', description: 'File name - for upload' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'project',
    description: `Manage projects (collections of flows).

Actions:
- list: List all projects
- get: Get project details
- create: Create a new project
- update: Update project
- delete: Delete project
- download: Download project
- upload: Upload project

Examples:
- List: { "action": "list" }
- Create: { "action": "create", "name": "My Project" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete', 'download', 'upload'],
          description: 'Project action'
        },
        project_id: { type: 'string', description: 'Project ID (UUID)' },
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        page: { type: 'number', description: 'Page number' },
        size: { type: 'number', description: 'Page size' },
        file: { type: 'object', description: 'File object - for upload' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'variable',
    description: `Manage environment variables for flows.

Actions:
- list: List all variables
- create: Create a new variable
- update: Update variable
- delete: Delete variable
- detect: Detect variables referenced by flow versions

Examples:
- List: { "action": "list" }
- Create: { "action": "create", "name": "API_KEY", "value": "xxx" }
- Detect: { "action": "detect", "flow_version_ids": ["v1"] }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'create', 'update', 'delete', 'detect'],
          description: 'Variable action'
        },
        variable_id: { type: 'string', description: 'Variable ID (UUID)' },
        name: { type: 'string', description: 'Variable name' },
        value: { type: 'string', description: 'Variable value' },
        type: { type: 'string', description: 'Variable type' },
        default_fields: { type: 'array', description: 'Default fields' },
        flow_version_ids: { type: 'array', items: { type: 'string' }, description: 'Flow version IDs - for detect' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'knowledge_base',
    description: `Manage knowledge bases for RAG workflows.

Actions:
- list: List all knowledge bases
- get: Get knowledge base details
- delete: Delete a knowledge base
- bulk_delete: Delete multiple knowledge bases
- upload: Ingest a file into an existing knowledge base
- create: Create a knowledge base
- list_detailed: List knowledge bases with full detail
- list_chunks: List chunks within a knowledge base
- ingest: Ingest a file into a knowledge base
- preview_chunks: Preview chunking of a file
- cancel_ingest: Cancel an in-progress ingestion

Examples:
- List: { "action": "list" }
- Upload: { "action": "upload", "kb_name": "existing-kb", "file_content": "base64...", "file_name": "doc.pdf" }
- Create: { "action": "create", "name": "kb", "embedding_provider": "openai", "embedding_model": "text-embedding-3-small" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'delete', 'bulk_delete', 'upload', 'create', 'list_detailed', 'list_chunks', 'ingest', 'preview_chunks', 'cancel_ingest'],
          description: 'Knowledge base action'
        },
        kb_name: { type: 'string', description: 'Knowledge base name' },
        kb_names: { type: 'array', items: { type: 'string' }, description: 'KB names - for bulk_delete' },
        file_content: { type: 'string', description: 'Base64 file content - for upload, ingest, preview_chunks' },
        file_name: { type: 'string', description: 'File name - for upload, ingest, preview_chunks' },
        name: { type: 'string', description: 'Knowledge base name - for create' },
        embedding_provider: { type: 'string', description: 'Embedding provider - for create' },
        embedding_model: { type: 'string', description: 'Embedding model - for create' },
        column_config: { type: 'array', description: 'Column config - for create' },
        page: { type: 'number', description: 'Page number - for list_chunks' },
        limit: { type: 'number', description: 'Limit - for list_chunks' },
        search: { type: 'string', description: 'Search query - for list_chunks' },
        params: { type: 'object', description: 'Optional chunk/ingest params - for ingest, preview_chunks' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'file',
    description: `Manage files associated with flows.

Actions:
- list: List files for a flow
- upload: Upload a file
- download: Download a file
- delete: Delete a file
- get_image: Get file as image

Examples:
- List: { "action": "list", "flow_id": "uuid" }
- Upload: { "action": "upload", "flow_id": "uuid", "file_content": "base64...", "file_name": "data.csv" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'upload', 'download', 'delete', 'get_image'],
          description: 'File action'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID)' },
        file_name: { type: 'string', description: 'File name' },
        file_content: { type: 'string', description: 'Base64 file content - for upload' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'monitor',
    description: `Monitor flow executions, messages, sessions, and transactions.

Actions:
- get_builds: Get build history for a flow
- delete_builds: Delete build history
- get_messages: Get messages with filters
- get_message: Get a specific message
- delete_messages: Delete messages
- get_sessions: List sessions
- get_session_messages: Get messages for a session
- migrate_session: Migrate session to new flow
- get_transactions: Get transaction history
- update_message: Update a monitor message
- delete_session_messages: Delete all messages for a session
- delete_sessions: Delete multiple sessions
- get_shared: Get shared messages for a source flow
- get_shared_sessions: List shared sessions for a source flow
- update_shared: Update a shared message
- migrate_shared_session: Migrate a shared session id
- delete_shared_session: Delete a shared session

Examples:
- Get builds: { "action": "get_builds", "flow_id": "uuid" }
- Get messages: { "action": "get_messages", "session_id": "sess-1" }
- Update message: { "action": "update_message", "message_id": "m1", "text": "hi" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_builds', 'delete_builds', 'get_messages', 'get_message', 'delete_messages', 'get_sessions', 'get_session_messages', 'migrate_session', 'get_transactions', 'update_message', 'delete_session_messages', 'delete_sessions', 'get_shared', 'get_shared_sessions', 'update_shared', 'migrate_shared_session', 'delete_shared_session'],
          description: 'Monitor action'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID)' },
        session_id: { type: 'string', description: 'Session ID' },
        session_ids: { type: 'array', items: { type: 'string' }, description: 'Session IDs - for delete_sessions' },
        message_id: { type: 'string', description: 'Message ID' },
        message_ids: { type: 'array', items: { type: 'string' }, description: 'Message IDs - for delete' },
        sender: { type: 'string', description: 'Filter by sender / message sender' },
        sender_name: { type: 'string', description: 'Filter by sender name / message sender name' },
        order_by: { type: 'string', description: 'Order by field' },
        new_session_id: { type: 'string', description: 'New session ID - for migrate, migrate_shared_session' },
        source_flow_id: { type: 'string', description: 'Source flow ID - for shared actions' },
        text: { type: 'string', description: 'Message text - for update_message, update_shared' },
        files: { type: 'array', items: { type: 'string' }, description: 'Message files - for update_message, update_shared' },
        properties: { type: 'object', description: 'Message properties - for update_message, update_shared' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'user',
    description: `Manage users and their profiles.

Actions:
- list: List all users (admin)
- get_current: Get current authenticated user
- update: Update user profile
- reset_password: Reset user password (admin)
- create: Create a new user (admin)

Examples:
- Get current: { "action": "get_current" }
- Update: { "action": "update", "user_id": "uuid", "username": "newname" }
- Create: { "action": "create", "username": "bob", "password": "secret" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get_current', 'update', 'reset_password', 'create'],
          description: 'User action'
        },
        user_id: { type: 'string', description: 'User ID (UUID)' },
        username: { type: 'string', description: 'Username - for update, create' },
        password: { type: 'string', description: 'Password - for create' },
        optins: { type: 'object', description: 'Opt-in settings - for create' },
        profile_image: { type: 'string', description: 'Profile image URL' },
        is_active: { type: 'boolean', description: 'Active status' },
        is_superuser: { type: 'boolean', description: 'Superuser status' },
        new_password: { type: 'string', description: 'New password - for reset_password' },
        page: { type: 'number', description: 'Page number' },
        size: { type: 'number', description: 'Page size' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  {
    name: 'auth',
    description: `Authentication and API key management.

Actions:
- login: Login with username/password
- auto_login: Auto-login with stored credentials
- logout: Logout current session
- refresh: Refresh access token
- list_keys: List API keys
- create_key: Create new API key
- delete_key: Delete API key
- save_store_key: Save the Langflow Store API key

Examples:
- Login: { "action": "login", "username": "user", "password": "pass" }
- Create key: { "action": "create_key", "name": "My API Key" }
- Save store key: { "action": "save_store_key", "api_key": "sk-..." }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['login', 'auto_login', 'logout', 'refresh', 'list_keys', 'create_key', 'delete_key', 'save_store_key'],
          description: 'Auth action'
        },
        username: { type: 'string', description: 'Username - for login' },
        password: { type: 'string', description: 'Password - for login' },
        name: { type: 'string', description: 'API key name - for create_key' },
        api_key_id: { type: 'string', description: 'API key ID - for delete_key' },
        api_key: { type: 'string', description: 'Store API key - for save_store_key' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  {
    name: 'store',
    description: `Interact with the Langflow component store and custom components.

Actions:
- list_components: List available components
- create_custom: Create custom component
- check: Check store availability
- check_key: Validate store API key
- list_store: List store components
- get_store: Get store component details
- list_tags: List store tags
- get_likes: Get user's liked components
- create_store: Publish a component to the store
- like: Like a store component
- update_custom: Update custom component code/template

Examples:
- List components: { "action": "list_components" }
- Create custom: { "action": "create_custom", "name": "MyComponent", "code": "..." }
- Like: { "action": "like", "component_id": "id" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list_components', 'create_custom', 'check', 'check_key', 'list_store', 'get_store', 'list_tags', 'get_likes', 'create_store', 'like', 'update_custom'],
          description: 'Store action'
        },
        component_id: { type: 'string', description: 'Component ID - for get_store, like' },
        name: { type: 'string', description: 'Component name - for create_custom, create_store' },
        code: { type: 'string', description: 'Python code - for create_custom, update_custom' },
        api_key: { type: 'string', description: 'Store API key - for check_key' },
        search: { type: 'string', description: 'Search query - for list_store' },
        tags: { type: 'array', description: 'Filter by tags / component tags - for list_store, create_store' },
        page: { type: 'number', description: 'Page number' },
        size: { type: 'number', description: 'Page size' },
        description: { type: 'string', description: 'Component description - for create_store' },
        data: { type: 'object', description: 'Component data - for create_store' },
        is_component: { type: 'boolean', description: 'Whether it is a component - for create_store' },
        parent: { type: 'string', description: 'Parent component ID - for create_store' },
        last_tested_version: { type: 'string', description: 'Last tested version - for create_store' },
        private: { type: 'boolean', description: 'Private flag - for create_store' },
        field: { type: 'string', description: 'Target field - for update_custom' },
        template: { type: 'object', description: 'Component template - for update_custom' },
        field_value: { description: 'New field value - for update_custom' },
        frontend_node: { type: 'object', description: 'Frontend node - for update_custom' },
        tool_mode: { type: 'boolean', description: 'Tool mode - for update_custom' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'registration',
    description: `User registration management.

Actions:
- get: Get registration status
- register: Register a new user

Examples:
- Check status: { "action": "get" }
- Register: { "action": "register", "email": "user@example.com" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get', 'register'],
          description: 'Registration action'
        },
        email: { type: 'string', description: 'Email address - for register' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false
    }
  },
  {
    name: 'validation',
    description: `Validate code and prompts.

Actions:
- code: Validate Python code
- prompt: Validate prompt template

Examples:
- Validate code: { "action": "code", "code": "def hello(): pass" }
- Validate prompt: { "action": "prompt", "prompt": "Hello {name}" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['code', 'prompt'],
          description: 'Validation action'
        },
        code: { type: 'string', description: 'Python code to validate' },
        prompt: { type: 'string', description: 'Prompt template to validate' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'system',
    description: `System information and utilities.

Actions:
- health: Check system health
- version: Get Langflow version
- logs: Get system logs
- list_pictures: List profile pictures
- get_picture: Get a profile picture
- list_voices: List ElevenLabs voices
- session: Get current session info
- webhook_events: Get webhook events for a flow
- health_check: Detailed root health check

Examples:
- Health check: { "action": "health" }
- Get version: { "action": "version" }
- Webhook events: { "action": "webhook_events", "flow_id_or_name": "my-flow" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['health', 'version', 'logs', 'list_pictures', 'get_picture', 'list_voices', 'session', 'webhook_events', 'health_check'],
          description: 'System action'
        },
        folder_name: { type: 'string', description: 'Folder name - for get_picture' },
        file_name: { type: 'string', description: 'File name - for get_picture' },
        stream: { type: 'boolean', description: 'Stream logs' },
        flow_id_or_name: { type: 'string', description: 'Flow ID or name - for webhook_events' },
        user_id: { type: 'string', description: 'User ID filter - for webhook_events' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  },
  {
    name: 'flow_version',
    description: `Manage flow versions and flow lifecycle events.

Actions:
- list: List versions of a flow
- create: Create a new flow version
- get: Get a specific flow version
- delete: Delete a flow version
- activate: Activate a flow version
- get_events: Get lifecycle events for a flow
- create_event: Create a lifecycle event for a flow

Examples:
- List: { "action": "list", "flow_id": "uuid" }
- Activate: { "action": "activate", "flow_id": "uuid", "version_id": "v1" }
- Create event: { "action": "create_event", "flow_id": "uuid", "type": "flow_settled" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'create', 'get', 'delete', 'activate', 'get_events', 'create_event'],
          description: 'Flow version action'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID)' },
        version_id: { type: 'string', description: 'Version ID - for get, delete, activate' },
        body: { type: 'object', description: 'Version body - for create' },
        save_draft: { type: 'boolean', description: 'Save draft on activate' },
        limit: { type: 'number', description: 'Limit - for list' },
        offset: { type: 'number', description: 'Offset - for list' },
        deployment_provider_id: { type: 'string', description: 'Deployment provider ID - for list' },
        since: { type: 'number', description: 'Since timestamp - for get_events' },
        type: { type: 'string', description: 'Event type - for create_event' },
        summary: { type: 'string', description: 'Event summary - for create_event' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'file_v2',
    description: `Manage user-scoped files via the v2 files API.

Actions:
- list: List all v2 files
- upload: Upload a file
- get: Get file metadata or content
- rename: Rename a file
- delete: Delete a file
- delete_all: Delete all files
- batch_download: Download multiple files
- batch_delete: Delete multiple files

Examples:
- List: { "action": "list" }
- Upload: { "action": "upload", "file_content": "base64...", "file_name": "doc.pdf" }
- Get: { "action": "get", "file_id": "id", "return_content": true }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'upload', 'get', 'rename', 'delete', 'delete_all', 'batch_download', 'batch_delete'],
          description: 'File V2 action'
        },
        file_id: { type: 'string', description: 'File ID - for get, rename, delete' },
        file_ids: { type: 'array', items: { type: 'string' }, description: 'File IDs - for batch_download, batch_delete' },
        file_content: { type: 'string', description: 'Base64 file content - for upload' },
        file_name: { type: 'string', description: 'File name - for upload' },
        name: { type: 'string', description: 'New name - for rename' },
        append: { type: 'boolean', description: 'Append to existing file - for upload' },
        ephemeral: { type: 'boolean', description: 'Ephemeral file - for upload' },
        return_content: { type: 'boolean', description: 'Return file content - for get' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'model',
    description: `Manage LLM models and providers.

Actions:
- list: List available models
- providers: List all model providers
- enabled_providers: List enabled providers
- enabled_models: List enabled models
- set_enabled: Enable/disable models
- get_default: Get the default model for a type
- set_default: Set the default model for a type
- delete_default: Remove the default model for a type
- provider_mapping: Get provider-to-variable mapping
- validate_provider: Validate provider credentials
- options_language: Get language model options
- options_embedding: Get embedding model options

Examples:
- List: { "action": "list", "provider": "openai" }
- Set default: { "action": "set_default", "provider": "openai", "model_name": "gpt-4o", "model_type": "language" }
- Validate: { "action": "validate_provider", "provider": "openai", "variables": {} }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'providers', 'enabled_providers', 'enabled_models', 'set_enabled', 'get_default', 'set_default', 'delete_default', 'provider_mapping', 'validate_provider', 'options_language', 'options_embedding'],
          description: 'Model action'
        },
        provider: { type: 'string', description: 'Provider name - for list, set_default, validate_provider' },
        providers: { type: 'array', items: { type: 'string' }, description: 'Provider filter - for enabled_providers' },
        model_name: { type: 'string', description: 'Model name - for list, set_default' },
        model_names: { type: 'array', items: { type: 'string' }, description: 'Model filter - for enabled_models' },
        model_type: { type: 'string', description: 'Model type - for get_default, set_default, delete_default' },
        models: { type: 'array', description: 'Models to enable/disable - for set_enabled' },
        variables: { type: 'object', description: 'Provider credentials - for validate_provider' },
        include_unsupported: { type: 'boolean', description: 'Include unsupported - for list' },
        include_deprecated: { type: 'boolean', description: 'Include deprecated - for list' },
        tool_calling: { type: 'boolean', description: 'Filter tool-calling models - for list' },
        reasoning: { type: 'boolean', description: 'Filter reasoning models - for list' },
        search: { type: 'string', description: 'Search query - for list' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'agentic',
    description: `Use the agentic assistant to configure and run flows.

Actions:
- assist: Get agentic assistance for a flow component
- check_config: Check whether agentic features are configured
- execute: Execute an agentic flow by name

Examples:
- Assist: { "action": "assist", "flow_id": "uuid", "input_value": "help me" }
- Check config: { "action": "check_config" }
- Execute: { "action": "execute", "flow_name": "my-flow", "flow_id": "uuid" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['assist', 'check_config', 'execute'],
          description: 'Agentic action'
        },
        flow_id: { type: 'string', description: 'Flow ID - for assist, execute' },
        flow_name: { type: 'string', description: 'Flow name - for execute' },
        input_value: { type: 'string', description: 'Input value' },
        session_id: { type: 'string', description: 'Session ID' },
        component_id: { type: 'string', description: 'Component ID' },
        field_name: { type: 'string', description: 'Field name' },
        model_name: { type: 'string', description: 'Model name' },
        provider: { type: 'string', description: 'Provider' },
        max_retries: { type: 'number', description: 'Max retries' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'workflow',
    description: `Run and manage v2 workflows.

Actions:
- run: Run a workflow
- get_result: Get a workflow result (optionally by job_id)
- stop: Stop a running workflow

Examples:
- Run: { "action": "run", "flow_id": "uuid" }
- Get result: { "action": "get_result", "job_id": "job-1" }
- Stop: { "action": "stop", "job_id": "job-1" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['run', 'get_result', 'stop'],
          description: 'Workflow action'
        },
        flow_id: { type: 'string', description: 'Flow ID - for run' },
        inputs: { type: 'object', description: 'Workflow inputs - for run' },
        stream: { type: 'boolean', description: 'Stream results - for run' },
        background: { type: 'boolean', description: 'Run in background - for run' },
        job_id: { type: 'string', description: 'Job ID - for get_result, stop' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'mcp_server',
    description: `Manage MCP servers registered with Langflow.

Actions:
- list: List MCP servers
- get: Get an MCP server by name
- create: Create an MCP server
- update: Update an MCP server
- delete: Delete an MCP server

Examples:
- List: { "action": "list" }
- Create: { "action": "create", "server_name": "my-server", "config": { "command": "npx" } }
- Delete: { "action": "delete", "server_name": "my-server" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete'],
          description: 'MCP server action'
        },
        server_name: { type: 'string', description: 'Server name - for get, create, update, delete' },
        config: { type: 'object', description: 'Server config {command,args,env,url,headers} - for create, update' },
        action_count: { type: 'boolean', description: 'Include action counts - for list' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'mcp_project',
    description: `Manage MCP project configuration and installation.

Actions:
- get_config: Get MCP config for a project
- update_config: Update MCP config for a project
- get_installed: Get installed MCP clients for a project
- install: Install MCP for a project into a client
- get_composer_url: Get the MCP composer URL for a project

Examples:
- Get config: { "action": "get_config", "project_id": "uuid" }
- Install: { "action": "install", "project_id": "uuid", "client": "cursor" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_config', 'update_config', 'get_installed', 'install', 'get_composer_url'],
          description: 'MCP project action'
        },
        project_id: { type: 'string', description: 'Project ID (UUID)' },
        mcp_enabled: { type: 'boolean', description: 'Filter by enabled - for get_config' },
        settings: { type: 'array', description: 'Settings array - for update_config' },
        auth_settings: { type: 'object', description: 'Auth settings - for update_config' },
        client: { type: 'string', description: 'Client name - for install' },
        transport: { type: 'string', description: 'Transport - for install' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'trace',
    description: `Inspect and manage execution traces.

Actions:
- list: List traces with filters
- get: Get a specific trace
- delete: Delete a specific trace
- delete_by_flow: Delete all traces for a flow

Examples:
- List: { "action": "list", "flow_id": "uuid" }
- Get: { "action": "get", "trace_id": "t1" }
- Delete by flow: { "action": "delete_by_flow", "flow_id": "uuid" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'delete', 'delete_by_flow'],
          description: 'Trace action'
        },
        trace_id: { type: 'string', description: 'Trace ID - for get, delete' },
        flow_id: { type: 'string', description: 'Flow ID - for list, delete_by_flow' },
        session_id: { type: 'string', description: 'Session filter - for list' },
        status: { type: 'string', description: 'Status filter - for list' },
        query: { type: 'string', description: 'Query filter - for list' },
        start_time: { type: 'string', description: 'Start time filter - for list' },
        end_time: { type: 'string', description: 'End time filter - for list' },
        page: { type: 'number', description: 'Page number - for list' },
        size: { type: 'number', description: 'Page size - for list' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'response',
    description: `Create OpenAI-compatible responses via the /responses endpoint.

Actions:
- create: Create a response

Examples:
- Create: { "action": "create", "model": "gpt-4o", "input": "Hello" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create'],
          description: 'Response action'
        },
        model: { type: 'string', description: 'Model name' },
        input: { type: 'string', description: 'Input text' },
        stream: { type: 'boolean', description: 'Stream the response' },
        background: { type: 'boolean', description: 'Run in background' },
        previous_response_id: { type: 'string', description: 'Previous response ID for continuation' },
        include: { type: 'array', items: { type: 'string' }, description: 'Fields to include' },
        tools: { type: 'array', description: 'Tools available to the response' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  }
];
