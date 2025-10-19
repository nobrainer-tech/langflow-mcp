import { ToolDefinition } from '../types';

export const langflowMCPTools: ToolDefinition[] = [
  {
    name: 'create_flow',
    description: `Create a new Langflow workflow with optional configuration and organization.

Purpose: Initialize a new flow in your Langflow instance. Use this to create workflows from scratch or with predefined structure. The flow can be organized into folders and configured with initial data including nodes, edges, and component settings.

Parameters:
- name (required, string, max: 255 chars): The display name of the flow (must be unique within folder)
- description (optional, string): Brief explanation of flow's purpose and functionality
- data (optional, object): Initial flow configuration containing nodes, edges, and component definitions
- folder_id (optional, UUID string): ID of parent folder for organization (use list_folders to get valid IDs)

Returns: FlowRead object containing:
- id (UUID): Newly created flow's unique identifier (save this for future operations)
- name (string): Flow display name
- description (string): Flow description
- folder_id (UUID): Parent folder if specified
- user_id (UUID): Owner user identifier
- created_at, updated_at (ISO timestamps): Creation and modification timestamps
- data (object): Complete flow structure with nodes and edges

Usage Examples:
1. Create minimal flow: { name: "My Workflow" }
2. Flow with description: { name: "Data Pipeline", description: "Processes user data" }
3. Flow in folder: { name: "API Flow", folder_id: "folder-uuid-here" }
4. Flow with structure: { name: "Chat Bot", data: { nodes: [...], edges: [...] } }

Best Practices:
- Use descriptive names that indicate flow purpose (e.g., "Customer Onboarding" not "Flow1")
- Add descriptions to document flow functionality for team collaboration
- Organize related flows using folder_id for better project management
- Start with minimal configuration, then use update_flow to add complexity
- Validate data structure before passing complex flow configurations

Common Errors:
- "Flow name already exists": Choose a unique name or specify different folder_id
- "Invalid folder ID": Ensure folder_id is valid UUID from list_folders
- "Name is required": Must provide name parameter
- "Data validation failed": Check that data object follows Langflow schema structure
- "Unauthorized": Verify LANGFLOW_API_KEY is valid

Related Tools:
- list_flows: View all created flows
- update_flow: Modify flow after creation
- get_flow: Retrieve full flow details by ID
- upload_flow: Import flow from JSON file instead of creating from scratch
- create_folder: Create folders before organizing flows`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the flow'
        },
        description: {
          type: 'string',
          description: 'Optional description of the flow'
        },
        data: {
          type: 'object',
          description: 'Optional flow data/configuration'
        },
        folder_id: {
          type: 'string',
          description: 'Optional folder ID to organize the flow'
        }
      },
      required: ['name']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'list_flows',
    description: `List Langflow flows with flexible filtering and pagination.

Purpose: Retrieve flows from your Langflow instance with optional pagination and organization filters. Essential for discovering available workflows, managing large flow collections, and browsing flows within specific folders.

Parameters:
- page (optional, number, default: 1, min: 1): Page number for pagination
- size (optional, number, default: 50, max: 100): Number of flows per page
- folder_id (optional, UUID string): Filter flows within a specific folder
- components_only (optional, boolean, default: false): Return only component flows (reusable flow components)
- get_all (optional, boolean, default: true): Retrieve all flows ignoring pagination (use with caution for large datasets)

Returns: Array of FlowRead objects containing:
- id (UUID): Unique flow identifier
- name (string): Flow display name
- description (string): Flow purpose description
- folder_id (UUID): Parent folder if organized
- user_id (UUID): Owner user identifier
- created_at, updated_at (ISO timestamps): Flow lifecycle dates
- data (object): Flow configuration with nodes, edges, and component definitions

Usage Examples:
1. List recent flows (default): {}
2. Paginate through flows: { page: 2, size: 20 }
3. Flows in specific folder: { folder_id: "uuid-here" }
4. Get all component flows: { components_only: true, get_all: true }

Best Practices:
- Use pagination (page/size) for better performance instead of get_all
- Filter by folder_id when working within organized projects
- Keep page size <= 50 for optimal response times
- Cache folder_id values to reduce API calls
- Use get_all sparingly, only when you need complete dataset

Common Errors:
- "Page size cannot exceed 100": Reduce size parameter to 100 or less
- "Invalid folder ID format": Ensure folder_id is a valid UUID (use list_folders to get valid IDs)
- Empty results: Check if folder_id exists or try removing filters
- Connection timeout: Reduce page size or enable pagination instead of get_all

Related Tools:
- create_flow: Create new flows after listing existing ones
- get_flow: Retrieve complete flow details by ID from this list
- list_folders: Find valid folder_id values for filtering
- update_flow: Modify flows found in this list
- delete_flow: Remove flows identified in this list`,
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        size: {
          type: 'number',
          description: 'Number of items per page (default: 50, max: 100)'
        },
        folder_id: {
          type: 'string',
          description: 'Filter by folder ID'
        },
        components_only: {
          type: 'boolean',
          description: 'Return only components (default: false)'
        },
        get_all: {
          type: 'boolean',
          description: 'Get all flows without pagination (default: true)'
        }
      }
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'get_flow',
    description: `Retrieve complete details and configuration of a specific flow.

Purpose: Fetch comprehensive information about a flow including its full node graph, component configurations, connections, and metadata. Essential for inspecting flow structure, debugging workflows, and preparing flows for modification or execution.

Parameters:
- flow_id (required, UUID string): The unique identifier of the flow to retrieve (obtained from list_flows or create_flow)

Returns: FlowRead object containing:
- id (UUID): Flow's unique identifier
- name (string): Flow display name
- description (string): Flow purpose description
- folder_id (UUID): Parent folder identifier if organized
- user_id (UUID): Owner user identifier
- created_at, updated_at (ISO timestamps): Flow lifecycle timestamps
- data (object): Complete flow structure including:
  - nodes (array): All component nodes with their configurations
  - edges (array): Connections between nodes
  - viewport (object): Canvas positioning data
  - description (string): Flow-level documentation

Usage Examples:
1. Get flow details: { flow_id: "550e8400-e29b-41d4-a716-446655440000" }
2. Inspect before modification: { flow_id: "flow-uuid-from-list" }
3. Debug flow structure: { flow_id: "failing-flow-uuid" }

Best Practices:
- Use list_flows first to discover available flow_id values
- Cache flow data locally to reduce API calls when repeatedly accessing same flow
- Check updated_at timestamp to detect if flow changed since last retrieval
- Inspect data.nodes to understand flow's component structure
- Review data.edges to trace data flow between components
- Validate flow_id format (must be valid UUID) before making request

Common Errors:
- "Flow not found": flow_id doesn't exist or was deleted (verify with list_flows)
- "Invalid UUID format": flow_id must be valid UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
- "Unauthorized": API key lacks permission to access this flow
- "Flow ID is required": Must provide flow_id parameter
- Connection timeout: Check Langflow instance availability and network connectivity

Related Tools:
- list_flows: Find available flow_id values
- update_flow: Modify flow configuration after retrieval
- run_flow: Execute flow after inspecting its structure
- build_flow: Compile and validate flow structure
- delete_flow: Remove flow after inspection confirms it's no longer needed`,
    inputSchema: {
      type: 'object',
      properties: {
        flow_id: {
          type: 'string',
          description: 'The ID of the flow to retrieve'
        }
      },
      required: ['flow_id']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'update_flow',
    description: `Modify existing flow properties, configuration, or organization.

Purpose: Update flow metadata (name, description), modify flow structure (nodes, edges, components), or reorganize flows into different folders. Essential for maintaining flows, fixing configurations, renaming workflows, and managing project organization over time.

Parameters:
- flow_id (required, UUID string): Unique identifier of flow to update (from list_flows or get_flow)
- name (optional, string, max: 255 chars): New display name for the flow
- description (optional, string): Updated purpose and functionality description
- data (optional, object): New flow structure with nodes, edges, and component configurations
- folder_id (optional, UUID string): Move flow to different folder (use list_folders for valid IDs, null for root level)

Returns: FlowRead object containing:
- id (UUID): Flow's unique identifier (unchanged)
- name (string): Updated flow name
- description (string): Updated description
- folder_id (UUID): New folder location
- user_id (UUID): Owner identifier
- created_at (ISO timestamp): Original creation time (unchanged)
- updated_at (ISO timestamp): Timestamp of this update
- data (object): Complete updated flow structure

Usage Examples:
1. Rename flow: { flow_id: "flow-uuid", name: "Improved Customer Bot" }
2. Update description: { flow_id: "flow-uuid", description: "Processes customer inquiries with sentiment analysis" }
3. Move to folder: { flow_id: "flow-uuid", folder_id: "folder-uuid" }
4. Move to root: { flow_id: "flow-uuid", folder_id: null }
5. Update structure: { flow_id: "flow-uuid", data: { nodes: [...], edges: [...] } }
6. Rename and move: { flow_id: "flow-uuid", name: "New Name", folder_id: "folder-uuid" }

Best Practices:
- Get current flow data with get_flow before updating to avoid overwriting changes
- Only specify fields you want to change (partial updates supported)
- Rebuild flow with build_flow after data modifications to validate changes
- Use descriptive names and descriptions for team collaboration
- Update description when flow functionality changes significantly
- Move flows to appropriate folders to maintain organization
- Verify folder_id exists before moving (use list_folders)
- Update flow name if purpose or functionality changes

Common Errors:
- "Flow not found": flow_id doesn't exist or was deleted (verify with list_flows)
- "Flow name already exists": Choose unique name within target folder
- "Invalid folder ID": folder_id is not valid UUID (use list_folders to get valid IDs)
- "Folder not found": Specified folder_id doesn't exist
- "Invalid flow data structure": data object doesn't match Langflow schema
- "Concurrent modification": Flow was updated by another user (re-fetch with get_flow)
- "flow_id is required": Must provide flow_id parameter
- "Unauthorized": API key lacks permission to modify this flow

Related Tools:
- get_flow: Retrieve current flow state before updating
- build_flow: Validate flow after data modifications
- list_flows: Find flow_id for flows to update
- list_folders: Get valid folder_id values for reorganization
- create_flow: Create new flow instead of modifying existing one`,
    inputSchema: {
      type: 'object',
      properties: {
        flow_id: {
          type: 'string',
          description: 'The ID of the flow to update'
        },
        name: {
          type: 'string',
          description: 'New name for the flow'
        },
        description: {
          type: 'string',
          description: 'New description for the flow'
        },
        data: {
          type: 'object',
          description: 'New flow data/configuration'
        },
        folder_id: {
          type: 'string',
          description: 'New folder ID'
        }
      },
      required: ['flow_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'delete_flow',
    description: `Permanently remove a single flow from Langflow instance.

Purpose: Delete flows that are no longer needed, removing obsolete workflows, or cleaning up test/development flows. This operation is destructive and irreversible - deleted flows cannot be recovered unless previously backed up via download_flows.

Parameters:
- flow_id (required, UUID string): Unique identifier of flow to delete (from list_flows or get_flow)

Returns: Success object containing:
- success (boolean): true if deletion succeeded
- message (string): Confirmation message

Usage Examples:
1. Delete single flow: { flow_id: "550e8400-e29b-41d4-a716-446655440000" }
2. Remove test flow: { flow_id: "test-flow-uuid" }

Best Practices:
- Download flow backup with download_flows before deletion if you might need it later
- Verify flow_id is correct using get_flow before deleting to avoid mistakes
- Check if flow is used in production or referenced by other systems before deletion
- Document why flow was deleted for audit purposes
- For deleting multiple flows, use delete_flows (batch operation) instead
- Review flow contents one final time before permanent removal
- Consider archiving flows to dedicated folder instead of deleting
- Ensure no running jobs or active sessions using this flow

Common Errors:
- "Flow not found": flow_id doesn't exist or already deleted (verify with list_flows)
- "Invalid UUID format": flow_id must be valid UUID string
- "Cannot delete running flow": Flow has active execution (wait for completion or cancel)
- "flow_id is required": Must provide flow_id parameter
- "Unauthorized": API key lacks permission to delete this flow
- "Flow is referenced": Flow is used as component in other flows (remove references first)

Related Tools:
- download_flows: Backup flow before deletion for potential recovery
- list_flows: Find flow_id for flows to delete
- get_flow: Inspect flow before deletion to confirm it's the right one
- delete_flows: Delete multiple flows at once (more efficient for bulk operations)`,
    inputSchema: {
      type: 'object',
      properties: {
        flow_id: {
          type: 'string',
          description: 'The ID of the flow to delete'
        }
      },
      required: ['flow_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'delete_flows',
    description: 'Delete multiple flows at once. Pass array of flow IDs.',
    inputSchema: {
      type: 'object',
      properties: {
        flow_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of flow IDs to delete'
        }
      },
      required: ['flow_ids']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'list_components',
    description: 'List all available Langflow components. Returns components with their types, names, and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'run_flow',
    description: `Execute a Langflow flow with inputs and retrieve execution results.

Purpose: Run a workflow and receive its outputs. Essential for testing flows, integrating workflows into applications, and automating tasks. Supports both synchronous execution and streaming for real-time responses from LLM-based flows.

Parameters:
- flow_id_or_name (required, string): Flow identifier (UUID) or flow name (case-sensitive)
- input_request (required, object): Execution configuration containing:
  - input_value (optional, string): Primary input data for the flow (e.g., user message, data to process)
  - output_type (optional, string): Expected output format (e.g., "chat", "text", "json")
  - input_type (optional, string): Type of input being provided (e.g., "chat", "text", "json")
  - tweaks (optional, object): Component-specific parameter overrides (key: component_id, value: parameter object)
- stream (optional, boolean, default: false): Enable streaming mode for real-time token-by-token responses

Returns: RunResponse object containing:
- outputs (array): Flow execution results from output components
- session_id (string): Unique session identifier for conversation continuity
- Additional fields vary by flow configuration (message, data, artifacts)

Usage Examples:
1. Simple execution: { flow_id_or_name: "my-chatbot", input_request: { input_value: "Hello" } }
2. With output type: { flow_id_or_name: "data-processor", input_request: { input_value: "data", output_type: "json" } }
3. With streaming: { flow_id_or_name: "llm-chat", input_request: { input_value: "Explain AI" }, stream: true }
4. With tweaks: { flow_id_or_name: "flow-uuid", input_request: { input_value: "test", tweaks: { "component-id": { temperature: 0.7 } } } }

Best Practices:
- Use flow ID (UUID) for production; names may change or conflict
- Build flow first with build_flow to ensure it's valid before execution
- Use streaming for LLM-based flows to provide real-time user feedback
- Cache session_id for multi-turn conversations to maintain context
- Set appropriate timeout values for long-running flows
- Test flows with various inputs before production deployment
- Use tweaks sparingly; prefer configuring flows in Langflow UI

Common Errors:
- "Flow not found": Verify flow_id_or_name exists using list_flows
- "Flow has not been built": Run build_flow before executing
- "Invalid input configuration": Ensure input_request matches flow's expected inputs
- "Component configuration error": Check tweaks object matches component IDs and parameter names
- "Execution timeout": Flow took too long; increase timeout or optimize flow
- "Missing required input": Flow expects input_value but none provided

Related Tools:
- build_flow: Compile flow before execution to validate structure
- get_flow: Inspect flow structure to understand required inputs
- get_build_status: Check build completion before running flow
- trigger_webhook: Alternative execution method via webhook endpoint
- list_flows: Find available flows to execute`,
    inputSchema: {
      type: 'object',
      properties: {
        flow_id_or_name: {
          type: 'string',
          description: 'Flow ID (UUID) or flow name'
        },
        input_request: {
          type: 'object',
          description: 'Input request configuration',
          properties: {
            input_value: {
              type: 'string',
              description: 'Input value for the flow'
            },
            output_type: {
              type: 'string',
              description: 'Expected output type'
            },
            input_type: {
              type: 'string',
              description: 'Type of input being provided'
            },
            tweaks: {
              type: 'object',
              description: 'Optional parameter tweaks'
            }
          }
        },
        stream: {
          type: 'boolean',
          description: 'Enable streaming mode (default: false)'
        }
      },
      required: ['flow_id_or_name', 'input_request']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'trigger_webhook',
    description: 'Trigger a flow via webhook endpoint. Simplified API for webhook-based flow execution.',
    inputSchema: {
      type: 'object',
      properties: {
        flow_id_or_name: {
          type: 'string',
          description: 'Flow ID (UUID) or flow name'
        },
        input_request: {
          type: 'object',
          description: 'Simplified input request',
          properties: {
            input_value: {
              type: 'string',
              description: 'Input value for the flow'
            },
            tweaks: {
              type: 'object',
              description: 'Optional parameter tweaks'
            }
          }
        }
      },
      required: ['flow_id_or_name', 'input_request']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'upload_flow',
    description: 'Upload a flow from file data. Provide an object with name, content (stringified JSON), and optional type fields.',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'object',
          description: 'File object with fields: name (string), content (string, max 10MB), type (optional string)',
          properties: {
            name: {
              type: 'string',
              description: 'The filename of the flow export (e.g., flow.json)'
            },
            content: {
              type: 'string',
              description: 'The contents of the flow export as a JSON string'
            },
            type: {
              type: 'string',
              description: 'Optional MIME type of the file (e.g., application/json)'
            }
          },
          required: ['name', 'content']
        }
      },
      required: ['file']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'download_flows',
    description: 'Download flows as JSON export. Exports multiple flows for backup or transfer.',
    inputSchema: {
      type: 'object',
      properties: {
        flow_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of flow IDs (UUIDs) to download'
        }
      },
      required: ['flow_ids']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'get_basic_examples',
    description: 'Get basic example flows. Returns a list of pre-built example flows for learning and templates.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'list_folders',
    description: `List all folders with pagination for organizing flows hierarchically.

Purpose: Retrieve folders from your Langflow instance to discover organizational structure and obtain folder IDs for flow organization. Essential for understanding project hierarchy, finding folders for flow placement, and managing workspace organization.

Parameters:
- page (optional, number, default: 1, min: 1): Page number for pagination
- size (optional, number, default: 50, max: 100): Number of folders per page

Returns: Array of FolderRead objects containing:
- id (UUID): Unique folder identifier (use as folder_id in create_flow or update_flow)
- name (string): Folder display name
- description (string): Folder purpose description
- parent_id (UUID): Parent folder ID if nested, null for root-level folders
- created_at, updated_at (ISO timestamps): Folder lifecycle timestamps

Usage Examples:
1. List all folders (default): {}
2. Paginate through folders: { page: 2, size: 25 }
3. Get first 10 folders: { page: 1, size: 10 }

Best Practices:
- Call this before create_flow to find appropriate folder_id for organization
- Use pagination for large folder collections to improve performance
- Cache folder IDs and names to reduce API calls
- Check parent_id to understand folder hierarchy and nesting structure
- Keep page size <= 50 for optimal response times
- Map folder IDs to names for user-friendly displays in UIs

Common Errors:
- "Page size cannot exceed 100": Reduce size parameter to 100 or less
- "Invalid page number": page must be >= 1
- Empty results: No folders exist (create folders with create_folder)
- Connection timeout: Reduce page size or check Langflow instance availability

Related Tools:
- create_folder: Create new folders after reviewing existing organization
- get_folder: Retrieve detailed information about specific folder
- create_flow: Use folder_id from this list to organize new flows
- update_folder: Modify folder properties found in this list
- list_flows: Filter flows by folder_id obtained from this list`,
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        size: {
          type: 'number',
          description: 'Number of items per page (default: 50, max: 100)'
        }
      }
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'create_folder',
    description: `Create a new folder for organizing flows with optional nested hierarchy.

Purpose: Establish organizational structure in Langflow by creating folders to group related flows. Supports hierarchical organization through nested folders, enabling project-based or team-based flow management. Essential for maintaining organized workspace with many flows.

Parameters:
- name (required, string, max: 255 chars): Folder display name (should be descriptive and unique)
- description (optional, string): Purpose and contents description for documentation
- parent_id (optional, UUID string): Parent folder ID for creating nested subfolder hierarchy (use list_folders to find valid parent IDs)

Returns: FolderRead object containing:
- id (UUID): Newly created folder's unique identifier (use this as folder_id when creating/organizing flows)
- name (string): Folder display name
- description (string): Folder description
- parent_id (UUID): Parent folder ID if nested, null for root-level folder
- created_at, updated_at (ISO timestamps): Folder lifecycle timestamps

Usage Examples:
1. Create root folder: { name: "Production Flows" }
2. Folder with description: { name: "Customer Services", description: "Customer-facing automation workflows" }
3. Create nested subfolder: { name: "API Integrations", parent_id: "parent-folder-uuid" }
4. Project organization: { name: "Q1 2024 Project", description: "First quarter automation initiatives" }

Best Practices:
- Use descriptive, hierarchical names (e.g., "Marketing/Email Campaigns" structure via nesting)
- Add descriptions to document folder purpose and ownership
- Plan folder hierarchy before creation (root categories, then subcategories)
- Create folders before flows to enable immediate organization
- Use consistent naming conventions across team (e.g., "Team - Project - Category")
- Limit nesting depth to 2-3 levels for maintainability
- Cache created folder IDs for subsequent flow creation operations

Common Errors:
- "Folder name already exists": Choose unique name or create in different parent folder
- "Invalid parent folder ID": Ensure parent_id is valid UUID from list_folders
- "Parent folder not found": parent_id doesn't exist or was deleted
- "Name is required": Must provide name parameter
- "Maximum nesting depth exceeded": Too many nested levels (flatten hierarchy)
- "Circular reference detected": parent_id creates loop in folder structure

Related Tools:
- list_folders: Browse existing folders before creating new ones
- update_folder: Modify folder name, description, or move to different parent
- create_flow: Create flows organized within this folder using returned ID
- get_folder: Retrieve folder details after creation
- delete_folder: Remove folder when no longer needed`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Folder name (required)'
        },
        description: {
          type: 'string',
          description: 'Optional folder description'
        },
        parent_id: {
          type: 'string',
          description: 'Optional parent folder ID (UUID) for nested folders'
        }
      },
      required: ['name']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'get_folder',
    description: 'Get details of a specific folder by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Folder ID (UUID)'
        }
      },
      required: ['folder_id']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'update_folder',
    description: 'Update an existing folder. Can change name, description, or move to different parent.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Folder ID (UUID) to update'
        },
        name: {
          type: 'string',
          description: 'New folder name'
        },
        description: {
          type: 'string',
          description: 'New folder description'
        },
        parent_id: {
          type: 'string',
          description: 'New parent folder ID (UUID)'
        }
      },
      required: ['folder_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'delete_folder',
    description: 'Delete a folder by ID. Warning: This may affect flows in the folder.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_id: {
          type: 'string',
          description: 'Folder ID (UUID) to delete'
        }
      },
      required: ['folder_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'list_projects',
    description: 'List all projects with optional pagination. Projects group related flows and resources.',
    inputSchema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)'
        },
        size: {
          type: 'number',
          description: 'Number of items per page (default: 50, max: 100)'
        }
      }
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'create_project',
    description: 'Create a new project. Projects help organize and group related flows.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Project name (required)'
        },
        description: {
          type: 'string',
          description: 'Optional project description'
        }
      },
      required: ['name']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'get_project',
    description: 'Get details of a specific project by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Project ID (UUID)'
        }
      },
      required: ['project_id']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'update_project',
    description: 'Update an existing project. Can change name or description.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Project ID (UUID) to update'
        },
        name: {
          type: 'string',
          description: 'New project name'
        },
        description: {
          type: 'string',
          description: 'New project description'
        }
      },
      required: ['project_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'delete_project',
    description: 'Delete a project by ID. Warning: This may affect flows in the project.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Project ID (UUID) to delete'
        }
      },
      required: ['project_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'upload_project',
    description: 'Upload a project from file data. Provide an object with name, content (stringified JSON), and optional type fields.',
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'object',
          description: 'File object with fields: name (string), content (string, max 10MB), type (optional string)',
          properties: {
            name: {
              type: 'string',
              description: 'File name (e.g., project.json)'
            },
            content: {
              type: 'string',
              description: 'File content as stringified JSON'
            },
            type: {
              type: 'string',
              description: 'Optional MIME type (e.g., application/json)'
            }
          },
          required: ['name', 'content']
        }
      },
      required: ['file']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'download_project',
    description: 'Download a project as JSON export. Exports project for backup or transfer.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          description: 'Project ID (UUID) to download'
        }
      },
      required: ['project_id']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'list_variables',
    description: 'List all global variables. Variables store reusable values across flows.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'create_variable',
    description: 'Create a new global variable. Variables can be referenced in multiple flows.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Variable name (required)'
        },
        value: {
          type: 'string',
          description: 'Variable value (required)'
        },
        type: {
          type: 'string',
          description: 'Optional variable type'
        },
        default_fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional default fields'
        }
      },
      required: ['name', 'value']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true
    }
  },
  {
    name: 'update_variable',
    description: 'Update an existing variable. Can change name, value, or type.',
    inputSchema: {
      type: 'object',
      properties: {
        variable_id: {
          type: 'string',
          description: 'Variable ID (UUID) to update'
        },
        name: {
          type: 'string',
          description: 'New variable name'
        },
        value: {
          type: 'string',
          description: 'New variable value'
        },
        type: {
          type: 'string',
          description: 'New variable type'
        }
      },
      required: ['variable_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'delete_variable',
    description: 'Delete a variable by ID. Warning: Flows using this variable may be affected.',
    inputSchema: {
      type: 'object',
      properties: {
        variable_id: {
          type: 'string',
          description: 'Variable ID (UUID) to delete'
        }
      },
      required: ['variable_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'build_flow',
    description: `Compile and validate a flow, returning job ID for asynchronous status monitoring.

Purpose: Build and validate a flow's component graph, ensuring all nodes are properly configured and connected. Essential prerequisite for flow execution - detects configuration errors, validates component parameters, and prepares the flow for running. Returns job_id for tracking build progress asynchronously.

Parameters:
- flow_id (required, UUID string): Flow identifier to build and validate
- inputs (optional, object): Input values to use during build validation (key: input_name, value: test_data)
- data (optional, object): Flow configuration override (use to build modified version without updating flow)
- files (optional, array of strings): File paths to include in build context
- stop_component_id (optional, string): Component ID where build should stop (useful for partial validation)
- start_component_id (optional, string): Component ID where build should start (skip earlier components)
- log_builds (optional, boolean, default: true): Enable detailed build logging for debugging
- flow_name (optional, string): Override flow name during build (doesn't affect saved flow)
- event_delivery (optional, string, default: "polling"): Delivery mode - "polling" (recommended), "streaming", or "direct"

Returns: BuildFlowResponse object containing:
- job_id (UUID): Unique build job identifier for status polling via get_build_status

Usage Examples:
1. Basic build: { flow_id: "550e8400-e29b-41d4-a716-446655440000" }
2. Build with logging: { flow_id: "flow-uuid", log_builds: true }
3. Build with test inputs: { flow_id: "flow-uuid", inputs: { "user_message": "test" } }
4. Partial build: { flow_id: "flow-uuid", start_component_id: "node-1", stop_component_id: "node-5" }
5. Streaming events: { flow_id: "flow-uuid", event_delivery: "streaming" }

Best Practices:
- Always build flow before first execution to catch configuration errors early
- Use polling event_delivery for reliable status tracking in production
- Enable log_builds during development for detailed error diagnostics
- Rebuild after any flow modifications (nodes, edges, parameters)
- Monitor build status with get_build_status using returned job_id
- Use partial builds (start/stop component) for faster validation of specific sections
- Validate inputs during build to ensure flow accepts expected data format
- Cache successful build status to avoid unnecessary rebuilds

Common Errors:
- "Flow not found": flow_id doesn't exist (verify with list_flows or get_flow)
- "Invalid flow configuration": Flow has disconnected nodes or missing required parameters
- "Component validation failed": Node configuration is invalid (check component settings in Langflow UI)
- "Missing required component parameters": Required fields not set on components
- "Build timeout": Complex flow took too long; simplify or optimize component chain
- "Invalid component ID": start_component_id or stop_component_id doesn't exist in flow
- "Circular dependency detected": Flow has loop in node connections

Related Tools:
- get_build_status: Poll build completion and retrieve validation results using job_id
- run_flow: Execute flow after successful build
- get_flow: Inspect flow structure before building
- cancel_build: Stop long-running build job
- update_flow: Fix configuration errors found during build`,
    inputSchema: {
      type: 'object',
      properties: {
        flow_id: {
          type: 'string',
          description: 'Flow ID (UUID) to build'
        },
        inputs: {
          type: 'object',
          description: 'Optional input values for the flow'
        },
        data: {
          type: 'object',
          description: 'Optional flow data/configuration'
        },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional array of file paths'
        },
        stop_component_id: {
          type: 'string',
          description: 'Optional component ID to stop at'
        },
        start_component_id: {
          type: 'string',
          description: 'Optional component ID to start from'
        },
        log_builds: {
          type: 'boolean',
          description: 'Whether to log build process (default: true)'
        },
        flow_name: {
          type: 'string',
          description: 'Optional flow name override'
        },
        event_delivery: {
          type: 'string',
          description: 'Event delivery mode: "polling", "streaming", or "direct" (default: "polling")'
        }
      },
      required: ['flow_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'get_build_status',
    description: 'Get build status and events for a specific build job. Use polling mode to check async build progress.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'string',
          description: 'Build job ID returned from build_flow'
        },
        event_delivery: {
          type: 'string',
          description: 'Event delivery mode: "polling", "streaming", or "direct" (default: "polling")'
        }
      },
      required: ['job_id']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'cancel_build',
    description: 'Cancel a running build job. Stops the build process for the specified job.',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'string',
          description: 'Build job ID to cancel'
        }
      },
      required: ['job_id']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'list_knowledge_bases',
    description: `List all knowledge bases for Retrieval-Augmented Generation (RAG) workflows.

Purpose: Discover available knowledge bases containing document collections for RAG applications. Essential for understanding what document repositories are available, finding knowledge bases for flow integration, and managing document-based AI applications.

Parameters: None

Returns: Array of KnowledgeBaseInfo objects containing:
- name (string): Knowledge base identifier/name (use this in get_knowledge_base or delete_knowledge_base)
- description (string): Purpose and contents description
- Additional metadata varies by knowledge base implementation (document count, vector store info, embedding model)

Usage Examples:
1. List all knowledge bases: {}

Best Practices:
- Call this before integrating knowledge bases into RAG flows to verify availability
- Use knowledge base names in Langflow's Vector Store or RAG components
- Document which flows use which knowledge bases for dependency tracking
- Monitor knowledge base list to identify unused repositories for cleanup
- Cache knowledge base names for flow configuration validation
- Verify knowledge base exists before flow execution to avoid runtime errors

Common Errors:
- Empty results: No knowledge bases configured (create knowledge bases in Langflow UI or via API)
- Connection timeout: Check Langflow instance availability and vector store connectivity
- "Knowledge base service unavailable": Vector store backend not configured or unreachable

Related Tools:
- get_knowledge_base: Retrieve detailed information about specific knowledge base
- delete_knowledge_base: Remove individual knowledge base when no longer needed
- bulk_delete_knowledge_bases: Clean up multiple knowledge bases at once
- create_flow: Build RAG flows using knowledge base names from this list`,
    inputSchema: {
      type: 'object',
      properties: {}
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'get_knowledge_base',
    description: 'Get detailed information about a specific knowledge base by name.',
    inputSchema: {
      type: 'object',
      properties: {
        kb_name: {
          type: 'string',
          description: 'Knowledge base name/ID'
        }
      },
      required: ['kb_name']
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'delete_knowledge_base',
    description: 'Delete a specific knowledge base by name. Warning: This will permanently remove the knowledge base.',
    inputSchema: {
      type: 'object',
      properties: {
        kb_name: {
          type: 'string',
          description: 'Knowledge base name/ID to delete'
        }
      },
      required: ['kb_name']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  {
    name: 'bulk_delete_knowledge_bases',
    description: 'Delete multiple knowledge bases at once. Useful for batch cleanup operations.',
    inputSchema: {
      type: 'object',
      properties: {
        kb_names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of knowledge base names to delete'
        }
      },
      required: ['kb_names']
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true
    }
  }
];
