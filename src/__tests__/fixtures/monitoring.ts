import {
  VertexBuildMapModel,
  MessageResponse,
  MonitorBuildsParams,
  MonitorMessagesParams,
  MonitorSessionsParams,
  MonitorTransactionsParams,
  TransactionResponse,
  MigrateSessionParams
} from '../../types';

export const mockMonitorBuildsParams: MonitorBuildsParams = {
  flow_id: 'flow-123'
};

export const mockVertexBuildMap: VertexBuildMapModel = {
  vertex_builds: {
    'vertex-1': [{
      status: 'completed',
      duration: 1234,
      timestamp: '2024-01-01T00:00:00Z'
    }],
    'vertex-2': [{
      status: 'running',
      duration: null,
      timestamp: '2024-01-01T00:01:00Z'
    }]
  }
};

export const mockMessageResponse: MessageResponse = {
  id: 'msg-123',
  session_id: 'session-456',
  sender: 'user',
  sender_name: 'Test User',
  text: 'Hello, this is a test message',
  timestamp: '2024-01-01T00:00:00Z',
  flow_id: 'flow-123'
};

export const mockMessagesList: MessageResponse[] = [
  mockMessageResponse,
  {
    id: 'msg-124',
    session_id: 'session-456',
    sender: 'assistant',
    sender_name: 'AI Assistant',
    text: 'Response message',
    timestamp: '2024-01-01T00:01:00Z',
    flow_id: 'flow-123'
  }
];

export const mockSessionsList: string[] = [
  'session-456',
  'session-789',
  'session-101'
];

export const mockMonitorMessagesParams: MonitorMessagesParams = {
  flow_id: 'flow-123',
  session_id: 'session-456',
  sender: 'user',
  sender_name: 'Test User',
  order_by: 'timestamp'
};

export const mockMonitorSessionsParams: MonitorSessionsParams = {
  flow_id: 'flow-123'
};

export const mockMigrateSessionParams: MigrateSessionParams = {
  old_session_id: 'session-old-123',
  new_session_id: 'session-new-456'
};

export const mockTransactionResponse: TransactionResponse = {
  id: 'txn-123',
  flow_id: 'flow-123',
  status: 'completed',
  started_at: '2024-01-01T00:00:00Z',
  completed_at: '2024-01-01T00:05:00Z',
  duration: 300000,
  inputs: { input: 'test' },
  outputs: { output: 'result' }
};

export const mockTransactionsList: TransactionResponse[] = [
  mockTransactionResponse,
  {
    id: 'txn-124',
    flow_id: 'flow-123',
    status: 'failed',
    started_at: '2024-01-01T00:10:00Z',
    completed_at: '2024-01-01T00:10:05Z',
    duration: 5000,
    error: 'Connection timeout'
  }
];

export const mockMonitorTransactionsParams: MonitorTransactionsParams = {
  flow_id: 'flow-123',
  page: 1,
  size: 10
};
