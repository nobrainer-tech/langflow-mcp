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

Examples:
- List flows: { "action": "list", "page": 1, "size": 10 }
- Get flow: { "action": "get", "flow_id": "uuid" }
- Create flow: { "action": "create", "name": "My Flow" }
- Delete flow: { "action": "delete", "flow_id": "uuid" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'create', 'update', 'delete', 'delete_many', 'batch_create', 'download', 'upload', 'get_public', 'get_examples', 'get_starters'],
          description: 'Action to perform'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID) - required for get, update, delete, get_public' },
        flow_ids: { type: 'array', items: { type: 'string' }, description: 'Array of flow IDs - for delete_many, download' },
        name: { type: 'string', description: 'Flow name - for create, update' },
        description: { type: 'string', description: 'Flow description - for create, update' },
        data: { type: 'object', description: 'Flow data/structure - for create, update' },
        folder_id: { type: 'string', description: 'Folder ID - for list, create, update' },
        page: { type: 'number', description: 'Page number for pagination' },
        size: { type: 'number', description: 'Page size (max 100)' },
        file: { type: 'object', description: 'File object {name, content} - for upload' },
        flows: { type: 'array', description: 'Array of flow objects - for batch_create' }
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
        user_id: { type: 'string', description: 'User ID for user-scoped execution' },
        stream: { type: 'boolean', description: 'Enable streaming mode' },
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
- get_vertex: Get vertex details
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
          enum: ['start', 'status', 'cancel', 'vertices', 'get_vertex', 'stream_vertex', 'task_status'],
          description: 'Build action'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID)' },
        job_id: { type: 'string', description: 'Build job ID - for status, cancel' },
        task_id: { type: 'string', description: 'Task ID - for task_status' },
        vertex_id: { type: 'string', description: 'Vertex ID - for get_vertex, stream_vertex' },
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

Examples:
- List: { "action": "list" }
- Create: { "action": "create", "name": "API_KEY", "value": "xxx" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'create', 'update', 'delete'],
          description: 'Variable action'
        },
        variable_id: { type: 'string', description: 'Variable ID (UUID)' },
        name: { type: 'string', description: 'Variable name' },
        value: { type: 'string', description: 'Variable value' },
        type: { type: 'string', description: 'Variable type' },
        default_fields: { type: 'array', description: 'Default fields' }
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
- upload: Upload file to knowledge base

Examples:
- List: { "action": "list" }
- Upload: { "action": "upload", "kb_name": "my-kb", "file_content": "base64...", "file_name": "doc.pdf" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'delete', 'bulk_delete', 'upload'],
          description: 'Knowledge base action'
        },
        kb_name: { type: 'string', description: 'Knowledge base name' },
        kb_names: { type: 'array', items: { type: 'string' }, description: 'KB names - for bulk_delete' },
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

Examples:
- Get builds: { "action": "get_builds", "flow_id": "uuid" }
- Get messages: { "action": "get_messages", "session_id": "sess-1" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_builds', 'delete_builds', 'get_messages', 'get_message', 'delete_messages', 'get_sessions', 'get_session_messages', 'migrate_session', 'get_transactions'],
          description: 'Monitor action'
        },
        flow_id: { type: 'string', description: 'Flow ID (UUID)' },
        session_id: { type: 'string', description: 'Session ID' },
        message_id: { type: 'string', description: 'Message ID' },
        message_ids: { type: 'array', items: { type: 'string' }, description: 'Message IDs - for delete' },
        sender: { type: 'string', description: 'Filter by sender' },
        sender_name: { type: 'string', description: 'Filter by sender name' },
        order_by: { type: 'string', description: 'Order by field' },
        new_session_id: { type: 'string', description: 'New session ID - for migrate' }
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
- get: Get user by ID
- get_current: Get current authenticated user
- update: Update user profile
- reset_password: Reset user password (admin)

Examples:
- Get current: { "action": "get_current" }
- Update: { "action": "update", "user_id": "uuid", "username": "newname" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'get', 'get_current', 'update', 'reset_password'],
          description: 'User action'
        },
        user_id: { type: 'string', description: 'User ID (UUID)' },
        username: { type: 'string', description: 'Username' },
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

Examples:
- Login: { "action": "login", "username": "user", "password": "pass" }
- Create key: { "action": "create_key", "name": "My API Key" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['login', 'auto_login', 'logout', 'refresh', 'list_keys', 'create_key', 'delete_key'],
          description: 'Auth action'
        },
        username: { type: 'string', description: 'Username - for login' },
        password: { type: 'string', description: 'Password - for login' },
        name: { type: 'string', description: 'API key name - for create_key' },
        api_key_id: { type: 'string', description: 'API key ID - for delete_key' }
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
- list_custom: List custom components
- create_custom: Create custom component
- check: Check store availability
- check_key: Validate store API key
- list_store: List store components
- get_store: Get store component details
- list_tags: List store tags
- get_likes: Get user's liked components

Examples:
- List components: { "action": "list_components" }
- Create custom: { "action": "create_custom", "name": "MyComponent", "code": "..." }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list_components', 'list_custom', 'create_custom', 'check', 'check_key', 'list_store', 'get_store', 'list_tags', 'get_likes'],
          description: 'Store action'
        },
        component_id: { type: 'string', description: 'Component ID' },
        name: { type: 'string', description: 'Component name - for create_custom' },
        code: { type: 'string', description: 'Python code - for create_custom' },
        api_key: { type: 'string', description: 'Store API key - for check_key' },
        search: { type: 'string', description: 'Search query - for list_store' },
        tags: { type: 'array', description: 'Filter by tags - for list_store' },
        page: { type: 'number', description: 'Page number' },
        size: { type: 'number', description: 'Page size' }
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

Examples:
- Health check: { "action": "health" }
- Get version: { "action": "version" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['health', 'version', 'logs', 'list_pictures', 'get_picture', 'list_voices'],
          description: 'System action'
        },
        folder_name: { type: 'string', description: 'Folder name - for get_picture' },
        file_name: { type: 'string', description: 'File name - for get_picture' },
        stream: { type: 'boolean', description: 'Stream logs' }
      },
      required: ['action']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }
];
