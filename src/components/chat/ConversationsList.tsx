import { useState } from 'react';
import { Conversation, User } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Users, 
  MoreVertical,
  Settings,
  LogOut 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  currentUser: User;
  onSelectConversation: (conversation: Conversation) => void;
  onStartNewConversation: () => void;
  onLogout: () => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  conversations,
  selectedConversation,
  currentUser,
  onSelectConversation,
  onStartNewConversation,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search by conversation name (for groups)
    if (conversation.name?.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search by participant names (for direct chats)
    return conversation.participants.some(participant => 
      participant.name.toLowerCase().includes(query) ||
      participant.email.toLowerCase().includes(query)
    );
  });

  const getConversationName = (conversation: Conversation): string => {
    if (conversation.type === 'group') {
      return conversation.name || 'Group Chat';
    }
    
    // For direct chats, show the other participant's name
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation): { src?: string; fallback: string } => {
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

  const getLastMessagePreview = (conversation: Conversation): string => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    if (conversation.lastMessage.content) {
      return conversation.lastMessage.content.length > 50 
        ? `${conversation.lastMessage.content.substring(0, 50)}...`
        : conversation.lastMessage.content;
    }
    
    if (conversation.lastMessage.attachments?.length) {
      const attachment = conversation.lastMessage.attachments[0];
      return `📎 ${attachment.name}`;
    }
    
    return 'Message';
  };

  const getLastMessageTime = (conversation: Conversation): string => {
    if (!conversation.lastMessage) return '';
    
    return formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: true });
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {currentUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate">
                {currentUser.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4 border-b border-sidebar-border">
        <Button 
          onClick={onStartNewConversation}
          className="w-full"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          Start New Conversation
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const avatar = getConversationAvatar(conversation);
              const isSelected = selectedConversation?.id === conversation.id;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'hover:bg-conversation-hover'
                    }
                  `}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={avatar.src} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {avatar.fallback}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 bg-sidebar-background rounded-full p-1">
                        <Users className="w-3 h-3 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sidebar-foreground truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {getLastMessageTime(conversation)}
                          </span>
                        )}
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="min-w-[20px] h-5 text-xs px-1.5">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {conversation.type === 'group' && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {conversation.participants.length} participants
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};