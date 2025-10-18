# langflow-mcp-server

[![npm version](https://badge.fury.io/js/langflow-mcp-server.svg)](https://www.npmjs.com/package/langflow-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/langflow-mcp-server.svg)](https://www.npmjs.com/package/langflow-mcp-server)
[![GitHub release](https://img.shields.io/github/v/release/nobrainer-tech/langflow-mcp)](https://github.com/nobrainer-tech/langflow-mcp/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server that provides AI assistants with comprehensive access to Langflow workflow automation platform. Inspired by [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp).

## Overview

langflow-mcp-server serves as a bridge between Langflow's workflow automation platform and AI models, enabling them to understand and work with Langflow flows effectively. It provides structured access to:

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

- Node.js installed on your system
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

## Available MCP Tools

Once connected, Claude can use these 35 tools:

### Flow Management (6 tools)
- **`create_flow`** - Create a new Langflow flow
- **`list_flows`** - List all flows with pagination and filtering
- **`get_flow`** - Get details of a specific flow by ID
- **`update_flow`** - Update an existing flow
- **`delete_flow`** - Delete a single flow
- **`delete_flows`** - Delete multiple flows at once

### Flow Execution (2 tools)
- **`run_flow`** - Execute a flow with input configuration (supports streaming)
- **`trigger_webhook`** - Trigger a flow via webhook endpoint

### Import/Export (3 tools)
- **`upload_flow`** - Upload a flow from JSON data
- **`download_flows`** - Download multiple flows as JSON export
- **`get_basic_examples`** - Get pre-built example flows

### Folder Management (5 tools)
- **`list_folders`** - List all folders with pagination
- **`create_folder`** - Create a new folder
- **`get_folder`** - Get folder details by ID
- **`update_folder`** - Update folder name, description, or parent
- **`delete_folder`** - Delete a folder

### Project Management (7 tools)
- **`list_projects`** - List all projects with pagination
- **`create_project`** - Create a new project
- **`get_project`** - Get project details by ID
- **`update_project`** - Update project name or description
- **`delete_project`** - Delete a project
- **`upload_project`** - Upload a project from JSON data
- **`download_project`** - Download a project as JSON export

### Variable Management (4 tools)
- **`list_variables`** - List all global variables
- **`create_variable`** - Create a new variable
- **`update_variable`** - Update variable properties
- **`delete_variable`** - Delete a variable

### Build Operations (3 tools)
- **`build_flow`** - Build/compile a flow and return job_id for async execution
- **`get_build_status`** - Poll build status and events for a specific job
- **`cancel_build`** - Cancel a running build job

### Knowledge Base Management (4 tools)
- **`list_knowledge_bases`** - List all available knowledge bases
- **`get_knowledge_base`** - Get detailed information about a specific knowledge base
- **`delete_knowledge_base`** - Delete a specific knowledge base
- **`bulk_delete_knowledge_bases`** - Delete multiple knowledge bases at once

### Component Discovery (1 tool)
- **`list_components`** - List all available Langflow components

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
