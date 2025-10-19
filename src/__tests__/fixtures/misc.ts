import {
  VersionResponse,
  TaskStatusResponse,
  StarterProject,
  ElevenLabsVoice,
  HealthResponse
} from '../../types';

export const mockVersionResponse: VersionResponse = {
  version: '1.2.0',
  python_version: '3.11.0',
  langflow_version: '1.2.0'
};

export const mockTaskStatusResponse: TaskStatusResponse = {
  task_id: 'task-123',
  status: 'completed',
  result: {
    flows_created: 5,
    success: true
  }
};

export const mockTaskStatusPending: TaskStatusResponse = {
  task_id: 'task-124',
  status: 'pending',
  result: null
};

export const mockTaskStatusFailed: TaskStatusResponse = {
  task_id: 'task-125',
  status: 'failed',
  error: 'Validation error: invalid flow data'
};

export const mockStarterProject: StarterProject = {
  id: 'starter-1',
  name: 'Basic Chat Flow',
  description: 'A simple chat flow to get started',
  data: {
    nodes: [
      { id: 'input-1', type: 'ChatInput' },
      { id: 'llm-1', type: 'ChatOpenAI' },
      { id: 'output-1', type: 'ChatOutput' }
    ],
    edges: []
  },
  category: 'chat',
  difficulty: 'beginner'
};

export const mockStarterProjectsList: StarterProject[] = [
  mockStarterProject,
  {
    id: 'starter-2',
    name: 'RAG Pipeline',
    description: 'Retrieval-Augmented Generation flow',
    data: { nodes: [], edges: [] },
    category: 'rag',
    difficulty: 'intermediate'
  },
  {
    id: 'starter-3',
    name: 'Agent with Tools',
    description: 'AI agent with multiple tools',
    data: { nodes: [], edges: [] },
    category: 'agents',
    difficulty: 'advanced'
  }
];

export const mockElevenLabsVoice: ElevenLabsVoice = {
  voice_id: 'voice-123',
  name: 'Rachel',
  category: 'premade',
  labels: { accent: 'american', age: 'young' }
};

export const mockElevenLabsVoicesList: ElevenLabsVoice[] = [
  mockElevenLabsVoice,
  {
    voice_id: 'voice-124',
    name: 'Josh',
    category: 'premade',
    labels: { accent: 'american', age: 'middle-aged' }
  },
  {
    voice_id: 'voice-125',
    name: 'Bella',
    category: 'premade',
    labels: { accent: 'british', age: 'young' }
  }
];

export const mockHealthResponse: HealthResponse = {
  status: 'healthy',
  version: '1.2.0',
  uptime: 86400
};

export const mockLogsResponse = {
  logs: [
    {
      timestamp: '2024-01-01T00:00:00Z',
      level: 'INFO',
      message: 'Application started'
    },
    {
      timestamp: '2024-01-01T00:01:00Z',
      level: 'DEBUG',
      message: 'Processing request'
    }
  ]
};
