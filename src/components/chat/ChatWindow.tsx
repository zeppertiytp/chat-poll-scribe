import { useState, useRef, useEffect } from 'react';
import { Conversation, Message, User } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Paperclip, 
  MoreVertical, 
  Users, 
  Phone, 
  Video,
  Smile,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MessageBubble } from './MessageBubble';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string, attachments?: File[]) => void;
  onMarkAsRead: () => void;
  isLoading?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  onMarkAsRead,
  isLoading = false,
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when opened
  useEffect(() => {
    onMarkAsRead();
  }, [conversation.id, onMarkAsRead]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  const handleSendMessage = () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;

    onSendMessage(messageText.trim(), selectedFiles);
    setMessageText('');
    setSelectedFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getConversationName = (): string => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getOnlineStatus = (): string => {
    if (conversation.type === 'group') {
      const onlineCount = conversation.participants.filter(p => p.isOnline).length;
      return `${onlineCount} online`;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    if (otherParticipant?.isOnline) {
      return 'Online';
    }
    
    if (otherParticipant?.lastSeen) {
      return `Last seen ${formatDistanceToNow(otherParticipant.lastSeen, { addSuffix: true })}`;
    }
    
    return 'Offline';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'group') {
      return {
        src: conversation.avatar,
        fallback: conversation.name?.charAt(0).toUpperCase() || 'G'
      };
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return {
      src: otherParticipant?.avatar,
      fallback: otherParticipant?.name.charAt(0).toUpperCase() || 'U'
    };
  };

  const avatar = getConversationAvatar();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={avatar.src} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {avatar.fallback}
                </AvatarFallback>
              </Avatar>
              {conversation.type === 'group' && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1">
                  <Users className="w-3 h-3 text-primary" />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="font-semibold text-foreground">
                {getConversationName()}
              </h2>
              <p className="text-sm text-muted-foreground">
                {getOnlineStatus()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>View Info</DropdownMenuItem>
                <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
                <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                {conversation.type === 'group' && (
                  <DropdownMenuItem>Leave Group</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className={`flex-1 overflow-y-auto p-4 bg-chat-background ${
          isDragOver ? 'bg-primary/10 border-2 border-dashed border-primary' : ''
        }`}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No messages yet</h3>
            <p className="text-muted-foreground">
              Start the conversation by sending your first message
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isConsecutive = 
                index > 0 && 
                messages[index - 1].senderId === message.senderId &&
                new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() < 300000; // 5 minutes
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUser.id}
                  isConsecutive={isConsecutive}
                  sender={conversation.participants.find(p => p.id === message.senderId)}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {isDragOver && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-background p-8 rounded-lg border-2 border-dashed border-primary">
              <Paperclip className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-lg font-medium">Drop files to attach</p>
            </div>
          </div>
        )}
      </div>

      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-background border rounded-lg p-2"
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-32">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-auto p-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="w-full resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-32 bg-background"
              rows={1}
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
          >
            <Smile className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() && selectedFiles.length === 0}
            className="shrink-0"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
};