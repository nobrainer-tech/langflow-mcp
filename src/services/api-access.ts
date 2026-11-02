import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { z } from 'zod';

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
const scalar = z.union([z.string(), z.number(), z.boolean()]);
const fields = z.record(z.string(), z.union([scalar, z.array(scalar)]));
const MAX_BYTES = 10 * 1024 * 1024;
export const apiSchemaInput = z.object({
  query: z.string().max(200).default(''), path: z.string().optional(), method: z.enum(methods).optional(),
  offset: z.number().int().nonnegative().default(0), limit: z.number().int().min(1).max(20).default(10),
}).strict();
export const apiRequestInput = z.object({
  method: z.enum(methods), path: z.string().min(1).max(4096),
  query: fields.optional(), body: z.unknown().optional(), headers: z.record(z.string(), z.string()).optional(),
  encoding: z.enum(['json', 'form', 'multipart']).default('json'),
  files: z.array(z.object({
    field: z.string().min(1), name: z.string().min(1), content_base64: z.string().max(Math.ceil(MAX_BYTES / 3) * 4),
    content_type: z.string().optional(),
  }).strict()).max(20).optional(),
  response_format: z.enum(['json', 'text', 'base64']).default('json'),
}).strict();
export type ApiSchemaInput = z.input<typeof apiSchemaInput>;
export type ApiRequestInput = z.input<typeof apiRequestInput>;

type JsonObject = Record<string, any>;
function object(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function throwApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    throw new Error(status ? `Langflow API request failed: HTTP ${status}` : 'Langflow API request failed: network, timeout or size limit');
  }
  throw error;
}

function validatePath(path: string): void {
  if (!path.startsWith('/api/') && !['/health', '/health_check', '/healthz'].includes(path)) {
    throw new Error('Use an absolute Langflow API path such as /api/v1/flows/');
  }
  // Reject encoded separators and dot segments before URL/proxy normalization.
  if (/[\\?#\s\x00-\x1f\x7f]/.test(path) || /%(?:2e|2f|5c|25|3f|23|0[0-9a-f]|1[0-9a-f]|7f)/i.test(path) ||
      path.split('/').some(segment => segment === '.' || segment === '..') || /%(?![0-9a-f]{2})/i.test(path)) {
    throw new Error('Unsafe API path; use query separately and no traversal or encoded separators');
  }
}

export async function readApiSchema(client: AxiosInstance, baseURL: string, raw: ApiSchemaInput = {}) {
  const input = apiSchemaInput.parse(raw);
  let document: unknown;
  try {
    ({ data: document } = await client.get('/openapi.json', { baseURL, maxRedirects: 0, maxContentLength: MAX_BYTES }));
  } catch (error) {
    throwApiError(error);
  }
  if (!object(document) || !object(document.paths)) throw new Error('Langflow returned an invalid OpenAPI document');
  if (input.path !== undefined) {
    const item = document.paths[input.path];
    if (!Object.prototype.hasOwnProperty.call(document.paths, input.path) || !object(item)) throw new Error('API path not found in the connected schema');
    const operations: JsonObject = {};
    if (item.parameters) operations.parameters = item.parameters;
    for (const method of methods) {
      if ((!input.method || input.method === method) && object(item[method.toLowerCase()])) operations[method.toLowerCase()] = item[method.toLowerCase()];
    }
    if (!Object.keys(operations).some(key => key !== 'parameters')) throw new Error('API method not found in the connected schema');
    // Include only the local components transitively referenced by this operation.
    const components: JsonObject = {};
    const pending: unknown[] = [operations];
    const seen = new Set<string>();
    let nodes = 0;
    while (pending.length) {
      if (++nodes > 100000) throw new Error('Selected API schema is too complex');
      const value = pending.pop();
      if (!object(value) && !Array.isArray(value)) continue;
      for (const child of Object.values(value)) pending.push(child);
      const ref = (value as JsonObject).$ref;
      if (typeof ref !== 'string' || seen.has(ref)) continue;
      // Inline definitions are already included in their enclosing schema.
      if (ref.startsWith('#/$defs/')) continue;
      if (!/^#\/components\/[^/]+\/[^/]+$/.test(ref)) throw new Error('Only local OpenAPI component references are supported');
      seen.add(ref);
      const [, , section, encodedName] = ref.split('/');
      const name = encodedName.replace(/~1/g, '/').replace(/~0/g, '~');
      const source = document.components?.[section];
      if (!object(source) || !Object.prototype.hasOwnProperty.call(source, name)) throw new Error('OpenAPI component reference is missing');
      if (['__proto__', 'prototype', 'constructor'].includes(section) || ['__proto__', 'prototype', 'constructor'].includes(name)) throw new Error('Unsafe OpenAPI component reference');
      (components[section] ??= {})[name] = source[name];
      pending.push(source[name]);
    }
    return { version: document.info?.version, path: input.path, operations, components };
  }
  const words = input.query.toLowerCase().split(/[\s_-]+/).filter(Boolean);
  const operations = Object.entries(document.paths).flatMap(([path, rawItem]) => {
    if (!object(rawItem)) return [];
    return methods.flatMap(method => {
      const item = rawItem[method.toLowerCase()];
      if (!object(item) || (input.method && method !== input.method)) return [];
      const text = `${path} ${item.summary ?? ''} ${item.description ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();
      return words.every(word => text.includes(word)) ? [{ method, path, summary: String(item.summary ?? '').slice(0, 240) }] : [];
    });
  });
  return { version: document.info?.version, total: operations.length,
    operations: operations.slice(input.offset, input.offset + input.limit),
    ...(input.offset + input.limit < operations.length ? { next_offset: input.offset + input.limit } : {}),
  };
}

export async function requestApi(client: AxiosInstance, baseURL: string, raw: ApiRequestInput) {
  const input = apiRequestInput.parse(raw);
  validatePath(input.path);
  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(input.headers ?? {})) {
    if (!/^(accept|if-match|if-none-match|idempotency-key|last-event-id|x-langflow-global-var-[a-z0-9_-]+)$/i.test(name) || /[\r\n\x00]/.test(value)) {
      throw new Error('Only content negotiation, revision, idempotency and Langflow global-variable headers are allowed');
    }
    headers[name] = value;
  }
  if (input.files?.length && input.encoding !== 'multipart') throw new Error('Files require multipart encoding');
  let data = input.body;
  if (input.encoding !== 'json') {
    const body = fields.parse(input.body ?? {});
    if (input.encoding === 'form') {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) for (const part of Array.isArray(value) ? value : [value]) form.append(key, String(part));
      data = form.toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      const form = new FormData();
      for (const [key, value] of Object.entries(body)) for (const part of Array.isArray(value) ? value : [value]) form.append(key, String(part));
      let size = 0;
      for (const file of input.files ?? []) {
        if (/[\r\n\x00]/.test(file.name + file.field + (file.content_type ?? ''))) throw new Error('Invalid multipart metadata');
        const bytes = Buffer.from(file.content_base64, 'base64');
        if (bytes.toString('base64') !== file.content_base64) throw new Error('Invalid base64 file content');
        size += bytes.length;
        if (size > MAX_BYTES) throw new Error('Files exceed the 10 MiB request limit');
        form.append(file.field, bytes, { filename: file.name, contentType: file.content_type });
      }
      data = form;
      Object.assign(headers, form.getHeaders());
    }
  }
  try {
    const response = await client.request({
      baseURL, url: input.path, method: input.method, params: input.query,
      paramsSerializer: { indexes: null }, data, headers, maxRedirects: 0,
      maxContentLength: MAX_BYTES, maxBodyLength: MAX_BYTES + 64 * 1024, responseType: 'arraybuffer',
    });
    const bytes = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data || '');
    let body: unknown;
    if (input.response_format === 'base64') body = bytes.toString('base64');
    else if (input.response_format === 'text') body = bytes.toString('utf8');
    else if (bytes.length === 0) body = null;
    else {
      try { body = JSON.parse(bytes.toString('utf8')); }
      catch { throw new Error('Response is not JSON; choose text or base64 before calling (do not automatically retry writes)'); }
    }
    return { status: response.status, content_type: response.headers['content-type'],
      encoding: input.response_format, body };
  } catch (error) {
    throwApiError(error);
  }
}
