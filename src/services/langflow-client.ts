import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LangflowConfig,
  FlowCreate,
  FlowRead,
  FlowUpdate,
  ListFlowsParams,
  DeleteFlowsRequest,
  ComponentInfo
} from '../types';

export class LangflowClient {
  private client: AxiosInstance;
  private config: LangflowConfig;

  constructor(config: LangflowConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      }
    });
  }

  async createFlow(flow: FlowCreate): Promise<FlowRead> {
    try {
      const response = await this.client.post<FlowRead>('/flows/', flow);
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to create flow');
    }
  }

  async listFlows(params?: ListFlowsParams): Promise<FlowRead[]> {
    try {
      const response = await this.client.get<FlowRead[]>('/flows/', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to list flows');
    }
  }

  async getFlow(flowId: string): Promise<FlowRead> {
    try {
      const response = await this.client.get<FlowRead>(`/flows/${flowId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to get flow ${flowId}`);
    }
  }

  async updateFlow(flowId: string, updates: FlowUpdate): Promise<FlowRead> {
    try {
      const response = await this.client.patch<FlowRead>(`/flows/${flowId}`, updates);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `Failed to update flow ${flowId}`);
    }
  }

  async deleteFlow(flowId: string): Promise<void> {
    try {
      await this.client.delete(`/flows/${flowId}`);
    } catch (error) {
      throw this.handleError(error, `Failed to delete flow ${flowId}`);
    }
  }

  async deleteFlows(flowIds: string[]): Promise<{ deleted: number }> {
    try {
      const response = await this.client.delete<{ deleted: number }>('/flows/', {
        data: flowIds
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error, 'Failed to delete flows');
    }
  }

  async listComponents(): Promise<ComponentInfo[]> {
    try {
      const response = await this.client.get<any>('/all');
      const components: ComponentInfo[] = [];

      if (response.data && typeof response.data === 'object') {
        Object.entries(response.data).forEach(([category, items]: [string, any]) => {
          if (items && typeof items === 'object') {
            Object.entries(items).forEach(([name, info]: [string, any]) => {
              components.push({
                name,
                display_name: info.display_name || name,
                description: info.description || '',
                type: category
              });
            });
          }
        });
      }

      return components;
    } catch (error) {
      throw this.handleError(error, 'Failed to list components');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  private handleError(error: unknown, message: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;

      return new Error(
        `${message}: ${status ? `HTTP ${status}` : 'Network error'} - ${
          data ? JSON.stringify(data) : axiosError.message
        }`
      );
    }

    if (error instanceof Error) {
      return new Error(`${message}: ${error.message}`);
    }

    return new Error(`${message}: Unknown error`);
  }
}
