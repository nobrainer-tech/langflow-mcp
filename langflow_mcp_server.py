#!/usr/bin/env python3
"""
Langflow MCP Server - Production-ready server for managing Langflow flows.

This MCP server provides tools to create, read, update, and delete flows
in Langflow through the Model Context Protocol.
"""

import os
import sys
import asyncio
from typing import Any, Optional
from dataclasses import dataclass
from enum import Enum

import httpx
from dotenv import load_dotenv

try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
    import mcp.server.stdio
except ImportError:
    print(
        "ERROR: Required packages not installed. "
        "Run: pip install mcp httpx python-dotenv",
        file=sys.stderr
    )
    sys.exit(1)


class HttpMethod(Enum):
    """HTTP methods for API requests."""
    GET = "GET"
    POST = "POST"
    PATCH = "PATCH"
    DELETE = "DELETE"


@dataclass(frozen=True)
class LangflowConfig:
    """Configuration for Langflow API connection.

    Attributes:
        base_url: Base URL of Langflow instance
        api_key: API key for authentication
    """
    base_url: str
    api_key: str

    @classmethod
    def from_env(cls) -> 'LangflowConfig':
        """Create config from environment variables.

        Returns:
            LangflowConfig instance

        Raises:
            ValueError: If required environment variables are missing
        """
        load_dotenv()

        base_url = os.getenv("LANGFLOW_BASE_URL")
        api_key = os.getenv("LANGFLOW_API_KEY")

        if not base_url:
            raise ValueError(
                "LANGFLOW_BASE_URL environment variable is required"
            )
        if not api_key:
            raise ValueError(
                "LANGFLOW_API_KEY environment variable is required"
            )

        return cls(base_url=base_url, api_key=api_key)


class LangflowApiClient:
    """Client for interacting with Langflow API.

    Handles all HTTP communication with Langflow instance.
    """

    def __init__(self, config: LangflowConfig):
        """Initialize API client.

        Args:
            config: Langflow configuration
        """
        self._config = config
        self._timeout = 30.0

    async def request(
        self,
        method: HttpMethod,
        endpoint: str,
        data: Optional[dict] = None,
        params: Optional[dict] = None
    ) -> dict:
        """Make HTTP request to Langflow API.

        Args:
            method: HTTP method
            endpoint: API endpoint (e.g., "/api/v1/flows/")
            data: Request body data
            params: URL query parameters

        Returns:
            Response data as dict

        Raises:
            httpx.HTTPStatusError: On HTTP errors
        """
        url = f"{self._config.base_url}{endpoint}"
        headers = {
            "x-api-key": self._config.api_key,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                if method == HttpMethod.GET:
                    response = await client.get(
                        url,
                        headers=headers,
                        params=params or {},
                        timeout=self._timeout
                    )
                elif method == HttpMethod.POST:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=data,
                        timeout=self._timeout
                    )
                elif method == HttpMethod.PATCH:
                    response = await client.patch(
                        url,
                        headers=headers,
                        json=data,
                        timeout=self._timeout
                    )
                elif method == HttpMethod.DELETE:
                    response = await client.delete(
                        url,
                        headers=headers,
                        timeout=self._timeout
                    )
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")

                response.raise_for_status()
                return response.json() if response.text else {
                    "status": "success"
                }

            except httpx.HTTPStatusError as e:
                error_msg = (
                    f"HTTP {e.response.status_code}: {e.response.text}"
                )
                return {
                    "error": error_msg,
                    "status_code": e.response.status_code
                }
            except httpx.RequestError as e:
                return {"error": f"Request failed: {str(e)}"}


class FlowManager:
    """Manager for Flow operations."""

    def __init__(self, api_client: LangflowApiClient, config: LangflowConfig):
        """Initialize flow manager.

        Args:
            api_client: Langflow API client
            config: Langflow configuration
        """
        self._api = api_client
        self._config = config

    async def create(
        self,
        name: str,
        description: str = "",
        folder_id: Optional[str] = None,
        data: Optional[dict] = None
    ) -> dict:
        """Create new flow.

        Args:
            name: Flow name
            description: Flow description
            folder_id: Optional folder ID
            data: Optional flow data structure

        Returns:
            Created flow data
        """
        payload = {
            "name": name,
            "description": description,
            "data": data or {},
        }
        if folder_id:
            payload["folder_id"] = folder_id

        return await self._api.request(
            HttpMethod.POST,
            "/api/v1/flows/",
            data=payload
        )

    async def list_all(
        self,
        folder_id: Optional[str] = None,
        limit: int = 50
    ) -> dict:
        """List all flows.

        Args:
            folder_id: Optional folder filter
            limit: Maximum number of results

        Returns:
            List of flows
        """
        params = {}
        if folder_id:
            params["folder_id"] = folder_id

        return await self._api.request(
            HttpMethod.GET,
            "/api/v1/flows/",
            params=params
        )

    async def get(self, flow_id: str) -> dict:
        """Get flow by ID.

        Args:
            flow_id: Flow ID

        Returns:
            Flow data
        """
        return await self._api.request(
            HttpMethod.GET,
            f"/api/v1/flows/{flow_id}"
        )

    async def update(self, flow_id: str, **kwargs) -> dict:
        """Update flow.

        Args:
            flow_id: Flow ID
            **kwargs: Fields to update

        Returns:
            Updated flow data
        """
        update_data = {k: v for k, v in kwargs.items() if v is not None}

        return await self._api.request(
            HttpMethod.PATCH,
            f"/api/v1/flows/{flow_id}",
            data=update_data
        )

    async def delete(self, flow_id: str) -> dict:
        """Delete flow.

        Args:
            flow_id: Flow ID

        Returns:
            Deletion result
        """
        return await self._api.request(
            HttpMethod.DELETE,
            f"/api/v1/flows/{flow_id}"
        )

    def build_flow_url(self, flow_id: str) -> str:
        """Build URL to flow in Langflow UI.

        Args:
            flow_id: Flow ID

        Returns:
            Full URL to flow
        """
        return f"{self._config.base_url}/flow/{flow_id}"


class ComponentManager:
    """Manager for Component operations."""

    def __init__(self, api_client: LangflowApiClient):
        """Initialize component manager.

        Args:
            api_client: Langflow API client
        """
        self._api = api_client

    async def list_all(self) -> dict:
        """Get list of available components.

        Returns:
            Dictionary of components by category
        """
        return await self._api.request(HttpMethod.GET, "/api/v1/all")


class LangflowMcpServer:
    """MCP Server for Langflow management."""

    def __init__(
        self,
        flow_manager: FlowManager,
        component_manager: ComponentManager
    ):
        """Initialize MCP server.

        Args:
            flow_manager: Flow manager instance
            component_manager: Component manager instance
        """
        self._flow_mgr = flow_manager
        self._component_mgr = component_manager
        self._server = Server("langflow-manager")
        self._register_handlers()

    def _register_handlers(self) -> None:
        """Register MCP handlers."""
        self._server.list_tools()(self._list_tools)
        self._server.call_tool()(self._call_tool)

    async def _list_tools(self) -> list[Tool]:
        """List available MCP tools."""
        return [
            Tool(
                name="create_flow",
                description=(
                    "Creates a new flow in Langflow. "
                    "Returns the flow_id of the created flow."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "Flow name (required)"
                        },
                        "description": {
                            "type": "string",
                            "description": "Flow description (optional)"
                        },
                        "folder_id": {
                            "type": "string",
                            "description": (
                                "Folder ID where to place flow (optional)"
                            )
                        },
                        "data": {
                            "type": "object",
                            "description": (
                                "Flow data structure with nodes and edges "
                                "(optional)"
                            )
                        }
                    },
                    "required": ["name"]
                }
            ),
            Tool(
                name="list_flows",
                description=(
                    "Retrieves list of all flows. "
                    "Returns flows with IDs, names, and descriptions."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "folder_id": {
                            "type": "string",
                            "description": "Filter by folder ID (optional)"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum results (default: 50)"
                        }
                    }
                }
            ),
            Tool(
                name="get_flow",
                description=(
                    "Retrieves detailed information about a specific flow. "
                    "Returns complete flow structure."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "Flow ID (required)"
                        }
                    },
                    "required": ["flow_id"]
                }
            ),
            Tool(
                name="update_flow",
                description=(
                    "Updates an existing flow. "
                    "Can modify name, description, data, etc."
                ),
                inputSchema={
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "Flow ID to update (required)"
                        },
                        "name": {
                            "type": "string",
                            "description": "New flow name (optional)"
                        },
                        "description": {
                            "type": "string",
                            "description": "New flow description (optional)"
                        },
                        "data": {
                            "type": "object",
                            "description": (
                                "New flow data structure (optional)"
                            )
                        },
                        "mcp_enabled": {
                            "type": "boolean",
                            "description": (
                                "Enable flow as MCP tool (optional)"
                            )
                        }
                    },
                    "required": ["flow_id"]
                }
            ),
            Tool(
                name="delete_flow",
                description="Deletes a flow by ID",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "Flow ID to delete (required)"
                        }
                    },
                    "required": ["flow_id"]
                }
            ),
            Tool(
                name="list_components",
                description=(
                    "Lists all available components that can be added to "
                    "flows (e.g., ChatInput, ChatOutput, OpenAI, etc.)"
                ),
                inputSchema={
                    "type": "object",
                    "properties": {}
                }
            )
        ]

    async def _call_tool(
        self,
        name: str,
        arguments: Any
    ) -> list[TextContent]:
        """Handle tool calls."""

        if name == "create_flow":
            return await self._handle_create_flow(arguments)
        elif name == "list_flows":
            return await self._handle_list_flows(arguments)
        elif name == "get_flow":
            return await self._handle_get_flow(arguments)
        elif name == "update_flow":
            return await self._handle_update_flow(arguments)
        elif name == "delete_flow":
            return await self._handle_delete_flow(arguments)
        elif name == "list_components":
            return await self._handle_list_components(arguments)
        else:
            return [TextContent(
                type="text",
                text=f"Unknown tool: {name}"
            )]

    async def _handle_create_flow(
        self,
        arguments: dict
    ) -> list[TextContent]:
        """Handle create_flow tool call."""
        result = await self._flow_mgr.create(
            name=arguments["name"],
            description=arguments.get("description", ""),
            folder_id=arguments.get("folder_id"),
            data=arguments.get("data")
        )

        if "error" in result:
            return [TextContent(
                type="text",
                text=f"Error: {result['error']}"
            )]

        flow_id = result.get("id", "unknown")
        flow_url = self._flow_mgr.build_flow_url(flow_id)

        return [TextContent(
            type="text",
            text=(
                f"Flow created successfully!\n\n"
                f"ID: {flow_id}\n"
                f"Name: {result.get('name')}\n"
                f"URL: {flow_url}"
            )
        )]

    async def _handle_list_flows(
        self,
        arguments: dict
    ) -> list[TextContent]:
        """Handle list_flows tool call."""
        result = await self._flow_mgr.list_all(
            folder_id=arguments.get("folder_id"),
            limit=arguments.get("limit", 50)
        )

        if "error" in result:
            return [TextContent(
                type="text",
                text=f"Error: {result['error']}"
            )]

        flows = result if isinstance(result, list) else result.get("flows", [])

        if not flows:
            return [TextContent(type="text", text="No flows found.")]

        limit = arguments.get("limit", 50)
        flows = flows[:limit]

        output = "Flows:\n\n"
        for flow in flows:
            output += f"• {flow.get('name', 'Unnamed')}\n"
            output += f"  ID: {flow.get('id')}\n"
            if flow.get('description'):
                output += f"  Description: {flow.get('description')}\n"
            mcp_status = "Yes" if flow.get('mcp_enabled') else "No"
            output += f"  MCP Enabled: {mcp_status}\n\n"

        return [TextContent(type="text", text=output)]

    async def _handle_get_flow(
        self,
        arguments: dict
    ) -> list[TextContent]:
        """Handle get_flow tool call."""
        flow_id = arguments["flow_id"]
        result = await self._flow_mgr.get(flow_id)

        if "error" in result:
            return [TextContent(
                type="text",
                text=f"Error: {result['error']}"
            )]

        data = result.get('data', {})
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])
        mcp_status = "Yes" if result.get('mcp_enabled') else "No"

        output = (
            f"Flow Details:\n\n"
            f"Name: {result.get('name')}\n"
            f"ID: {result.get('id')}\n"
            f"Description: {result.get('description', 'None')}\n"
            f"MCP Enabled: {mcp_status}\n"
            f"Updated: {result.get('updated_at')}\n"
            f"Components: {len(nodes)}\n"
            f"Connections: {len(edges)}\n"
            f"URL: {self._flow_mgr.build_flow_url(result.get('id'))}"
        )

        return [TextContent(type="text", text=output)]

    async def _handle_update_flow(
        self,
        arguments: dict
    ) -> list[TextContent]:
        """Handle update_flow tool call."""
        flow_id = arguments.pop("flow_id")
        result = await self._flow_mgr.update(flow_id, **arguments)

        if "error" in result:
            return [TextContent(
                type="text",
                text=f"Error: {result['error']}"
            )]

        flow_url = self._flow_mgr.build_flow_url(flow_id)
        return [TextContent(
            type="text",
            text=(
                f"Flow updated successfully!\n\n"
                f"ID: {flow_id}\n"
                f"URL: {flow_url}"
            )
        )]

    async def _handle_delete_flow(
        self,
        arguments: dict
    ) -> list[TextContent]:
        """Handle delete_flow tool call."""
        flow_id = arguments["flow_id"]
        result = await self._flow_mgr.delete(flow_id)

        if "error" in result:
            return [TextContent(
                type="text",
                text=f"Error: {result['error']}"
            )]

        return [TextContent(
            type="text",
            text=f"Flow {flow_id} deleted successfully."
        )]

    async def _handle_list_components(
        self,
        arguments: dict
    ) -> list[TextContent]:
        """Handle list_components tool call."""
        result = await self._component_mgr.list_all()

        if "error" in result:
            return [TextContent(
                type="text",
                text=f"Error: {result['error']}"
            )]

        output = "Available Langflow Components:\n\n"

        for category, components in result.items():
            if isinstance(components, dict):
                output += f"### {category}\n"
                for comp_name in components.keys():
                    output += f"  • {comp_name}\n"
                output += "\n"

        return [TextContent(type="text", text=output)]

    async def run(self) -> None:
        """Run the MCP server."""
        async with mcp.server.stdio.stdio_server() as (read, write):
            await self._server.run(
                read,
                write,
                self._server.create_initialization_options()
            )


async def main() -> None:
    """Application entry point."""
    try:
        config = LangflowConfig.from_env()
        api_client = LangflowApiClient(config)
        flow_manager = FlowManager(api_client, config)
        component_manager = ComponentManager(api_client)

        server = LangflowMcpServer(flow_manager, component_manager)
        await server.run()

    except ValueError as e:
        print(f"Configuration error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
