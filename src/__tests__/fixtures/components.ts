import { ComponentInfo } from '../../types';

export const mockComponentsApiResponse = {
  agents: {
    'OpenAI Agent': {
      display_name: 'OpenAI Agent',
      description: 'Agent powered by OpenAI'
    },
    'Custom Agent': {
      display_name: 'Custom Agent',
      description: 'Custom agent implementation'
    }
  },
  chains: {
    'LLM Chain': {
      display_name: 'LLM Chain',
      description: 'Basic LLM chain'
    }
  }
};

export const mockComponentsList: ComponentInfo[] = [
  {
    name: 'OpenAI Agent',
    display_name: 'OpenAI Agent',
    description: 'Agent powered by OpenAI',
    type: 'agents'
  },
  {
    name: 'Custom Agent',
    display_name: 'Custom Agent',
    description: 'Custom agent implementation',
    type: 'agents'
  },
  {
    name: 'LLM Chain',
    display_name: 'LLM Chain',
    description: 'Basic LLM chain',
    type: 'chains'
  }
];
