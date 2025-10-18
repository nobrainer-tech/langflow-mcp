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
  }
];
