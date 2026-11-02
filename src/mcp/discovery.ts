import { z } from 'zod';
import { ToolDefinition } from '../types';

export type ToolMode = 'discovery' | 'standard' | 'consolidated';

export function getToolMode(): ToolMode {
  const mode = process.env.LANGFLOW_TOOL_MODE;
  if (mode !== undefined) {
    if (mode === 'discovery' || mode === 'standard' || mode === 'consolidated') return mode;
    throw new Error('LANGFLOW_TOOL_MODE must be discovery, standard or consolidated');
  }
  if (process.env.LANGFLOW_CONSOLIDATED_TOOLS === 'true') return 'consolidated';
  if (process.env.LANGFLOW_CONSOLIDATED_TOOLS === 'false') return 'standard';
  return 'discovery';
}

export const discoveryTools: ToolDefinition[] = [
  {
    name: 'search_tools',
    description: 'Find Langflow operations by keyword. Returns short summaries, not schemas. Search with an empty query to page through all operations. For live API endpoints, find get_api_schema and request_api.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: 'Words such as run flow, policy bundle, connections or API.' },
      offset: { type: 'integer', minimum: 0, default: 0 },
      limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
    }, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'get_tool_schema',
    description: 'Get the full input schema of one operation found with search_tools. Then invoke it with call_tool.',
    inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
  },
  {
    name: 'call_tool',
    description: 'Execute a Langflow operation using its exact name and arguments from get_tool_schema. May change or delete data; permissions are enforced by Langflow. Does not retry writes.',
    inputSchema: { type: 'object', properties: {
      name: { type: 'string' }, arguments: { type: 'object', additionalProperties: true },
    }, required: ['name', 'arguments'], additionalProperties: false },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  },
];

const searchSchema = z.object({
  query: z.string().max(200).default(''), offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().min(1).max(20).default(5),
}).strict();
const nameSchema = z.object({ name: z.string().min(1).max(128) }).strict();
export const callToolSchema = nameSchema.extend({ arguments: z.record(z.string(), z.unknown()) });

export function searchTools(tools: ToolDefinition[], args: unknown) {
  const { query, offset, limit } = searchSchema.parse(args);
  const words = query.toLowerCase().split(/[\s_-]+/).filter(Boolean);
  const matches = tools.map(tool => {
    const text = `${tool.name} ${tool.description}`.toLowerCase().replace(/_/g, ' ');
    const score = words.every(word => text.includes(word))
      ? words.reduce((sum, word) => sum + (tool.name.includes(word) ? 2 : 1), 0) : -1;
    return { tool, score };
  }).filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score);
  return {
    total: matches.length,
    tools: matches.slice(offset, offset + limit).map(({ tool }) => ({
      name: tool.name, description: tool.description.split('\n')[0].slice(0, 240),
    })),
    ...(offset + limit < matches.length ? { next_offset: offset + limit } : {}),
  };
}

export function getToolSchema(tools: ToolDefinition[], args: unknown) {
  const { name } = nameSchema.parse(args);
  const tool = tools.find(item => item.name === name);
  if (!tool) throw new Error(`Unknown operation: ${name}`);
  return tool;
}
