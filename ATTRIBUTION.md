# Attribution

## Inspiration and Architecture

This project is heavily inspired by and follows the architecture of [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) created by **Romuald Czlonkowski** (@czlonkowski).

### What We Borrowed

The langflow-mcp project uses the same architectural patterns and structure as n8n-mcp:

- **MCP Server Architecture** - The core server structure using `@modelcontextprotocol/sdk`
- **Tool Definition Pattern** - How MCP tools are defined and registered
- **TypeScript Configuration** - The tsconfig.json setup and build process
- **Project Structure** - Directory organization (src/mcp, src/services, src/types, src/utils)
- **Error Handling** - Patterns for handling errors in MCP tools
- **Logging System** - The logger utility structure
- **Claude Agent System** - The .claude/agents directory and agent definitions

### Acknowledgments

Special thanks to:

- **Romuald Czlonkowski** (@czlonkowski) for creating the excellent n8n-mcp project that served as the blueprint for this implementation
- The [n8n-mcp project](https://github.com/czlonkowski/n8n-mcp) for demonstrating best practices in building production-ready MCP servers
- [Anthropic](https://anthropic.com) for creating the Model Context Protocol
- The [Langflow](https://github.com/logspace-ai/langflow) team for the workflow automation platform

## License

Like n8n-mcp, this project is released under the MIT License, allowing anyone to use, modify, and distribute the code while maintaining attribution to the original inspiration.

## Differences from n8n-mcp

While langflow-mcp follows the n8n-mcp architecture, it is specifically adapted for Langflow:

- **API Client** - Uses Langflow's REST API instead of n8n's API
- **Tool Definitions** - Implements Langflow-specific tools (flows and components)
- **No Database Layer** - Unlike n8n-mcp which has a SQLite database for node documentation, langflow-mcp directly uses the Langflow API
- **Simplified Structure** - Removed n8n-specific components like node validators, template services, and workflow validators

## Contributing

If you'd like to contribute to this project, please also consider contributing to the original [n8n-mcp](https://github.com/czlonkowski/n8n-mcp) project that made this possible.

---

**Built with appreciation for the open source community**
