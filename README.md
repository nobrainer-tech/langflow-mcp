# langflow-mcp-server

[![npm version](https://badge.fury.io/js/langflow-mcp-server.svg)](https://www.npmjs.com/package/langflow-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/langflow-mcp-server.svg)](https://www.npmjs.com/package/langflow-mcp-server)
[![GitHub release](https://img.shields.io/github/v/release/nobrainer-tech/langflow-mcp)](https://github.com/nobrainer-tech/langflow-mcp/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-780%20passing-brightgreen.svg)](https://github.com/nobrainer-tech/langflow-mcp)
[![MCP Badge](https://lobehub.com/badge/mcp/nobrainer-tech-langflow-mcp)](https://lobehub.com/mcp/nobrainer-tech-langflow-mcp)

A Model Context Protocol (MCP) server that provides AI assistants with comprehensive access to Langflow workflow automation platform.

## Overview

langflow-mcp-server serves as a bridge between Langflow's workflow automation platform and AI models, enabling them to understand and work with Langflow flows effectively.

**API Compatibility**: This server is built on the [Langflow API documentation](https://docs.langflow.org/api) and supports Langflow API version **1.9.6**. Langflow 1.9.6 does not introduce API route contract changes over the 1.9.5 contract baseline used by this implementation.

### Consolidated Tools Mode

**Consolidated Tools Mode** is an architecture that groups the 163 individual tools into **24 action-based meta-tools**. This significantly reduces token usage and improves AI assistant context management.

| Mode | Tools | Best For |
|------|-------|----------|
| Standard | 163 tools | Full granular control |
| Consolidated | 24 tools | Reduced token usage, better context |

To enable consolidated mode:
```bash
LANGFLOW_CONSOLIDATED_TOOLS=true
```

**Consolidated tools:**
- `flow` - All flow operations (list, get, create, update, delete, download, upload, replace, expand, batch, public)
- `flow_execution` - Run flows (run, run_advanced, run_session, webhook, process, predict)
- `flow_version` - Flow versions and lifecycle events (list, create, get, delete, activate, get_events, create_event)
- `build` - Build operations (start, status, cancel, vertices)
- `workflow` - Run and manage v2 workflows (run, get_result, stop)
- `agentic` - Agentic assistant (assist, check_config, execute)
- `folder` - Folder management (list, get, create, update, delete, download, upload)
- `project` - Project management (list, get, create, update, delete, download, upload)
- `variable` - Variable operations (list, create, update, delete, detect)
- `knowledge_base` - Knowledge base management (list, get, delete, bulk_delete, upload, create, preview/list chunks, ingest, cancel_ingest)
- `file` - Flow-scoped file operations (list, upload, download, delete, get_image)
- `file_v2` - User-scoped v2 files (list, upload, get, rename, delete, delete_all, batch_download, batch_delete)
- `monitor` - Monitoring (builds, messages, sessions, transactions)
- `trace` - Execution traces (list, get, delete, delete_by_flow)
- `model` - Models and providers (list, providers, enabled, default get/set/delete, mapping, validate, options)
- `user` - User management (list, get_current, update, reset_password, create)
- `auth` - Authentication (login, auto_login, logout, refresh, api keys, save_store_key)
- `store` - Component store (list, get, tags, likes, save_api_key, create, like, update_custom)
- `registration` - User registration (get, register)
- `validation` - Code/prompt validation (code, prompt)
- `mcp_server` - MCP server management (list, get, create, update, delete)
- `mcp_project` - MCP project config/install (get/update config, get_installed, install, composer_url)
- `response` - OpenAI-compatible responses (create)
- `system` - System info (health, version, logs, pictures, voices, session, webhook_events, health_check)

It provides structured access to:

- **Flow Management** - Create, read, update, delete, and execute Langflow flows
- **Flow Execution** - Run flows with inputs and trigger webhooks
- **Build Operations** - Compile, validate, and monitor flow builds
- **Import/Export** - Upload and download flows and projects
- **Organization** - Manage folders and projects
- **Configuration** - Manage global variables
- **Knowledge Bases** - Manage RAG document collections
- **Component Discovery** - List all available Langflow components

## Quick Start

### Prerequisites

- Node.js 20 or newer installed on your system
- A running Langflow instance
- Langflow API key

### Installation

```bash
# Install from npm
npm install -g langflow-mcp-server

# OR clone the repository
git clone https://github.com/nobrainer-tech/langflow-mcp.git
cd langflow-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Configure environment
cp .env.example .env
# Edit .env with your Langflow instance URL and API key
```

### Configuration

Edit `.env` file:

```env
LANGFLOW_BASE_URL=http://localhost:7860
LANGFLOW_API_KEY=your-api-key-here
MCP_MODE=stdio
LOG_LEVEL=info
```

### Claude Desktop Setup

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "langflow": {
      "command": "npx",
      "args": ["-y", "langflow-mcp-server"],
      "env": {
        "LANGFLOW_BASE_URL": "http://localhost:7860",
        "LANGFLOW_API_KEY": "your-api-key-here",
        "LANGFLOW_CONSOLIDATED_TOOLS": "true",
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error"
      }
    }
  }
}
```

**Alternative (local installation):**
```json
{
  "mcpServers": {
    "langflow": {
      "command": "node",
      "args": ["/absolute/path/to/langflow-mcp/dist/mcp/index.js"],
      "env": {
        "LANGFLOW_BASE_URL": "http://localhost:7860",
        "LANGFLOW_API_KEY": "your-api-key-here",
        "MCP_MODE": "stdio",
        "LOG_LEVEL": "error"
      }
    }
  }
}
```

Restart Claude Desktop after updating configuration.

### Docker Deployment

The MCP server can be run in a Docker container for easier deployment and isolation.

#### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/nobrainer-tech/langflow-mcp.git
cd langflow-mcp

# Create .env file with your configuration
cp .env.example .env
# Edit .env with your Langflow instance URL and API key

# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the server
docker-compose down
```

#### Building Docker Image

```bash
# Build the image
docker build -t langflow-mcp-server:latest .

# Run in stdio mode (for Claude Desktop)
docker run -it --rm \
  -e LANGFLOW_BASE_URL=http://localhost:7860 \
  -e LANGFLOW_API_KEY=your-api-key \
  langflow-mcp-server:latest

# Run in HTTP mode (for remote access)
docker run -d \
  -p 3000:3000 \
  -e MCP_MODE=http \
  -e PORT=3000 \
  -e AUTH_TOKEN=your-secure-token \
  -e LANGFLOW_BASE_URL=http://langflow:7860 \
  -e LANGFLOW_API_KEY=your-api-key \
  langflow-mcp-server:latest
```

#### Docker Compose Configuration

The included `docker-compose.yml` supports both stdio and HTTP modes:

```yaml
# STDIO mode (default)
environment:
  - MCP_MODE=stdio
  - LANGFLOW_BASE_URL=http://localhost:7860
  - LANGFLOW_API_KEY=your-key

# HTTP mode
environment:
  - MCP_MODE=http
  - PORT=3000
  - AUTH_TOKEN=your-secure-token
```

## Available MCP Tools

Once connected, Claude can use:
- **Standard mode**: 163 individual tools
- **Consolidated mode**: 24 action-based tools (recommended for reduced token usage)

> **Note**: Raw MCP transport endpoints (SSE/streamable, `/api/mcp/*`) and doc-rendering
> endpoints (`/docs`, `/redoc`, `/openapi.json`) are intentionally **not** exposed as
> tools — they are protocol/transport surfaces, not data operations.

### Standard Mode Tools (163 tools)

### Flow Management (13 tools)
- **`create_flow`** - Create a new Langflow flow
- **`list_flows`** - List all flows with pagination and filtering
- **`get_flow`** - Get details of a specific flow by ID
- **`update_flow`** - Update an existing flow
- **`delete_flow`** - Delete a single flow
- **`delete_flows`** - Delete multiple flows at once
- **`replace_flow`** - Replace a flow's full definition
- **`expand_flows`** - Expand flows with embedded component data
- **`upload_flow`** - Upload a flow from JSON data
- **`download_flows`** - Download multiple flows as JSON export
- **`get_basic_examples`** - Get pre-built example flows
- **`batch_create_flows`** - Create multiple flows in one operation
- **`get_public_flow`** - Get a public flow without authentication

### Flow Execution (7 tools)
- **`run_flow`** - Execute a flow with input configuration (supports streaming)
- **`run_flow_advanced`** - Advanced flow execution with full control
- **`run_flow_session`** - Execute a flow within a session context
- **`trigger_webhook`** - Trigger a flow via webhook endpoint
- **`get_webhook_events`** - Get webhook trigger events for a flow
- **`process_flow`** - Legacy process endpoint for flows
- **`predict_flow`** - Legacy predict endpoint for flows

### Flow Versions & Events (7 tools)
- **`list_flow_versions`** - List versions of a flow
- **`create_flow_version`** - Create a new flow version
- **`get_flow_version`** - Get a specific flow version
- **`delete_flow_version`** - Delete a flow version
- **`activate_flow_version`** - Activate a specific flow version
- **`get_flow_events`** - Get lifecycle events for a flow
- **`create_flow_event`** - Create a lifecycle event for a flow

### Build Operations (6 tools)
- **`build_flow`** - Build/compile a flow and return job_id for async execution
- **`get_build_status`** - Poll build status and events for a specific job
- **`cancel_build`** - Cancel a running build job
- **`get_task_status`** - Get status of an async task
- **`build_vertices`** - Get vertex build order for a flow
- **`stream_vertex_build`** - Stream real-time build events for a vertex

### Workflows (v2) (3 tools)
- **`run_workflow`** - Run a v2 workflow
- **`get_workflow_result`** - Get the result of a workflow run
- **`stop_workflow`** - Stop a running workflow

### Agentic (3 tools)
- **`agentic_assist`** - Get agentic assistance for a flow component
- **`agentic_check_config`** - Check whether agentic features are configured
- **`agentic_execute`** - Execute an agentic flow by name

### Responses (2 tools)
- **`create_response`** - Create an OpenAI-compatible response
- **`get_session`** - Get a response/conversation session

### Folder Management (7 tools)
- **`list_folders`** - List all folders with pagination
- **`create_folder`** - Create a new folder
- **`get_folder`** - Get folder details by ID
- **`update_folder`** - Update folder name, description, or parent
- **`delete_folder`** - Delete a folder
- **`download_folder`** - Download entire folder as archive
- **`upload_folder`** - Upload folder from archive

### Project Management (7 tools)
- **`list_projects`** - List all projects with pagination
- **`create_project`** - Create a new project
- **`get_project`** - Get project details by ID
- **`update_project`** - Update project name or description
- **`delete_project`** - Delete a project
- **`upload_project`** - Upload a project from JSON data
- **`download_project`** - Download a project as JSON export

### Variable Management (5 tools)
- **`list_variables`** - List all global variables
- **`create_variable`** - Create a new variable
- **`update_variable`** - Update variable properties
- **`delete_variable`** - Delete a variable
- **`detect_variables`** - Detect variables referenced in a value/template

### Knowledge Base Management (11 tools)
- **`list_knowledge_bases`** - List all available knowledge bases
- **`list_knowledge_bases_detailed`** - List knowledge bases with detailed metadata
- **`get_knowledge_base`** - Get detailed information about a specific knowledge base
- **`create_knowledge_base`** - Create a new knowledge base
- **`delete_knowledge_base`** - Delete a specific knowledge base
- **`bulk_delete_knowledge_bases`** - Delete multiple knowledge bases at once
- **`upload_knowledge_base`** - Upload a file to create/update a knowledge base
- **`preview_knowledge_base_chunks`** - Preview how a document will be chunked
- **`list_knowledge_base_chunks`** - List stored chunks for a knowledge base
- **`ingest_knowledge_base`** - Ingest documents into a knowledge base
- **`cancel_knowledge_base_ingest`** - Cancel an in-progress ingest job

### File Management (5 tools)
- **`upload_file`** - Upload a file to a specific flow
- **`download_file`** - Download a file from a flow
- **`list_files`** - List all files in a flow
- **`delete_file`** - Delete a file from a flow
- **`get_file_image`** - Get an image file from a flow

### Files (v2) (8 tools)
- **`list_files_v2`** - List all user-scoped v2 files
- **`upload_file_v2`** - Upload a v2 file
- **`get_file_v2`** - Get v2 file metadata or content
- **`rename_file_v2`** - Rename a v2 file
- **`delete_file_v2`** - Delete a v2 file
- **`delete_all_files_v2`** - Delete all v2 files
- **`batch_download_files_v2`** - Download multiple v2 files
- **`batch_delete_files_v2`** - Delete multiple v2 files

### Component Discovery & Custom Components (3 tools)
- **`list_components`** - List all available Langflow components
- **`create_custom_component`** - Create a new custom component
- **`update_custom_component`** - Update an existing custom component

### Monitoring & Analytics (12 tools)
- **`get_monitor_builds`** - Get build execution history for a flow
- **`get_monitor_messages`** - Query chat/message history with filtering
- **`get_monitor_message`** - Get details of a specific message
- **`update_monitor_message`** - Update a stored message
- **`get_monitor_sessions`** - List all chat session IDs
- **`get_monitor_session_messages`** - Get all messages for a session
- **`migrate_monitor_session`** - Migrate messages between sessions
- **`get_monitor_transactions`** - List transaction logs for a flow
- **`delete_monitor_builds`** - Delete build history for a flow
- **`delete_monitor_messages`** - Delete multiple messages by ID
- **`delete_monitor_session_messages`** - Delete all messages for a session
- **`delete_monitor_sessions`** - Delete chat sessions

### Traces (4 tools)
- **`list_traces`** - List execution traces with filters
- **`get_trace`** - Get a specific execution trace
- **`delete_trace`** - Delete a specific trace
- **`delete_traces`** - Delete all traces for a flow

### Shared Messages (5 tools)
- **`get_shared_messages`** - Get shared messages
- **`get_shared_sessions`** - Get shared sessions
- **`update_shared_message`** - Update a shared message
- **`migrate_shared_session`** - Migrate a shared session
- **`delete_shared_session`** - Delete a shared session

### Models & Providers (12 tools)
- **`list_models`** - List available models
- **`list_model_providers`** - List all model providers
- **`list_enabled_providers`** - List enabled providers
- **`list_enabled_models`** - List enabled models
- **`set_enabled_models`** - Enable/disable models
- **`get_default_model`** - Get the default model for a type
- **`set_default_model`** - Set the default model for a type
- **`delete_default_model`** - Remove the default model for a type
- **`get_provider_variable_mapping`** - Get provider-to-variable mapping
- **`validate_model_provider`** - Validate provider credentials
- **`get_language_model_options`** - Get language model options
- **`get_embedding_model_options`** - Get embedding model options

### User Management (5 tools)
- **`list_users`** - List all users (admin only)
- **`get_current_user`** - Get current authenticated user info
- **`update_user`** - Update user profile information
- **`reset_user_password`** - Reset password for a user (admin only)
- **`create_user`** - Create a new user (admin only)

### API Key Management (3 tools)
- **`list_api_keys`** - List all API keys for the user
- **`create_api_key`** - Create a new API key
- **`delete_api_key`** - Delete an API key

### Authentication (4 tools)
- **`login`** - Authenticate with username and password
- **`auto_login`** - Auto-login with stored credentials
- **`refresh_token`** - Refresh authentication token
- **`logout`** - Logout and invalidate session

### Registration (2 tools)
- **`get_registration`** - Check whether registration is enabled
- **`register_user`** - Register a new user account

### Store & Marketplace (9 tools)
- **`check_store`** - Check if component store is enabled
- **`check_store_api_key`** - Validate a store API key
- **`save_store_api_key`** - Save a store API key
- **`list_store_components`** - Browse available components in the store
- **`get_store_component`** - Get details of a store component
- **`create_store_component`** - Publish a component to the store
- **`like_store_component`** - Like a store component
- **`list_store_tags`** - List all component tags in the store
- **`get_user_likes`** - Get components liked by user

### Validation (2 tools)
- **`validate_code`** - Validate Python code for custom components
- **`validate_prompt`** - Validate prompt template syntax

### MCP Servers (v2) (5 tools)
- **`list_mcp_servers`** - List MCP servers registered with Langflow
- **`get_mcp_server`** - Get an MCP server by name
- **`create_mcp_server`** - Create an MCP server
- **`update_mcp_server`** - Update an MCP server
- **`delete_mcp_server`** - Delete an MCP server

### MCP Project Management (5 tools)
- **`get_mcp_project_config`** - Get MCP config for a project
- **`update_mcp_project_config`** - Update MCP config for a project
- **`get_mcp_project_installed`** - Get installed MCP clients for a project
- **`install_mcp_project`** - Install MCP for a project into a client
- **`get_mcp_project_composer_url`** - Get the MCP composer URL for a project

### Starter & Templates (1 tool)
- **`list_starter_projects`** - List available starter templates

### Profile & Media (2 tools)
- **`list_profile_pictures`** - List available profile pictures
- **`get_profile_picture`** - Get a specific profile picture

### Integration Tools (1 tool)
- **`list_elevenlabs_voices`** - List ElevenLabs text-to-speech voices

### System & Health (4 tools)
- **`get_version`** - Get Langflow API version information
- **`health_check`** - Check Langflow instance health status
- **`get_health_check`** - Get a detailed health-check report
- **`get_logs`** - Retrieve system logs (supports streaming)

## Example Usage

```typescript
// Create a new flow
create_flow({
  name: "My Automation Flow",
  description: "A flow that processes data"
})

// List all flows
list_flows({
  page: 1,
  size: 50
})

// Get flow details
get_flow({
  flow_id: "flow-uuid-here"
})

// Update a flow
update_flow({
  flow_id: "flow-uuid-here",
  name: "Updated Flow Name"
})

// Execute a flow
run_flow({
  flow_id_or_name: "my-flow-name",
  input_request: {
    input_value: "Hello World",
    output_type: "chat",
    input_type: "chat"
  },
  stream: false
})

// Trigger via webhook
trigger_webhook({
  flow_id_or_name: "my-flow",
  input_request: {
    input_value: "Process this data"
  }
})

// Build a flow (compile/validate)
build_flow({
  flow_id: "flow-uuid-here",
  log_builds: true,
  event_delivery: "polling"
})

// Check build status
get_build_status({
  job_id: "job-uuid-from-build",
  event_delivery: "polling"
})

// List knowledge bases (RAG)
list_knowledge_bases()

// Get knowledge base details
get_knowledge_base({
  kb_name: "my-documents"
})

// Create a folder
create_folder({
  name: "My Flows",
  description: "Organized flows"
})

// Create a project
create_project({
  name: "My Project",
  description: "Project description"
})

// Manage variables
create_variable({
  name: "API_KEY",
  value: "secret-key",
  type: "string"
})

// Get basic examples
get_basic_examples()

// List all components
list_components()
```

## Development

```bash
# Build
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck
```

## Project Structure

```
langflow-mcp/
├── src/
│   ├── mcp/
│   │   ├── index.ts       # MCP server entry point
│   │   ├── server.ts      # MCP server implementation
│   │   └── tools.ts       # Tool definitions
│   ├── services/
│   │   └── langflow-client.ts  # Langflow API client
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   └── utils/
│       └── logger.ts      # Logging utility
├── .env.example           # Example configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Attribution

This project is inspired by and follows the structure of [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) by Romuald Czlonkowski. Special thanks to the n8n-mcp project for the excellent MCP server architecture and implementation patterns.

## License

MIT License - see LICENSE for details.

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Run tests (`npm test`)
4. Submit a pull request

## Acknowledgments

- [Langflow](https://github.com/logspace-ai/langflow) team for the workflow automation platform
- [Anthropic](https://anthropic.com) for the Model Context Protocol
- [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) for the inspiration and architecture

---

Built with ❤️ for the Langflow community
