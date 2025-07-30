import { useState, useEffect, useCallback } from 'react';
import { Conversation, Message, User, ChatState } from '@/types/chat';
import { apiService } from '@/services/apiService';
import { authService } from '@/services/authService';
import { ConversationsList } from './ConversationsList';
import { ChatWindow } from './ChatWindow';
import { NewConversationModal } from './NewConversationModal';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle } from 'lucide-react';

export const ChatApp: React.FC = () => {
  const { toast } = useToast();
  const [chatState, setChatState] = useState<ChatState>({
    currentUser: null,
    conversations: [],
    selectedConversation: null,
    messages: {},
    isLoading: true,
    error: null,
  });
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  // Initialize chat app
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setChatState(prev => ({ ...prev, isLoading: true, error: null }));

        // Get current user
        const currentUser = await apiService.getCurrentUser();
        
        // Get conversations
        const conversations = await apiService.getConversations();

        setChatState(prev => ({
          ...prev,
          currentUser,
          conversations,
          isLoading: false,
        }));

        // Start polling for conversation updates
        apiService.startConversationPolling((updatedConversations) => {
          setChatState(prev => ({
            ...prev,
            conversations: updatedConversations,
          }));
        });

      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setChatState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to load chat',
          isLoading: false,
        }));
        
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to chat service. Please try again.',
          variant: 'destructive',
        });
      }
    };

    initializeChat();

    // Cleanup polling on unmount
    return () => {
      apiService.stopAllPolling();
    };
  }, [toast]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!chatState.selectedConversation) return;

    const loadMessages = async () => {
      try {
        const messages = await apiService.getMessages(chatState.selectedConversation!.id);
        
        setChatState(prev => ({
          ...prev,
          messages: {
            ...prev.messages,
            [chatState.selectedConversation!.id]: messages,
          },
        }));

        // Start polling for new messages in this conversation
        apiService.startPolling(chatState.selectedConversation!.id, (newMessages) => {
          setChatState(prev => ({
            ...prev,
            messages: {
              ...prev.messages,
              [chatState.selectedConversation!.id]: newMessages,
            },
          }));
        });

      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
      }
    };

    loadMessages();

    // Cleanup: stop polling for previous conversation
    return () => {
      if (chatState.selectedConversation) {
        apiService.stopPolling(chatState.selectedConversation.id);
      }
    };
  }, [chatState.selectedConversation, toast]);

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    // Stop polling for current conversation
    if (chatState.selectedConversation) {
      apiService.stopPolling(chatState.selectedConversation.id);
    }

    setChatState(prev => ({
      ...prev,
      selectedConversation: conversation,
    }));
  }, [chatState.selectedConversation]);

  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    if (!chatState.selectedConversation) return;

    try {
      const newMessage = await apiService.sendMessage({
        conversationId: chatState.selectedConversation.id,
        content,
        attachments,
      });

      // Optimistically add message to UI
      setChatState(prev => ({
        ...prev,
        messages: {
          ...prev.messages,
          [chatState.selectedConversation!.id]: [
            ...(prev.messages[chatState.selectedConversation!.id] || []),
            newMessage,
          ],
        },
      }));

      toast({
        title: 'Message sent',
        description: 'Your message has been delivered',
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Send failed',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [chatState.selectedConversation, toast]);

  const handleMarkAsRead = useCallback(async () => {
    if (!chatState.selectedConversation) return;

    try {
      await apiService.markConversationAsRead(chatState.selectedConversation.id);
      
      // Update conversation unread count
      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv =>
          conv.id === chatState.selectedConversation!.id
            ? { ...conv, unreadCount: 0 }
            : conv
        ),
      }));

    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, [chatState.selectedConversation]);

  const handleSearchUsers = useCallback(async (query: string): Promise<User[]> => {
    try {
      return await apiService.searchUsers(query);
    } catch (error) {
      console.error('User search failed:', error);
      toast({
        title: 'Search failed',
        description: 'Failed to search users. Please try again.',
        variant: 'destructive',
      });
      return [];
    }
  }, [toast]);

  const handleCreateDirectConversation = useCallback(async (userId: string) => {
    try {
      const newConversation = await apiService.createConversation({
        type: 'direct',
        participantIds: [userId],
      });

      setChatState(prev => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations],
        selectedConversation: newConversation,
      }));

      toast({
        title: 'Conversation created',
        description: 'You can now start chatting!',
      });

    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: 'Creation failed',
        description: 'Failed to create conversation. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCreateGroupConversation = useCallback(async (name: string, userIds: string[]) => {
    try {
      const newConversation = await apiService.createConversation({
        type: 'group',
        name,
        participantIds: userIds,
      });

      setChatState(prev => ({
        ...prev,
        conversations: [newConversation, ...prev.conversations],
        selectedConversation: newConversation,
      }));

      toast({
        title: 'Group created',
        description: `Group "${name}" has been created successfully!`,
      });

    } catch (error) {
      console.error('Failed to create group:', error);
      toast({
        title: 'Creation failed',
        description: 'Failed to create group. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleLogout = useCallback(async () => {
    try {
      // Stop all polling
      apiService.stopAllPolling();
      
      // Clear chat state
      setChatState({
        currentUser: null,
        conversations: [],
        selectedConversation: null,
        messages: {},
        isLoading: false,
        error: null,
      });

      // Logout from auth service
      await authService.logout();
      
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  // Loading state
  if (chatState.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (chatState.error || !chatState.currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to load chat</h2>
          <p className="text-muted-foreground mb-4">
            {chatState.error || 'Please try refreshing the page'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Conversations Sidebar */}
      <ConversationsList
        conversations={chatState.conversations}
        selectedConversation={chatState.selectedConversation}
        currentUser={chatState.currentUser}
        onSelectConversation={handleSelectConversation}
        onStartNewConversation={() => setIsNewConversationModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {chatState.selectedConversation ? (
          <ChatWindow
            conversation={chatState.selectedConversation}
            messages={chatState.messages[chatState.selectedConversation.id] || []}
            currentUser={chatState.currentUser}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-chat-background">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Select a conversation to start chatting
              </h2>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar or start a new one
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onCreateDirect={handleCreateDirectConversation}
        onCreateGroup={handleCreateGroupConversation}
        onSearchUsers={handleSearchUsers}
      />
    </div>
  );
};