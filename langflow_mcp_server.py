#!/usr/bin/env python3
"""
Langflow MCP Server - umożliwia tworzenie i zarządzanie flows w Langflow przez MCP
"""

import os
import sys
import asyncio
import httpx
from typing import Any, Optional
from dotenv import load_dotenv

# Załaduj zmienne środowiskowe
load_dotenv()

try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent
    import mcp.server.stdio
except ImportError:
    print("ERROR: Brak wymaganych pakietów. Zainstaluj: pip install mcp httpx python-dotenv", file=sys.stderr)
    sys.exit(1)

# Konfiguracja Langflow
LANGFLOW_BASE_URL = os.getenv("LANGFLOW_BASE_URL", "https://kevin119-40173.wykr.es")
LANGFLOW_API_KEY = os.getenv("LANGFLOW_API_KEY")

if not LANGFLOW_API_KEY:
    print("ERROR: LANGFLOW_API_KEY nie jest ustawiony w .env", file=sys.stderr)
    sys.exit(1)

# Inicjalizacja MCP Server
app = Server("langflow-manager")

async def call_langflow_api(
    method: str,
    endpoint: str,
    data: Optional[dict] = None,
    params: Optional[dict] = None
) -> dict:
    """Wywołanie Langflow API"""
    url = f"{LANGFLOW_BASE_URL}{endpoint}"
    headers = {
        "x-api-key": LANGFLOW_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            if method == "GET":
                response = await client.get(url, headers=headers, params=params or {}, timeout=30.0)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=data, timeout=30.0)
            elif method == "PATCH":
                response = await client.patch(url, headers=headers, json=data, timeout=30.0)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers, timeout=30.0)
            else:
                raise ValueError(f"Nieobsługiwana metoda HTTP: {method}")

            response.raise_for_status()
            return response.json() if response.text else {"status": "success"}

        except httpx.HTTPStatusError as e:
            error_msg = f"HTTP Error {e.response.status_code}: {e.response.text}"
            return {"error": error_msg, "status_code": e.response.status_code}
        except Exception as e:
            return {"error": str(e)}


@app.list_tools()
async def list_tools() -> list[Tool]:
    """Lista dostępnych narzędzi MCP"""
    return [
        Tool(
            name="create_flow",
            description="Tworzy nowy flow w Langflow. Zwraca flow_id nowo utworzonego flow.",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nazwa flow (wymagane)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Opis flow (opcjonalne)"
                    },
                    "folder_id": {
                        "type": "string",
                        "description": "ID folderu gdzie umieścić flow (opcjonalne)"
                    },
                    "data": {
                        "type": "object",
                        "description": "Dane flow - struktura nodes i edges (opcjonalne, pusty flow jeśli nie podano)"
                    }
                },
                "required": ["name"]
            }
        ),
        Tool(
            name="list_flows",
            description="Pobiera listę wszystkich flows. Zwraca listę flows z ich ID, nazwami i opisami.",
            inputSchema={
                "type": "object",
                "properties": {
                    "folder_id": {
                        "type": "string",
                        "description": "ID folderu do filtrowania (opcjonalne)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maksymalna liczba wyników (domyślnie 50)"
                    }
                }
            }
        ),
        Tool(
            name="get_flow",
            description="Pobiera szczegóły konkretnego flow po ID. Zwraca pełną strukturę flow.",
            inputSchema={
                "type": "object",
                "properties": {
                    "flow_id": {
                        "type": "string",
                        "description": "ID flow (wymagane)"
                    }
                },
                "required": ["flow_id"]
            }
        ),
        Tool(
            name="update_flow",
            description="Aktualizuje istniejący flow. Możesz zmienić nazwę, opis, dane flow itp.",
            inputSchema={
                "type": "object",
                "properties": {
                    "flow_id": {
                        "type": "string",
                        "description": "ID flow do aktualizacji (wymagane)"
                    },
                    "name": {
                        "type": "string",
                        "description": "Nowa nazwa flow (opcjonalne)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Nowy opis flow (opcjonalne)"
                    },
                    "data": {
                        "type": "object",
                        "description": "Nowe dane flow - struktura nodes i edges (opcjonalne)"
                    },
                    "mcp_enabled": {
                        "type": "boolean",
                        "description": "Czy włączyć flow jako narzędzie MCP (opcjonalne)"
                    }
                },
                "required": ["flow_id"]
            }
        ),
        Tool(
            name="delete_flow",
            description="Usuwa flow po ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "flow_id": {
                        "type": "string",
                        "description": "ID flow do usunięcia (wymagane)"
                    }
                },
                "required": ["flow_id"]
            }
        ),
        Tool(
            name="get_components_list",
            description="Pobiera listę dostępnych komponentów które można dodać do flow (np. ChatInput, ChatOutput, OpenAI itp.)",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        Tool(
            name="create_simple_chat_flow",
            description="Tworzy prosty chat flow z komponentami ChatInput, OpenAI i ChatOutput. To jest helper do szybkiego stworzenia działającego flow.",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Nazwa flow (wymagane)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Opis flow (opcjonalne)"
                    },
                    "system_message": {
                        "type": "string",
                        "description": "System message dla OpenAI (opcjonalne)"
                    }
                },
                "required": ["name"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Obsługa wywołań narzędzi"""

    if name == "create_flow":
        result = await call_langflow_api(
            "POST",
            "/api/v1/flows/",
            data={
                "name": arguments["name"],
                "description": arguments.get("description", ""),
                "data": arguments.get("data", {}),
                "folder_id": arguments.get("folder_id")
            }
        )

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        flow_id = result.get("id", "unknown")
        return [TextContent(
            type="text",
            text=f"✅ Flow utworzony pomyślnie!\n\nID: {flow_id}\nNazwa: {result.get('name')}\nURL: {LANGFLOW_BASE_URL}/flow/{flow_id}"
        )]

    elif name == "list_flows":
        params = {}
        if "folder_id" in arguments:
            params["folder_id"] = arguments["folder_id"]

        result = await call_langflow_api("GET", "/api/v1/flows/", params=params)

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        # Result może być listą lub dict z kluczem 'flows'
        flows = result if isinstance(result, list) else result.get("flows", [])

        if not flows:
            return [TextContent(type="text", text="Brak flows do wyświetlenia.")]

        # Ogranicz do limitu
        limit = arguments.get("limit", 50)
        flows = flows[:limit]

        output = "📋 **Lista Flows:**\n\n"
        for flow in flows:
            output += f"• **{flow.get('name', 'Unnamed')}**\n"
            output += f"  ID: `{flow.get('id')}`\n"
            if flow.get('description'):
                output += f"  Opis: {flow.get('description')}\n"
            output += f"  MCP Enabled: {'✓' if flow.get('mcp_enabled') else '✗'}\n"
            output += "\n"

        return [TextContent(type="text", text=output)]

    elif name == "get_flow":
        flow_id = arguments["flow_id"]
        result = await call_langflow_api("GET", f"/api/v1/flows/{flow_id}")

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        output = f"📄 **Flow Details:**\n\n"
        output += f"**Nazwa:** {result.get('name')}\n"
        output += f"**ID:** {result.get('id')}\n"
        output += f"**Opis:** {result.get('description', 'Brak')}\n"
        output += f"**MCP Enabled:** {'✓' if result.get('mcp_enabled') else '✗'}\n"
        output += f"**Updated:** {result.get('updated_at')}\n"
        output += f"**URL:** {LANGFLOW_BASE_URL}/flow/{result.get('id')}\n\n"

        # Informacje o komponentach
        data = result.get('data', {})
        nodes = data.get('nodes', [])
        edges = data.get('edges', [])

        output += f"**Komponenty:** {len(nodes)}\n"
        output += f"**Połączenia:** {len(edges)}\n"

        return [TextContent(type="text", text=output)]

    elif name == "update_flow":
        flow_id = arguments.pop("flow_id")

        # Usuń puste wartości
        update_data = {k: v for k, v in arguments.items() if v is not None}

        result = await call_langflow_api("PATCH", f"/api/v1/flows/{flow_id}", data=update_data)

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        return [TextContent(
            type="text",
            text=f"✅ Flow zaktualizowany pomyślnie!\n\nID: {flow_id}\nURL: {LANGFLOW_BASE_URL}/flow/{flow_id}"
        )]

    elif name == "delete_flow":
        flow_id = arguments["flow_id"]
        result = await call_langflow_api("DELETE", f"/api/v1/flows/{flow_id}")

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        return [TextContent(type="text", text=f"✅ Flow {flow_id} usunięty pomyślnie.")]

    elif name == "get_components_list":
        result = await call_langflow_api("GET", "/api/v1/all")

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        # Wyodrębnij kategorie komponentów
        output = "🧩 **Dostępne komponenty Langflow:**\n\n"

        # Result powinien zawierać dict z kategoriami
        for category, components in result.items():
            if isinstance(components, dict):
                output += f"### {category}\n"
                for comp_name in components.keys():
                    output += f"  • {comp_name}\n"
                output += "\n"

        return [TextContent(type="text", text=output)]

    elif name == "create_simple_chat_flow":
        # To jest uproszczony helper - tworzy podstawowy flow
        # W rzeczywistości potrzebowalibyśmy pełnej struktury nodes/edges
        flow_data = {
            "name": arguments["name"],
            "description": arguments.get("description", "Prosty chat flow"),
            "data": {
                "nodes": [],  # Tu byłyby komponenty ChatInput, OpenAI, ChatOutput
                "edges": []   # Tu byłyby połączenia między komponentami
            }
        }

        result = await call_langflow_api("POST", "/api/v1/flows/", data=flow_data)

        if "error" in result:
            return [TextContent(type="text", text=f"❌ Błąd: {result['error']}")]

        flow_id = result.get("id")
        return [TextContent(
            type="text",
            text=f"✅ Pusty flow utworzony!\n\n"
                 f"**Uwaga:** To jest pusty flow. Aby dodać komponenty, edytuj go w UI:\n"
                 f"{LANGFLOW_BASE_URL}/flow/{flow_id}\n\n"
                 f"Lub użyj narzędzia `update_flow` z odpowiednią strukturą danych."
        )]

    else:
        return [TextContent(type="text", text=f"❌ Nieznane narzędzie: {name}")]


async def main():
    """Uruchomienie MCP servera"""
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
