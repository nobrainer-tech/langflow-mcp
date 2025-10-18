import { BuildFlowRequest, BuildFlowParams, BuildFlowResponse, BuildStatusResponse, CancelBuildResponse } from '../../types';

export const mockBuildFlowRequest: BuildFlowRequest = {
  inputs: {
    input1: 'test value',
    input2: 123
  },
  data: {
    nodes: [],
    edges: []
  },
  files: ['file1.txt', 'file2.json']
};

export const mockBuildFlowParams: BuildFlowParams = {
  stop_component_id: '123e4567-e89b-12d3-a456-426614174010',
  start_component_id: '123e4567-e89b-12d3-a456-426614174011',
  log_builds: true,
  flow_name: 'Test Build Flow',
  event_delivery: 'polling'
};

export const mockMinimalBuildRequest: BuildFlowRequest = {};

export const mockMinimalBuildParams: BuildFlowParams = {};

export const mockBuildFlowResponse: BuildFlowResponse = {
  job_id: 'job-123e4567-e89b-12d3-a456-426614174020'
};

export const mockBuildStatusResponse: BuildStatusResponse = {
  status: 'running',
  progress: 50,
  message: 'Building flow components',
  job_id: 'job-123e4567-e89b-12d3-a456-426614174020',
  started_at: '2024-01-01T10:00:00Z'
};

export const mockCompletedBuildStatus: BuildStatusResponse = {
  status: 'completed',
  progress: 100,
  message: 'Build completed successfully',
  job_id: 'job-123e4567-e89b-12d3-a456-426614174020',
  started_at: '2024-01-01T10:00:00Z',
  completed_at: '2024-01-01T10:05:00Z'
};

export const mockFailedBuildStatus: BuildStatusResponse = {
  status: 'failed',
  progress: 75,
  message: 'Build failed due to validation error',
  job_id: 'job-123e4567-e89b-12d3-a456-426614174020',
  started_at: '2024-01-01T10:00:00Z',
  failed_at: '2024-01-01T10:03:00Z',
  error: 'Component validation failed'
};

export const mockCancelBuildResponse: CancelBuildResponse = {
  success: true,
  message: 'Build job cancelled successfully',
  cancelled: true
};

export const mockCancelBuildAlreadyCompleted: CancelBuildResponse = {
  success: false,
  message: 'Cannot cancel completed build job',
  cancelled: false
};
