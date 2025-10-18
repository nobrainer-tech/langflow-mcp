import { RunFlowRequest, RunResponse, SimplifiedAPIRequest } from '../../types';

export const mockRunFlowRequest: RunFlowRequest = {
  input_value: 'test input',
  output_type: 'chat',
  input_type: 'text',
  tweaks: {
    'component-1': {
      parameter: 'value'
    }
  }
};

export const mockRunResponse: RunResponse = {
  session_id: 'session-123',
  outputs: [
    {
      inputs: { input: 'test input' },
      outputs: [
        {
          results: {
            message: {
              text: 'test output'
            }
          },
          artifacts: {},
          messages: [],
          component_display_name: 'ChatOutput',
          component_id: 'ChatOutput-123'
        }
      ]
    }
  ]
};

export const mockWebhookRequest: SimplifiedAPIRequest = {
  input_value: 'webhook test input',
  tweaks: {
    'component-1': {
      parameter: 'value'
    }
  }
};

export const mockWebhookResponse = {
  result: 'success',
  data: {
    message: 'Webhook triggered successfully'
  }
};

export const mockUploadFile = {
  name: 'test-flow.json',
  content: JSON.stringify({
    name: 'Uploaded Flow',
    description: 'Flow from upload',
    data: { nodes: [], edges: [] }
  })
};

export const mockDownloadResponse = {
  flows: [
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Flow 1',
      data: { nodes: [], edges: [] }
    }
  ],
  format: 'json'
};
