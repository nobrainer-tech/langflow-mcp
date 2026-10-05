import { createServer, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LangflowClient } from '../../services/langflow-client';

describe('Langflow list-query serialization over HTTP', () => {
  let fixture: Server;
  let client: LangflowClient;
  let baseUrl: string;
  let received: URL;

  beforeEach(async () => {
    fixture = createServer((request, response) => {
      received = new URL(request.url!, baseUrl);
      response.setHeader('Content-Type', 'application/json');
      response.end('{}');
    });
    await new Promise<void>((resolve) => fixture.listen(0, '127.0.0.1', resolve));
    const address = fixture.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture port');
    baseUrl = `http://127.0.0.1:${address.port}`;
    client = new LangflowClient({ baseUrl, apiKey: 'query-wire-fixture-only', timeout: 2_000 });
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => fixture.close(error => error ? reject(error) : resolve()));
  });

  for (const values of [['OpenAI'], ['OpenAI', 'Provider & scope=configure + 日本語']]) {
    it(`sends ${values.length} provider values as repeated bare query keys`, async () => {
      await client.listEnabledProviders({ providers: values, purpose: 'use' });
      expect(received.pathname).toBe('/api/v1/models/enabled_providers');
      expect(received.searchParams.getAll('providers')).toEqual(values);
      expect(received.searchParams.get('purpose')).toBe('use');
      expect([...received.searchParams.keys()]).not.toContain('providers[]');
    });
  }

  for (const values of [['model-a'], ['model-a', 'model & name=other + 日本語']]) {
    it(`sends ${values.length} model names as repeated bare query keys`, async () => {
      await client.listEnabledModels({ model_names: values, purpose: 'configure' });
      expect(received.pathname).toBe('/api/v1/models/enabled_models');
      expect(received.searchParams.getAll('model_names')).toEqual(values);
      expect(received.searchParams.get('purpose')).toBe('configure');
      expect([...received.searchParams.keys()]).not.toContain('model_names[]');
    });
  }

  it('sends all store list filters as repeated keys and preserves scalar filters', async () => {
    const tags = ['rag', 'tag & category=private + 日本語'];
    const sort = ['name', 'updated_at'];
    const fields = ['name', 'description'];
    await client.listStoreComponents({ tags, sort, fields, private: false, page: 2, limit: 10, search: 'name & tag=x' });
    expect(received.pathname).toBe('/api/v1/store/components/');
    expect(received.searchParams.getAll('tags')).toEqual(tags);
    expect(received.searchParams.getAll('sort')).toEqual(sort);
    expect(received.searchParams.getAll('fields')).toEqual(fields);
    expect(Object.fromEntries([...received.searchParams].filter(([key]) => !['tags', 'sort', 'fields'].includes(key))))
      .toEqual({ private: 'false', page: '2', limit: '10', search: 'name & tag=x' });
    expect([...received.searchParams.keys()].some(key => key.includes('['))).toBe(false);
  });

  it('omits empty arrays without dropping the model visibility purpose', async () => {
    await client.listEnabledProviders({ providers: [], purpose: 'use' });
    expect([...received.searchParams]).toEqual([['purpose', 'use']]);
    await client.listEnabledModels({ model_names: [], purpose: 'configure' });
    expect([...received.searchParams]).toEqual([['purpose', 'configure']]);
    await client.listStoreComponents({ tags: [], sort: [], fields: [], page: 1 });
    expect([...received.searchParams]).toEqual([['page', '1']]);
  });

  it('leaves unfiltered requests without a query string', async () => {
    await client.listEnabledProviders();
    expect(received.search).toBe('');
    await client.listEnabledModels();
    expect(received.search).toBe('');
    await client.listStoreComponents();
    expect(received.search).toBe('');
  });
});
