import {
  RunFlowAdvancedRequest,
  ProcessFlowRequest,
  PredictFlowRequest,
  RunResponse
} from '../../types';

export const mockRunFlowAdvancedRequest: RunFlowAdvancedRequest = {
  input_value: 'advanced test input',
  input_type: 'text',
  output_type: 'chat',
  output_component: 'ChatOutput-123',
  tweaks: {
    'llm-component': {
      temperature: 0.7,
      max_tokens: 100
    }
  },
  session_id: 'session-adv-123'
};

export const mockRunFlowAdvancedResponse: RunResponse = {
  session_id: 'session-adv-123',
  execution_id: 'exec-adv-123',
  outputs: [
    {
      inputs: { input: 'advanced test input' },
      outputs: [
        {
          results: {
            message: {
              text: 'Advanced output response',
              metadata: { model: 'gpt-4' }
            }
          },
          artifacts: { execution_time: 1.23 },
          messages: [],
          component_display_name: 'ChatOutput',
          component_id: 'ChatOutput-123'
        }
      ]
    }
  ]
};

export const mockProcessFlowRequest: ProcessFlowRequest = {
  inputs: {
    param1: 'value1',
    param2: 'value2'
  },
  tweaks: {
    'processor-1': {
      batch_size: 10
    }
  }
};

export const mockProcessFlowResponse = {
  result: 'processed',
  data: {
    processed_items: 100,
    duration: 2500
  }
};

export const mockPredictFlowRequest: PredictFlowRequest = {
  inputs: {
    features: [1, 2, 3, 4, 5]
  },
  tweaks: {
    'model-component': {
      confidence_threshold: 0.85
    }
  }
};

export const mockPredictFlowResponse = {
  prediction: 'class_A',
  confidence: 0.92,
  probabilities: {
    class_A: 0.92,
    class_B: 0.06,
    class_C: 0.02
  }
};
