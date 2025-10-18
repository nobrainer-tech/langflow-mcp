# Langflow MCP Server

Production-ready MCP server for programmatically managing Langflow flows through Claude Desktop.

## Features

- **Create flows** - Create new flows with custom names and descriptions
- **List flows** - View all flows with filtering options
- **Get flow** - Retrieve detailed flow information
- **Update flow** - Modify existing flows (name, description, components, MCP settings)
- **Delete flow** - Remove flows by ID
- **List components** - View available Langflow components

## Architecture

Built following SOLID principles with clear separation of concerns:

- `LangflowConfig` - Immutable configuration from environment
- `LangflowApiClient` - HTTP communication layer
- `FlowManager` - Flow operations business logic
- `ComponentManager` - Component operations
- `LangflowMcpServer` - MCP protocol implementation

## Installation

### Prerequisites

```bash
pip install mcp httpx python-dotenv
```

### Configuration

1. Copy environment template:
```bash
cp .env.template .env
```

2. Edit `.env`:
```bash
LANGFLOW_BASE_URL=https://your-instance.wykr.es
LANGFLOW_API_KEY=your-api-key-here
```

Generate API key at: `https://your-instance/settings/api-keys`

### Claude Desktop Setup

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "langflow": {
      "command": "python3",
      "args": ["/absolute/path/to/langflow_mcp_server.py"],
      "env": {
        "LANGFLOW_API_KEY": "your-api-key",
        "LANGFLOW_BASE_URL": "https://your-instance.wykr.es"
      }
    }
  }
}
```

Restart Claude Desktop:
```bash
pkill -9 "Claude" && open -a Claude
```

## Usage Examples

### Create Flow
```
Create a new flow called "Customer Support Bot" for handling customer inquiries
```

### List Flows
```
Show me all my flows
```

### Update Flow
```
Enable MCP for the flow "Data Analyzer"
```

### Get Flow Details
```
Show details for flow ID abc-123-def
```

### Delete Flow
```
Delete flow abc-123-def
```

### List Components
```
What components are available in Langflow?
```

## Development

### Code Quality

This codebase follows:
- **SOLID** principles
- **DRY** (Don't Repeat Yourself)
- **KISS** (Keep It Simple)
- **Clean Code** practices
- Type hints throughout
- Comprehensive docstrings
- Separation of concerns
- Dependency injection

### Project Structure

```
langflow-mcp/
├── langflow_mcp_server.py  # Main server (production-ready)
├── .env.template            # Environment template
├── .env                     # Your config (gitignored)
├── .gitignore              # Git ignore rules
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

### Security

- API keys stored in environment variables
- `.env` file excluded from git
- Use `.env.template` for sharing configuration structure
- Immutable configuration objects

## API Reference

Based on Langflow OpenAPI specification (v1.6.4).

### Endpoints Used

- `POST /api/v1/flows/` - Create flow
- `GET /api/v1/flows/` - List flows
- `GET /api/v1/flows/{flow_id}` - Get flow
- `PATCH /api/v1/flows/{flow_id}` - Update flow
- `DELETE /api/v1/flows/{flow_id}` - Delete flow
- `GET /api/v1/all` - List components

## Troubleshooting

### Configuration Error
```
Configuration error: LANGFLOW_API_KEY environment variable is required
```
**Solution**: Set `LANGFLOW_API_KEY` in `.env` file

### Import Error
```
ModuleNotFoundError: No module named 'mcp'
```
**Solution**: `pip install mcp httpx python-dotenv`

### HTTP 401 Unauthorized
**Solution**: Generate new API key at `https://your-instance/settings/api-keys`

### Server Not Appearing in Claude Desktop
**Solution**:
1. Verify JSON syntax in config file
2. Use absolute path to `langflow_mcp_server.py`
3. Restart Claude Desktop

## License

MIT

## Contributing

Production-ready code only. Follow existing patterns:
- Type hints required
- Docstrings for all public methods
- SOLID principles
- No magic numbers
- Clear naming conventions
