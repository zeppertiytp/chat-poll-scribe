export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'audio' | 'video';
  size: number;
  mimeType: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  attachments?: Attachment[];
  timestamp: Date;
  isRead: boolean;
  replyTo?: string; // Message ID being replied to
}

export interface Conversation {
  id: string;
  name?: string; // For group chats
  type: 'direct' | 'group';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string; // For group chats
}

export interface ChatState {
  currentUser: User | null;
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: { [conversationId: string]: Message[] };
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  before?: string; // Message ID for pagination
  after?: string; // Message ID for pagination
}