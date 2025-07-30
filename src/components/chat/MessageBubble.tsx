import { Message, User, Attachment } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  File, 
  Image as ImageIcon, 
  Video, 
  Music,
  FileText,
  CheckCheck,
  Check
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  isConsecutive?: boolean;
  sender?: User;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  isConsecutive = false,
  sender,
}) => {
  const getAttachmentIcon = (attachment: Attachment) => {
    switch (attachment.type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Music className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getMessageTime = (): string => {
    const messageDate = new Date(message.timestamp);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return format(messageDate, 'HH:mm');
    } else {
      return format(messageDate, 'MMM d, HH:mm');
    }
  };

  const renderAttachment = (attachment: Attachment, index: number) => {
    if (attachment.type === 'image') {
      return (
        <div key={attachment.id} className="relative group">
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-w-xs max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.url, '_blank')}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button variant="secondary" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={attachment.id}
        className={`
          flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer
          ${isOwnMessage 
            ? 'bg-white/10 border-white/20 hover:bg-white/20' 
            : 'bg-muted hover:bg-muted/80'
          }
        `}
        onClick={() => window.open(attachment.url, '_blank')}
      >
        <div className={`p-2 rounded ${isOwnMessage ? 'bg-white/20' : 'bg-primary/10'}`}>
          {getAttachmentIcon(attachment)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isOwnMessage ? 'text-white' : 'text-foreground'}`}>
            {attachment.name}
          </p>
          <p className={`text-xs ${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'}`}>
            {formatFileSize(attachment.size)}
          </p>
        </div>
        <Download className={`w-4 h-4 ${isOwnMessage ? 'text-white/70' : 'text-muted-foreground'}`} />
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-4'}`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-[70%]`}>
        {/* Avatar */}
        {!isOwnMessage && !isConsecutive && (
          <Avatar className="w-8 h-8 shrink-0">
            <AvatarImage src={sender?.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {sender?.name.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        {!isOwnMessage && isConsecutive && (
          <div className="w-8 shrink-0" />
        )}

        {/* Message Content */}
        <div className="flex flex-col space-y-1">
          {/* Sender name for group chats */}
          {!isOwnMessage && !isConsecutive && sender && (
            <p className="text-xs text-muted-foreground ml-3">
              {sender.name}
            </p>
          )}

          {/* Message Bubble */}
          <div
            className={`
              px-4 py-2 rounded-2xl shadow-sm
              ${isOwnMessage
                ? 'bg-message-sent text-primary-foreground rounded-br-md'
                : 'bg-message-received text-foreground rounded-bl-md'
              }
              ${isConsecutive
                ? isOwnMessage
                  ? 'rounded-tr-2xl rounded-br-md'
                  : 'rounded-tl-2xl rounded-bl-md'
                : ''
              }
            `}
            style={{
              boxShadow: 'var(--message-shadow)',
            }}
          >
            {/* Text Content */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={`space-y-2 ${message.content ? 'mt-2' : ''}`}>
                {message.attachments.map((attachment, index) => 
                  renderAttachment(attachment, index)
                )}
              </div>
            )}

            {/* Message Info */}
            <div className={`flex items-center justify-end space-x-1 mt-1 ${message.content || message.attachments?.length ? 'mt-1' : ''}`}>
              <span className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {getMessageTime()}
              </span>
              
              {isOwnMessage && (
                <div className="flex items-center">
                  {message.isRead ? (
                    <CheckCheck className={`w-3 h-3 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-primary'}`} />
                  ) : (
                    <Check className={`w-3 h-3 ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};