import { randomUUID } from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type Server as NodeHttpServer,
  type ServerResponse
} from 'node:http';
import type { AddressInfo, Socket } from 'node:net';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { logger } from '../utils/logger';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

interface McpServerInstance {
  connectTransport(transport: Transport): Promise<void>;
  shutdown(): Promise<void>;
}

type HttpLifecycle = 'created' | 'starting' | 'running' | 'stopping' | 'stopped';

export interface LangflowMCPHttpServerOptions {
  host?: string;
  port?: number;
  authToken?: string;
  allowedOrigins?: string[];
  enableJsonResponse?: boolean;
  maxSessions?: number;
  sessionIdleTimeoutMs?: number;
  maxConcurrentRequests?: number;
  maxConcurrentBodyBytes?: number;
  requestBodyTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  createMcpServer: () => McpServerInstance;
}

interface McpSession {
  server: McpServerInstance;
  transport: StreamableHTTPServerTransport;
  lastActivityAt: number;
  activeRequests: number;
  closing: boolean;
  closeInitiated: boolean;
  closePromise?: Promise<void>;
}

interface ActiveHttpRequest {
  request: IncomingMessage;
  response: ServerResponse;
  promise: Promise<void>;
}

class HttpRequestError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: number,
    message: string,
    public readonly headers: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'HttpRequestError';
  }
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 3000;
const MAX_BODY_BYTES = 20 * 1024 * 1024;
const DEFAULT_MAX_SESSIONS = 100;
const DEFAULT_SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_MAX_CONCURRENT_REQUESTS = 100;
const DEFAULT_MAX_CONCURRENT_BODY_BYTES = 64 * 1024 * 1024;
const DEFAULT_REQUEST_BODY_TIMEOUT_MS = 30 * 1000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5 * 1000;
const MCP_PATH = '/mcp';

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return DEFAULT_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  return port;
}

function validatePort(port: number): number {
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT must be an integer between 0 and 65535');
  }
  return port;
}

function parsePositiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function validatePositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function parseOrigins(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/^\[|\]$/g, '');
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

export class LangflowMCPHttpServer {
  private readonly host: string;
  private readonly port: number;
  private readonly authToken?: string;
  private readonly allowedOrigins: string[];
  private readonly enableJsonResponse: boolean;
  private readonly maxSessions: number;
  private readonly sessionIdleTimeoutMs: number;
  private readonly maxConcurrentRequests: number;
  private readonly maxConcurrentBodyBytes: number;
  private readonly requestBodyTimeoutMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly createMcpServer: () => McpServerInstance;
  private readonly httpServer: NodeHttpServer;
  private readonly sockets = new Set<Socket>();
  private readonly sessions = new Map<string, McpSession>();
  private readonly activeRequests = new Set<ActiveHttpRequest>();
  private activeBodyBytes = 0;
  private pendingSessions = 0;
  private lifecycle: HttpLifecycle = 'created';
  private sessionSweep?: NodeJS.Timeout;
  private startPromise?: Promise<void>;
  private shutdownPromise?: Promise<void>;

  constructor(options: LangflowMCPHttpServerOptions) {
    this.host = options.host ?? process.env.HOST ?? DEFAULT_HOST;
    this.port = options.port === undefined
      ? parsePort(process.env.PORT)
      : validatePort(options.port);
    this.authToken = options.authToken ?? (process.env.AUTH_TOKEN?.trim() || undefined);
    this.allowedOrigins = options.allowedOrigins ?? parseOrigins(process.env.MCP_ALLOWED_ORIGINS);
    this.enableJsonResponse = options.enableJsonResponse ?? process.env.MCP_HTTP_JSON_RESPONSES === 'true';
    this.maxSessions = validatePositiveInteger(
      options.maxSessions ?? parsePositiveInteger(process.env.MCP_MAX_SESSIONS, DEFAULT_MAX_SESSIONS, 'MCP_MAX_SESSIONS'),
      'maxSessions'
    );
    this.sessionIdleTimeoutMs = validatePositiveInteger(
      options.sessionIdleTimeoutMs ?? parsePositiveInteger(
        process.env.MCP_SESSION_IDLE_TIMEOUT_MS,
        DEFAULT_SESSION_IDLE_TIMEOUT_MS,
        'MCP_SESSION_IDLE_TIMEOUT_MS'
      ),
      'sessionIdleTimeoutMs'
    );
    this.maxConcurrentRequests = validatePositiveInteger(
      options.maxConcurrentRequests ?? parsePositiveInteger(
        process.env.MCP_MAX_CONCURRENT_REQUESTS,
        DEFAULT_MAX_CONCURRENT_REQUESTS,
        'MCP_MAX_CONCURRENT_REQUESTS'
      ),
      'maxConcurrentRequests'
    );
    this.maxConcurrentBodyBytes = validatePositiveInteger(
      options.maxConcurrentBodyBytes ?? parsePositiveInteger(
        process.env.MCP_MAX_CONCURRENT_BODY_BYTES,
        DEFAULT_MAX_CONCURRENT_BODY_BYTES,
        'MCP_MAX_CONCURRENT_BODY_BYTES'
      ),
      'maxConcurrentBodyBytes'
    );
    if (this.maxConcurrentBodyBytes < MAX_BODY_BYTES) {
      throw new Error(`maxConcurrentBodyBytes must be at least ${MAX_BODY_BYTES}`);
    }
    this.requestBodyTimeoutMs = validatePositiveInteger(
      options.requestBodyTimeoutMs ?? parsePositiveInteger(
        process.env.MCP_REQUEST_BODY_TIMEOUT_MS,
        DEFAULT_REQUEST_BODY_TIMEOUT_MS,
        'MCP_REQUEST_BODY_TIMEOUT_MS'
      ),
      'requestBodyTimeoutMs'
    );
    this.shutdownTimeoutMs = validatePositiveInteger(
      options.shutdownTimeoutMs ?? parsePositiveInteger(
        process.env.MCP_SHUTDOWN_TIMEOUT_MS,
        DEFAULT_SHUTDOWN_TIMEOUT_MS,
        'MCP_SHUTDOWN_TIMEOUT_MS'
      ),
      'shutdownTimeoutMs'
    );
    this.createMcpServer = options.createMcpServer;

    if (this.allowedOrigins.includes('*')) {
      throw new Error('MCP_ALLOWED_ORIGINS must contain exact origins; wildcard origins are not allowed');
    }

    if (!isLoopbackHost(this.host) && !this.authToken) {
      throw new Error('AUTH_TOKEN is required when HTTP mode binds to a non-loopback host');
    }

    this.httpServer = createServer((request, response) => this.acceptRequest(request, response));
    this.httpServer.on('connection', socket => {
      this.sockets.add(socket);
      socket.once('close', () => this.sockets.delete(socket));
    });
  }

  getAddress(): AddressInfo | null {
    const address = this.httpServer.address();
    return address && typeof address !== 'string' ? address : null;
  }

  async start(): Promise<void> {
    if (this.lifecycle !== 'created') {
      throw new Error('HTTP server is already running');
    }

    this.lifecycle = 'starting';
    const listenPromise = new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => {
        this.httpServer.off('listening', onListening);
        reject(error);
      };
      const onListening = () => {
        this.httpServer.off('error', onError);
        resolve();
      };

      this.httpServer.once('error', onError);
      this.httpServer.once('listening', onListening);
      this.httpServer.listen(this.port, this.host);
    });
    this.startPromise = listenPromise;

    try {
      await listenPromise;
      if (this.lifecycle !== 'starting') {
        await this.closeHttpServer();
        return;
      }

      this.lifecycle = 'running';
      this.startSessionSweep();
    } catch (error) {
      this.lifecycle = 'stopped';
      throw error;
    } finally {
      if (this.startPromise === listenPromise) this.startPromise = undefined;
    }

    const address = this.getAddress();
    logger.info(`Langflow MCP server running on Streamable HTTP at ${this.host}:${address?.port ?? this.port}${MCP_PATH}`);
  }

  async shutdown(): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;
    if (this.lifecycle === 'stopped') return;

    this.lifecycle = 'stopping';
    const shutdownPromise = this.performShutdown();
    this.shutdownPromise = shutdownPromise;
    await shutdownPromise;
  }

  private acceptRequest(request: IncomingMessage, response: ServerResponse): void {
    if (this.lifecycle !== 'running') {
      request.resume();
      this.sendError(response, 503, -32000, 'MCP server is shutting down');
      return;
    }

    if (this.activeRequests.size >= this.maxConcurrentRequests) {
      request.resume();
      this.sendError(response, 429, -32000, 'Too many concurrent MCP requests', { 'Retry-After': '1' });
      return;
    }

    const promise = this.handleRequest(request, response);
    const activeRequest: ActiveHttpRequest = { request, response, promise };
    this.activeRequests.add(activeRequest);

    void promise
      .catch(error => {
        logger.error('MCP HTTP request failed unexpectedly:', error);
        if (!response.headersSent) {
          this.sendError(response, 500, -32603, 'Internal server error');
        } else if (!response.writableEnded) {
          response.destroy(error instanceof Error ? error : undefined);
        }
      })
      .finally(() => {
        this.activeRequests.delete(activeRequest);
      });
  }

  private async performShutdown(): Promise<void> {
    this.stopSessionSweep();

    if (this.startPromise) {
      await this.waitForCompletion(this.startPromise);
    }

    const sessions = Array.from(this.sessions.values());
    this.sessions.clear();
    for (const session of sessions) session.closing = true;

    const sessionCleanup = Promise.allSettled(sessions.map(session => this.closeSession(session)));
    await this.waitForCompletion(sessionCleanup);

    for (const activeRequest of this.activeRequests) {
      activeRequest.request.destroy();
      activeRequest.response.destroy();
    }
    for (const socket of this.sockets) socket.destroy();

    await this.closeHttpServer();
    this.lifecycle = 'stopped';
  }

  private async waitForCompletion<T>(promise: Promise<T>): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        promise,
        new Promise<void>(resolve => {
          timer = setTimeout(resolve, this.shutdownTimeoutMs);
          timer.unref();
        })
      ]);
    } catch (error) {
      logger.error('MCP HTTP cleanup failed:', error);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer.listening) return;

    const closePromise = new Promise<void>((resolve, reject) => {
      this.httpServer.close(error => {
        if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
          reject(error);
          return;
        }
        resolve();
      });
    });

    this.httpServer.closeAllConnections();
    this.httpServer.closeIdleConnections();
    for (const socket of this.sockets) socket.destroy();
    await this.waitForCompletion(closePromise);
    this.httpServer.closeAllConnections();
    this.httpServer.closeIdleConnections();
    for (const socket of this.sockets) socket.destroy();
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    this.setCorsHeaders(request, response);
    const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname;

    if (requestPath === '/health' && request.method === 'GET') {
      this.sendJson(response, 200, { status: 'ok' });
      return;
    }

    if (requestPath !== MCP_PATH) {
      request.resume();
      this.sendError(response, 404, -32601, 'Not found');
      return;
    }

    if (!this.isAllowedOrigin(request)) {
      request.resume();
      this.sendError(response, 403, -32000, 'Origin is not allowed');
      return;
    }

    if (request.method === 'OPTIONS') {
      request.resume();
      response.statusCode = 204;
      response.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID'
      );
      response.end();
      return;
    }

    if (!['GET', 'POST', 'DELETE'].includes(request.method ?? '')) {
      request.resume();
      response.setHeader('Allow', 'GET, POST, DELETE, OPTIONS');
      this.sendError(response, 405, -32601, 'Method not allowed');
      return;
    }

    if (!this.isAuthorized(request)) {
      request.resume();
      this.sendError(response, 401, -32000, 'Unauthorized', { 'WWW-Authenticate': 'Bearer' });
      return;
    }

    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('X-Accel-Buffering', 'no');

    try {
      if (request.method === 'POST') {
        await this.handlePost(request, response);
        return;
      }

      await this.handleSessionRequest(request, response);
    } catch (error) {
      if (response.headersSent) {
        logger.error('MCP HTTP request failed after response headers were sent');
        return;
      }

      if (error instanceof HttpRequestError) {
        this.sendError(response, error.statusCode, error.errorCode, error.message, error.headers);
        return;
      }

      logger.error('MCP HTTP request failed');
      this.sendError(response, 500, -32603, 'Internal server error');
    }
  }

  private async handlePost(request: IncomingMessage, response: ServerResponse): Promise<void> {
    let body: unknown;
    try {
      body = await this.readJsonBody(request);
    } catch (error) {
      request.resume();
      throw error;
    }

    if (Array.isArray(body)) {
      this.sendError(response, 400, -32600, 'Batch JSON-RPC requests are not supported');
      return;
    }

    const sessionId = singleHeader(request.headers['mcp-session-id']);
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (!session) {
        this.sendError(response, 404, -32001, 'Session not found');
        return;
      }
      await this.handleSessionTransport(session, request, response, body);
      return;
    }

    if (!isInitializeRequest(body)) {
      this.sendError(response, 400, -32000, 'A valid MCP initialize request is required');
      return;
    }

    const session = await this.createSession();
    try {
      await this.handleSessionTransport(session, request, response, body);
    } catch (error) {
      await this.closeSession(session);
      throw error;
    }
  }

  private async handleSessionRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const sessionId = singleHeader(request.headers['mcp-session-id']);
    if (!sessionId) {
      this.sendError(response, 400, -32000, 'Mcp-Session-Id header is required');
      return;
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      this.sendError(response, 404, -32001, 'Session not found');
      return;
    }

    await this.handleSessionTransport(session, request, response);
  }

  private async createSession(): Promise<McpSession> {
    if (this.sessions.size + this.pendingSessions >= this.maxSessions) {
      throw new HttpRequestError(429, -32000, 'Maximum MCP session limit reached', { 'Retry-After': '1' });
    }

    this.pendingSessions += 1;
    let reservationReleased = false;
    const releaseReservation = () => {
      if (reservationReleased) return;
      reservationReleased = true;
      this.pendingSessions -= 1;
    };
    let server: McpServerInstance | undefined;
    let session: McpSession | undefined;

    try {
      server = this.createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: this.enableJsonResponse,
        allowedOrigins: this.allowedOrigins.length > 0 ? this.allowedOrigins : undefined,
        enableDnsRebindingProtection: this.allowedOrigins.length > 0,
        onsessioninitialized: sessionId => {
          releaseReservation();
          if (session && this.lifecycle === 'running' && !session.closing) {
            this.sessions.set(sessionId, session);
            session.lastActivityAt = Date.now();
          }
        }
      });

      session = {
        server,
        transport,
        lastActivityAt: Date.now(),
        activeRequests: 0,
        closing: false,
        closeInitiated: false
      };
      transport.onclose = () => {
        releaseReservation();
        const sessionId = transport.sessionId;
        if (sessionId && this.sessions.get(sessionId) === session) {
          this.sessions.delete(sessionId);
        }
        if (!session || session.closeInitiated) return;
        const currentSession = session;
        currentSession.closeInitiated = true;
        currentSession.closing = true;
        const shutdownPromise = Promise.resolve()
          .then(() => currentSession.server.shutdown())
          .catch(error => {
            logger.error('MCP session shutdown failed:', error);
          });
        currentSession.closePromise = shutdownPromise;
      };

      await server.connectTransport(transport);
      if (this.lifecycle !== 'running') {
        await this.closeSession(session);
        throw new HttpRequestError(503, -32000, 'MCP server is shutting down');
      }
      return session;
    } catch (error) {
      if (session) await this.closeSession(session);
      releaseReservation();
      throw error;
    }
  }

  private async closeSession(session: McpSession): Promise<void> {
    if (session.closePromise) {
      await session.closePromise;
      return;
    }

    session.closing = true;
    session.closeInitiated = true;
    const sessionId = session.transport.sessionId;
    if (sessionId && this.sessions.get(sessionId) === session) {
      this.sessions.delete(sessionId);
    }

    const closePromise = (async () => {
      try {
        await session.transport.close();
      } finally {
        await session.server.shutdown();
      }
    })();
    session.closePromise = closePromise;
    await closePromise;
  }

  private async readJsonBody(request: IncomingMessage): Promise<unknown> {
    const contentLength = singleHeader(request.headers['content-length']);
    if (contentLength !== undefined) {
      const declaredLength = Number(contentLength);
      if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
        throw new HttpRequestError(400, -32700, 'Invalid Content-Length');
      }
      if (declaredLength > MAX_BODY_BYTES) {
        throw new HttpRequestError(413, -32000, 'Request body is too large');
      }
    }

    const bodyPromise = this.readBodyContent(request, contentLength);
    let timer: NodeJS.Timeout | undefined;
    try {
      return await Promise.race([
        bodyPromise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            request.destroy();
            reject(new HttpRequestError(408, -32000, 'Request body timed out'));
          }, this.requestBodyTimeoutMs);
          timer.unref();
        })
      ]);
    } catch (error) {
      void bodyPromise.catch(() => undefined);
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async readBodyContent(request: IncomingMessage, contentLength: string | undefined): Promise<unknown> {
    const declaredLength = contentLength === undefined ? 0 : Number(contentLength);
    let reservedBytes = 0;
    const reserveBytes = (bytes: number) => {
      if (bytes <= 0) return;
      if (this.activeBodyBytes + bytes > this.maxConcurrentBodyBytes) {
        throw new HttpRequestError(429, -32000, 'Too many concurrent request bodies', { 'Retry-After': '1' });
      }
      this.activeBodyBytes += bytes;
      reservedBytes += bytes;
    };

    try {
      reserveBytes(declaredLength);

      const chunks: Buffer[] = [];
      let totalBytes = 0;
      for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.length;
        if (totalBytes > MAX_BODY_BYTES) {
          throw new HttpRequestError(413, -32000, 'Request body is too large');
        }
        reserveBytes(totalBytes - reservedBytes);
        chunks.push(buffer);
      }

      if (chunks.length === 0) {
        throw new HttpRequestError(400, -32700, 'Request body is required');
      }

      try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw new HttpRequestError(400, -32700, 'Parse error');
      }
    } finally {
      this.activeBodyBytes -= reservedBytes;
    }
  }

  private async handleSessionTransport(
    session: McpSession,
    request: IncomingMessage,
    response: ServerResponse,
    body?: unknown
  ): Promise<void> {
    if (session.closing || this.lifecycle !== 'running') {
      throw new HttpRequestError(503, -32000, 'MCP session is closing');
    }

    session.activeRequests += 1;
    session.lastActivityAt = Date.now();
    try {
      await session.transport.handleRequest(request, response, body);
    } finally {
      session.activeRequests -= 1;
      session.lastActivityAt = Date.now();
    }
  }

  private startSessionSweep(): void {
    const intervalMs = Math.min(this.sessionIdleTimeoutMs, 60_000);
    this.sessionSweep = setInterval(() => {
      const cutoff = Date.now() - this.sessionIdleTimeoutMs;
      for (const session of this.sessions.values()) {
        if (!session.closing && session.activeRequests === 0 && session.lastActivityAt <= cutoff) {
          void this.closeSession(session).catch(error => {
            logger.error('Idle MCP session cleanup failed:', error);
          });
        }
      }
    }, intervalMs);
    this.sessionSweep.unref();
  }

  private stopSessionSweep(): void {
    if (!this.sessionSweep) return;
    clearInterval(this.sessionSweep);
    this.sessionSweep = undefined;
  }

  private isAuthorized(request: IncomingMessage): boolean {
    if (!this.authToken) return true;
    return singleHeader(request.headers.authorization) === `Bearer ${this.authToken}`;
  }

  private isAllowedOrigin(request: IncomingMessage): boolean {
    const origin = singleHeader(request.headers.origin);
    return !origin || this.allowedOrigins.includes(origin);
  }

  private setCorsHeaders(request: IncomingMessage, response: ServerResponse): void {
    const origin = singleHeader(request.headers.origin);
    if (origin && this.allowedOrigins.includes(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
    }
    response.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  }

  private sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(body));
  }

  private sendError(
    response: ServerResponse,
    statusCode: number,
    errorCode: number,
    message: string,
    headers: Record<string, string> = {}
  ): void {
    if (response.headersSent) return;
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
    response.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: errorCode, message },
      id: null
    }));
  }
}
