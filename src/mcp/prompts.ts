export interface McpPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export const langflowPrompts: McpPrompt[] = [
  {
    name: 'langflow-quickstart',
    description: 'Step-by-step guide to create and run your first Langflow flow using the MCP server.',
    arguments: [
      {
        name: 'goal',
        description: 'What you want the flow to accomplish (e.g., "chatbot", "RAG pipeline", "data processor")',
        required: false,
      },
    ],
  },
  {
    name: 'langflow-debug-flow',
    description: 'Diagnose and fix issues with a Langflow flow that is failing to build or execute.',
    arguments: [
      {
        name: 'flow_id',
        description: 'The ID of the flow to debug',
        required: true,
      },
      {
        name: 'error_message',
        description: 'The error message you are seeing',
        required: false,
      },
    ],
  },
  {
    name: 'langflow-rag-setup',
    description: 'Guide to setting up a RAG (Retrieval-Augmented Generation) pipeline with knowledge bases in Langflow.',
    arguments: [
      {
        name: 'kb_name',
        description: 'Name for the knowledge base to create',
        required: false,
      },
    ],
  },
  {
    name: 'langflow-flow-optimization',
    description: 'Analyze a flow and suggest optimizations for performance, reliability, and best practices.',
    arguments: [
      {
        name: 'flow_id',
        description: 'The ID of the flow to optimize',
        required: true,
      },
    ],
  },
  {
    name: 'langflow-batch-operations',
    description: 'Guide for performing bulk operations on flows, folders, and projects in Langflow.',
  },
];

export function getPromptMessages(
  name: string,
  args: Record<string, string>
): Array<{ role: string; content: { type: string; text: string } }> {
  switch (name) {
    case 'langflow-quickstart': {
      const goal = args.goal || 'a simple chatbot';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Help me create ${goal} in Langflow using the available MCP tools.`,
              '',
              'Steps:',
              '1. First, check if Langflow is running using the health_check tool.',
              '2. List available starter templates with list_starter_projects or get_basic_examples.',
              '3. Create a new flow with create_flow based on my goal.',
              '4. Build the flow with build_flow to validate it.',
              '5. Run the flow with run_flow to test it.',
              '',
              'Please guide me through each step, explaining what each tool does.',
            ].join('\n'),
          },
        },
      ];
    }

    case 'langflow-debug-flow': {
      const flowId = args.flow_id || '<flow_id>';
      const errorMsg = args.error_message || 'unknown error';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `I need help debugging a Langflow flow (ID: ${flowId}).`,
              errorMsg !== 'unknown error' ? `Error: ${errorMsg}` : '',
              '',
              'Please:',
              '1. Use get_flow to retrieve the flow details and check its configuration.',
              '2. Use build_flow to attempt a build and capture any errors.',
              '3. Use get_build_status to check the build result.',
              '4. Use get_monitor_builds to review recent build history.',
              '5. Diagnose the issue and suggest fixes.',
            ].join('\n'),
          },
        },
      ];
    }

    case 'langflow-rag-setup': {
      const kbName = args.kb_name || 'my-knowledge-base';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Help me set up a RAG pipeline in Langflow with a knowledge base named "${kbName}".`,
              '',
              'Steps:',
              '1. List existing knowledge bases with list_knowledge_bases.',
              '2. Create/upload documents to the knowledge base using upload_knowledge_base.',
              '3. Create a new flow that uses the knowledge base for retrieval.',
              '4. Build and test the RAG flow.',
              '',
              'Please guide me through each step.',
            ].join('\n'),
          },
        },
      ];
    }

    case 'langflow-flow-optimization': {
      const flowId = args.flow_id || '<flow_id>';
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              `Analyze and optimize the Langflow flow (ID: ${flowId}).`,
              '',
              'Please:',
              '1. Use get_flow to retrieve the full flow configuration.',
              '2. Review the component graph for inefficiencies.',
              '3. Check build history with get_monitor_builds for performance data.',
              '4. Review message history with get_monitor_messages for error patterns.',
              '5. Suggest specific optimizations.',
            ].join('\n'),
          },
        },
      ];
    }

    case 'langflow-batch-operations': {
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Help me perform bulk operations on my Langflow instance.',
              '',
              'Available batch operations:',
              '- batch_create_flows: Create multiple flows at once.',
              '- delete_flows: Delete multiple flows by ID.',
              '- bulk_delete_knowledge_bases: Remove multiple knowledge bases.',
              '- download_flows: Export multiple flows.',
              '- download_folder / download_project: Export entire folders or projects.',
              '',
              'What bulk operation would you like to perform?',
            ].join('\n'),
          },
        },
      ];
    }

    default:
      return [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Unknown prompt: ${name}`,
          },
        },
      ];
  }
}
