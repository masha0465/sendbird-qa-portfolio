import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const APP_ID = process.env.SENDBIRD_APP_ID || '';
const API_TOKEN = process.env.SENDBIRD_API_TOKEN || '';
const BASE_URL = `https://api-${APP_ID}.sendbird.com/v3`;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Api-Token': API_TOKEN,
  },
});

// User API
export const UserAPI = {
  create: async (userId: string, nickname: string, profileUrl?: string): Promise<AxiosResponse> => {
    return apiClient.post('/users', {
      user_id: userId,
      nickname: nickname,
      profile_url: profileUrl || '',
    });
  },

  get: async (userId: string): Promise<AxiosResponse> => {
    return apiClient.get(`/users/${encodeURIComponent(userId)}`);
  },

  update: async (userId: string, nickname?: string, profileUrl?: string): Promise<AxiosResponse> => {
    return apiClient.put(`/users/${encodeURIComponent(userId)}`, {
      nickname: nickname,
      profile_url: profileUrl,
    });
  },

  delete: async (userId: string): Promise<AxiosResponse> => {
    return apiClient.delete(`/users/${encodeURIComponent(userId)}`);
  },

  list: async (limit: number = 10): Promise<AxiosResponse> => {
    return apiClient.get('/users', {
      params: { limit },
    });
  },
};

// Group Channel API
export const ChannelAPI = {
  create: async (name: string, userIds: string[], isDistinct: boolean = false): Promise<AxiosResponse> => {
    return apiClient.post('/group_channels', {
      name: name,
      user_ids: userIds,
      is_distinct: isDistinct,
    });
  },

  get: async (channelUrl: string): Promise<AxiosResponse> => {
    return apiClient.get(`/group_channels/${encodeURIComponent(channelUrl)}`);
  },

  update: async (channelUrl: string, name?: string): Promise<AxiosResponse> => {
    return apiClient.put(`/group_channels/${encodeURIComponent(channelUrl)}`, {
      name: name,
    });
  },

  delete: async (channelUrl: string): Promise<AxiosResponse> => {
    return apiClient.delete(`/group_channels/${encodeURIComponent(channelUrl)}`);
  },

  list: async (limit: number = 10): Promise<AxiosResponse> => {
    return apiClient.get('/group_channels', {
      params: { limit },
    });
  },

  invite: async (channelUrl: string, userIds: string[]): Promise<AxiosResponse> => {
    return apiClient.post(`/group_channels/${encodeURIComponent(channelUrl)}/invite`, {
      user_ids: userIds,
    });
  },

  leave: async (channelUrl: string, userIds: string[]): Promise<AxiosResponse> => {
    return apiClient.put(`/group_channels/${encodeURIComponent(channelUrl)}/leave`, {
      user_ids: userIds,
    });
  },
};

// Message API
export const MessageAPI = {
  send: async (channelUrl: string, userId: string, message: string, customType?: string, data?: string): Promise<AxiosResponse> => {
    return apiClient.post(`/group_channels/${encodeURIComponent(channelUrl)}/messages`, {
      message_type: 'MESG',
      user_id: userId,
      message: message,
      custom_type: customType,
      data: data,
    });
  },

  get: async (channelUrl: string, messageId: number): Promise<AxiosResponse> => {
    return apiClient.get(`/group_channels/${encodeURIComponent(channelUrl)}/messages/${messageId}`);
  },

  update: async (channelUrl: string, messageId: number, message: string): Promise<AxiosResponse> => {
    return apiClient.put(`/group_channels/${encodeURIComponent(channelUrl)}/messages/${messageId}`, {
      message_type: 'MESG',
      message: message,
    });
  },

  delete: async (channelUrl: string, messageId: number): Promise<AxiosResponse> => {
    return apiClient.delete(`/group_channels/${encodeURIComponent(channelUrl)}/messages/${messageId}`);
  },

  list: async (channelUrl: string, limit: number = 10): Promise<AxiosResponse> => {
    return apiClient.get(`/group_channels/${encodeURIComponent(channelUrl)}/messages`, {
      params: { 
        message_ts: Date.now(),
        prev_limit: limit,
        next_limit: 0,
      },
    });
  },
};

// Helper functions
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
