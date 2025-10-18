# langflow-mcp

A Model Context Protocol (MCP) server that provides AI assistants with comprehensive access to Langflow workflow automation platform. Inspired by [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp).

## Overview

langflow-mcp serves as a bridge between Langflow's workflow automation platform and AI models, enabling them to understand and work with Langflow flows effectively. It provides structured access to:

- **Flow Management** - Create, read, update, and delete Langflow flows
- **Component Discovery** - List all available Langflow components
- **Workflow Automation** - Integrate Langflow with AI assistants like Claude

## Quick Start

### Prerequisites

- Node.js installed on your system
- A running Langflow instance
- Langflow API key

### Installation

```bash
# Clone the repository
git clone https://github.com/aras88/langflow-mcp.git
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
    "langflow-mcp": {
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

Once connected, Claude can use these tools:

### Flow Management
- **`create_flow`** - Create a new Langflow flow
- **`list_flows`** - List all flows with pagination and filtering
- **`get_flow`** - Get details of a specific flow by ID
- **`update_flow`** - Update an existing flow
- **`delete_flow`** - Delete a single flow
- **`delete_flows`** - Delete multiple flows at once

### Component Discovery
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
