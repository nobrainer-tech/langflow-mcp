import {
  BuildVerticesRequest,
  VerticesOrderResponse,
  GetVertexParams,
  StreamVertexBuildParams
} from '../../types';

export const mockBuildVerticesRequest: BuildVerticesRequest = {
  data: {
    nodes: [
      { id: 'node-1', type: 'input' },
      { id: 'node-2', type: 'process' },
      { id: 'node-3', type: 'output' }
    ]
  },
  stop_component_id: 'node-3',
  start_component_id: 'node-1'
};

export const mockVerticesOrderResponse: VerticesOrderResponse = {
  ids: ['vertex-1', 'vertex-2', 'vertex-3'],
  run_id: 'run-123',
  execution_order: [
    { vertex_id: 'vertex-1', position: 0 },
    { vertex_id: 'vertex-2', position: 1 },
    { vertex_id: 'vertex-3', position: 2 }
  ]
};

export const mockGetVertexParams: GetVertexParams = {
  flow_id: 'flow-123',
  vertex_id: 'vertex-1'
};

export const mockVertexResponse = {
  id: 'vertex-1',
  vertex_id: 'vertex-1',
  flow_id: 'flow-123',
  component_type: 'ChatInput',
  status: 'completed',
  inputs: { message: 'test input' },
  outputs: { text: 'processed output' },
  metadata: {
    execution_time: 0.5,
    timestamp: '2024-01-01T00:00:00Z'
  }
};

export const mockStreamVertexBuildParams: StreamVertexBuildParams = {
  flow_id: 'flow-123',
  vertex_id: 'vertex-1'
};

export const mockStreamVertexResponse = {
  vertex_id: 'vertex-1',
  status: 'streaming',
  chunk: 'partial output data',
  completed: false
};
