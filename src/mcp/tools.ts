import { ToolDefinition } from '../types';

export const langflowMCPTools: ToolDefinition[] = [
  {
    name: 'create_flow',
    description: 'Create a new Langflow flow. Pass name and optional description, data, folder_id.',
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
    }
  },
  {
    name: 'list_flows',
    description: 'List all Langflow flows with optional pagination and filtering.',
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
    }
  },
  {
    name: 'get_flow',
    description: 'Get details of a specific flow by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        flow_id: {
          type: 'string',
          description: 'The ID of the flow to retrieve'
        }
      },
      required: ['flow_id']
    }
  },
  {
    name: 'update_flow',
    description: 'Update an existing flow. Pass flow_id and fields to update.',
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
    }
  },
  {
    name: 'delete_flow',
    description: 'Delete a single flow by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        flow_id: {
          type: 'string',
          description: 'The ID of the flow to delete'
        }
      },
      required: ['flow_id']
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
    }
  },
  {
    name: 'list_components',
    description: 'List all available Langflow components. Returns components with their types, names, and descriptions.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'run_flow',
    description: 'Execute a Langflow flow by ID or name. Returns execution results including outputs and session ID.',
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
    }
  },
  {
    name: 'get_basic_examples',
    description: 'Get basic example flows. Returns a list of pre-built example flows for learning and templates.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_folders',
    description: 'List all folders with optional pagination. Folders help organize flows hierarchically.',
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
    }
  },
  {
    name: 'create_folder',
    description: 'Create a new folder to organize flows. Supports nested folder structure with parent_id.',
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
    }
  },
  {
    name: 'list_variables',
    description: 'List all global variables. Variables store reusable values across flows.',
    inputSchema: {
      type: 'object',
      properties: {}
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
    }
  },
  {
    name: 'build_flow',
    description: 'Build/compile a flow and return job_id for polling build status. Critical for programmatic flow building and execution.',
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
    }
  },
  {
    name: 'list_knowledge_bases',
    description: 'List all available knowledge bases. Essential for RAG workflows and document management.',
    inputSchema: {
      type: 'object',
      properties: {}
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
    }
  }
];
