// API Service for backend communication
// This service handles all HTTP requests to the backend API

import { authService } from './authService';
import { Conversation, Message, User, ApiResponse, PaginationParams, Attachment } from '../types/chat';

export interface SendMessageRequest {
  conversationId: string;
  content?: string;
  attachments?: File[];
  replyTo?: string;
}

export interface CreateConversationRequest {
  type: 'direct' | 'group';
  participantIds: string[];
  name?: string; // Required for group chats
}

export interface UpdateConversationRequest {
  name?: string;
  participantIds?: string[]; // For adding/removing participants
}

class ApiService {
  private baseUrl: string;
  private pollingInterval: number = 3000; // 3 seconds
  private pollingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await authService.getAccessToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to refresh
        await authService.logout();
        throw new Error('Authentication failed');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async makeFormDataRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const token = await authService.getAccessToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await authService.logout();
        throw new Error('Authentication failed');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.makeRequest<User>('/users/me');
    return response.data;
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.makeRequest<User[]>(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Conversation endpoints
  async getConversations(params?: PaginationParams): Promise<Conversation[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const endpoint = `/conversations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.makeRequest<Conversation[]>(endpoint);
    return response.data;
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await this.makeRequest<Conversation>(`/conversations/${conversationId}`);
    return response.data;
  }

  async createConversation(request: CreateConversationRequest): Promise<Conversation> {
    const response = await this.makeRequest<Conversation>('/conversations', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  async updateConversation(
    conversationId: string,
    request: UpdateConversationRequest
  ): Promise<Conversation> {
    const response = await this.makeRequest<Conversation>(`/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.makeRequest<void>(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });
  }

  // Message endpoints
  async getMessages(
    conversationId: string,
    params?: PaginationParams
  ): Promise<Message[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.before) queryParams.set('before', params.before);
    if (params?.after) queryParams.set('after', params.after);

    const endpoint = `/conversations/${conversationId}/messages${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await this.makeRequest<Message[]>(endpoint);
    return response.data;
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    if (request.attachments && request.attachments.length > 0) {
      // Handle file uploads
      const formData = new FormData();
      formData.append('conversationId', request.conversationId);
      if (request.content) formData.append('content', request.content);
      if (request.replyTo) formData.append('replyTo', request.replyTo);
      
      request.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });

      const response = await this.makeFormDataRequest<Message>('/messages', formData);
      return response.data;
    } else {
      // Text-only message
      const response = await this.makeRequest<Message>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: request.conversationId,
          content: request.content,
          replyTo: request.replyTo,
        }),
      });
      return response.data;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await this.makeRequest<void>(`/messages/${messageId}/read`, {
      method: 'POST',
    });
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    await this.makeRequest<void>(`/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  // Polling methods
  startPolling(conversationId: string, onNewMessages: (messages: Message[]) => void): void {
    // Clear existing polling for this conversation
    this.stopPolling(conversationId);

    const poll = async () => {
      try {
        // Get latest messages (last 10)
        const messages = await this.getMessages(conversationId, { limit: 10 });
        onNewMessages(messages);
      } catch (error) {
        console.error('Polling error:', error);
      }

      // Schedule next poll
      const timeout = setTimeout(poll, this.pollingInterval);
      this.pollingTimeouts.set(conversationId, timeout);
    };

    // Start polling
    poll();
  }

  stopPolling(conversationId: string): void {
    const timeout = this.pollingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.pollingTimeouts.delete(conversationId);
    }
  }

  stopAllPolling(): void {
    this.pollingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.pollingTimeouts.clear();
  }

  // Conversation list polling
  startConversationPolling(onConversationsUpdate: (conversations: Conversation[]) => void): void {
    this.stopConversationPolling();

    const poll = async () => {
      try {
        const conversations = await this.getConversations();
        onConversationsUpdate(conversations);
      } catch (error) {
        console.error('Conversation polling error:', error);
      }

      const timeout = setTimeout(poll, this.pollingInterval);
      this.pollingTimeouts.set('conversations', timeout);
    };

    poll();
  }

  stopConversationPolling(): void {
    this.stopPolling('conversations');
  }
}

export const apiService = new ApiService();