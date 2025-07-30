# ChatApp API Documentation

This document describes the REST API endpoints that need to be implemented by the backend to support the ChatApp frontend application.

## Base Configuration

- **Base URL**: Configurable via `VITE_API_BASE_URL` environment variable
- **Authentication**: Bearer token (JWT) in Authorization header
- **Content-Type**: `application/json` (except for file uploads)

## Authentication

All API endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

The token is obtained through OIDC authentication flow with Keycloak.

## Response Format

All API responses follow this structure:

```json
{
  "data": <response_data>,
  "success": true,
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Endpoints

### User Management

#### GET /api/users/me
Get current user information.

**Response:**
```json
{
  "data": {
    "id": "user123",
    "name": "John Doe",
    "email": "john.doe@company.com",
    "avatar": "https://example.com/avatar.jpg",
    "isOnline": true,
    "lastSeen": "2024-01-15T10:30:00Z"
  },
  "success": true
}
```

#### GET /api/users/search
Search for users by name or email.

**Query Parameters:**
- `q` (string, required): Search query

**Response:**
```json
{
  "data": [
    {
      "id": "user456",
      "name": "Jane Smith",
      "email": "jane.smith@company.com",
      "avatar": "https://example.com/avatar2.jpg",
      "isOnline": false,
      "lastSeen": "2024-01-15T09:45:00Z"
    }
  ],
  "success": true
}
```

### Conversations

#### GET /api/conversations
Get user's conversations.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "data": [
    {
      "id": "conv123",
      "name": "Project Team",
      "type": "group",
      "participants": [
        {
          "id": "user123",
          "name": "John Doe",
          "email": "john.doe@company.com",
          "avatar": "https://example.com/avatar.jpg",
          "isOnline": true,
          "lastSeen": "2024-01-15T10:30:00Z"
        }
      ],
      "lastMessage": {
        "id": "msg789",
        "conversationId": "conv123",
        "senderId": "user456",
        "content": "Hello everyone!",
        "attachments": [],
        "timestamp": "2024-01-15T10:30:00Z",
        "isRead": false
      },
      "unreadCount": 2,
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "avatar": "https://example.com/group-avatar.jpg"
    }
  ],
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "hasMore": false
  }
}
```

#### GET /api/conversations/:id
Get specific conversation details.

**Response:**
```json
{
  "data": {
    "id": "conv123",
    "name": "Project Team",
    "type": "group",
    "participants": [...],
    "lastMessage": {...},
    "unreadCount": 2,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "avatar": "https://example.com/group-avatar.jpg"
  },
  "success": true
}
```

#### POST /api/conversations
Create a new conversation.

**Request Body:**
```json
{
  "type": "direct",
  "participantIds": ["user456"]
}
```

For group conversations:
```json
{
  "type": "group",
  "name": "New Project Team",
  "participantIds": ["user456", "user789"]
}
```

**Response:**
```json
{
  "data": {
    "id": "conv124",
    "name": "New Project Team",
    "type": "group",
    "participants": [...],
    "lastMessage": null,
    "unreadCount": 0,
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  },
  "success": true
}
```

#### PATCH /api/conversations/:id
Update conversation (add/remove participants, change name).

**Request Body:**
```json
{
  "name": "Updated Group Name",
  "participantIds": ["user456", "user789", "user101"]
}
```

**Response:**
```json
{
  "data": {
    "id": "conv123",
    "name": "Updated Group Name",
    "type": "group",
    "participants": [...],
    "lastMessage": {...},
    "unreadCount": 0,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T11:30:00Z"
  },
  "success": true
}
```

#### DELETE /api/conversations/:id
Delete/leave a conversation.

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

#### POST /api/conversations/:id/read
Mark conversation as read.

**Response:**
```json
{
  "success": true,
  "message": "Conversation marked as read"
}
```

### Messages

#### GET /api/conversations/:id/messages
Get messages for a conversation.

**Query Parameters:**
- `page` (number, optional): Page number
- `limit` (number, optional): Items per page (default: 50)
- `before` (string, optional): Message ID to get messages before
- `after` (string, optional): Message ID to get messages after

**Response:**
```json
{
  "data": [
    {
      "id": "msg789",
      "conversationId": "conv123",
      "senderId": "user456",
      "content": "Hello everyone!",
      "attachments": [
        {
          "id": "att123",
          "name": "document.pdf",
          "url": "https://example.com/files/document.pdf",
          "type": "document",
          "size": 1024000,
          "mimeType": "application/pdf"
        }
      ],
      "timestamp": "2024-01-15T10:30:00Z",
      "isRead": false,
      "replyTo": "msg788"
    }
  ],
  "success": true,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "hasMore": true
  }
}
```

#### POST /api/messages
Send a new message.

**For text messages (Content-Type: application/json):**
```json
{
  "conversationId": "conv123",
  "content": "Hello world!",
  "replyTo": "msg788"
}
```

**For messages with attachments (Content-Type: multipart/form-data):**
```
conversationId: conv123
content: Check out this document
replyTo: msg788
attachments[0]: <file>
attachments[1]: <file>
```

**Response:**
```json
{
  "data": {
    "id": "msg790",
    "conversationId": "conv123",
    "senderId": "user123",
    "content": "Hello world!",
    "attachments": [],
    "timestamp": "2024-01-15T10:35:00Z",
    "isRead": false,
    "replyTo": "msg788"
  },
  "success": true
}
```

#### POST /api/messages/:id/read
Mark a specific message as read.

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

## File Upload Requirements

- **Maximum file size**: 50MB per file
- **Supported formats**: 
  - Images: PNG, JPG, JPEG, GIF, WebP
  - Documents: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX
  - Audio: MP3, WAV, M4A
  - Video: MP4, MOV, AVI (up to 100MB)

## Polling Implementation Notes

The frontend uses HTTP polling instead of WebSocket connections. The polling intervals are:

- **Conversation list**: Every 3 seconds
- **Active conversation messages**: Every 3 seconds
- **Polling stops**: When user switches conversations or leaves the app

The backend should handle concurrent requests efficiently and implement proper caching strategies to handle frequent polling requests.

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired token |
| `FORBIDDEN` | User doesn't have access to resource |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Request validation failed |
| `FILE_TOO_LARGE` | Uploaded file exceeds size limit |
| `UNSUPPORTED_FILE_TYPE` | File type not supported |
| `CONVERSATION_NOT_FOUND` | Conversation doesn't exist |
| `USER_NOT_IN_CONVERSATION` | User is not a participant |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Rate Limiting

Recommended rate limits:
- **Message sending**: 30 messages per minute per user
- **File uploads**: 10 uploads per minute per user
- **Search requests**: 60 requests per minute per user
- **General API**: 300 requests per minute per user

## Security Considerations

1. **File Upload Security**: Validate file types, scan for malware, store in secure location
2. **Access Control**: Ensure users can only access conversations they're part of
3. **Message Privacy**: Implement proper access controls for message history
4. **Input Validation**: Sanitize all user inputs to prevent XSS/injection attacks
5. **Rate Limiting**: Implement proper rate limiting to prevent abuse
6. **CORS**: Configure CORS properly for the frontend domain

## Database Schema Suggestions

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Conversation Participants Table
```sql
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  unread_count INTEGER DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES users(id),
  content TEXT,
  reply_to UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Message Attachments Table
```sql
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY,
  message_id UUID REFERENCES messages(id),
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'document', 'audio', 'video')),
  size BIGINT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Message Read Status Table
```sql
CREATE TABLE message_read_status (
  message_id UUID REFERENCES messages(id),
  user_id UUID REFERENCES users(id),
  read_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);
```