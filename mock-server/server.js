import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.API_PORT || 8080;
const OIDC_PORT = process.env.OIDC_PORT || 8081;

// JWT Secret for mock tokens
const JWT_SECRET = 'mock-secret-key';

// In-memory data store
let users = [
  {
    id: '1',
    sub: 'admin',
    name: 'Admin User',
    email: 'admin@example.com',
    preferred_username: 'admin',
    given_name: 'Admin',
    family_name: 'User',
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '2',
    sub: 'john_doe',
    name: 'John Doe',
    email: 'john@example.com',
    preferred_username: 'john_doe',
    given_name: 'John',
    family_name: 'Doe',
    picture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face'
  },
  {
    id: '3',
    sub: 'jane_smith',
    name: 'Jane Smith',
    email: 'jane@example.com',
    preferred_username: 'jane_smith',
    given_name: 'Jane',
    family_name: 'Smith',
    picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b17c?w=32&h=32&fit=crop&crop=face'
  }
];

let conversations = [
  {
    id: '1',
    type: 'direct',
    name: 'John Doe',
    participants: ['1', '2'],
    lastMessage: {
      id: '3',
      content: 'Hey! How are you doing?',
      senderId: '2',
      senderName: 'John Doe',
      timestamp: '2024-01-30T10:30:00Z',
      type: 'text'
    },
    unreadCount: 2,
    updatedAt: '2024-01-30T10:30:00Z'
  },
  {
    id: '2',
    type: 'group',
    name: 'Team Chat',
    participants: ['1', '2', '3'],
    lastMessage: {
      id: '6',
      content: 'Great work everyone!',
      senderId: '3',
      senderName: 'Jane Smith',
      timestamp: '2024-01-30T09:15:00Z',
      type: 'text'
    },
    unreadCount: 0,
    updatedAt: '2024-01-30T09:15:00Z'
  }
];

let messages = [
  {
    id: '1',
    conversationId: '1',
    content: 'Hello there!',
    senderId: '1',
    senderName: 'Admin User',
    timestamp: '2024-01-30T10:00:00Z',
    type: 'text',
    status: 'delivered'
  },
  {
    id: '2',
    conversationId: '1',
    content: 'Hi Admin! Good to see you.',
    senderId: '2',
    senderName: 'John Doe',
    timestamp: '2024-01-30T10:15:00Z',
    type: 'text',
    status: 'delivered'
  },
  {
    id: '3',
    conversationId: '1',
    content: 'Hey! How are you doing?',
    senderId: '2',
    senderName: 'John Doe',
    timestamp: '2024-01-30T10:30:00Z',
    type: 'text',
    status: 'delivered'
  },
  {
    id: '4',
    conversationId: '2',
    content: 'Welcome to the team chat!',
    senderId: '1',
    senderName: 'Admin User',
    timestamp: '2024-01-30T09:00:00Z',
    type: 'text',
    status: 'delivered'
  },
  {
    id: '5',
    conversationId: '2',
    content: 'Thanks for adding me!',
    senderId: '2',
    senderName: 'John Doe',
    timestamp: '2024-01-30T09:10:00Z',
    type: 'text',
    status: 'delivered'
  },
  {
    id: '6',
    conversationId: '2',
    content: 'Great work everyone!',
    senderId: '3',
    senderName: 'Jane Smith',
    timestamp: '2024-01-30T09:15:00Z',
    type: 'text',
    status: 'delivered'
  }
];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock OIDC Server for authentication
const oidcApp = express();
oidcApp.use(cors());
oidcApp.use(express.json());
oidcApp.use(express.urlencoded({ extended: true }));

// OIDC Authorization endpoint
oidcApp.get('/auth', (req, res) => {
  const { client_id, redirect_uri, state, nonce } = req.query;
  
  // In a real scenario, this would show a login form
  // For mock, we'll directly redirect with an authorization code
  const authCode = 'mock-auth-code-' + Date.now();
  
  res.redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
});

// OIDC Token endpoint
oidcApp.post('/token', (req, res) => {
  const { grant_type, code, refresh_token } = req.body;
  
  if (grant_type === 'authorization_code' && code?.startsWith('mock-auth-code')) {
    // Mock successful token exchange
    const accessToken = jwt.sign(
      { sub: 'admin', preferred_username: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const idToken = jwt.sign(
      {
        sub: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        preferred_username: 'admin',
        given_name: 'Admin',
        family_name: 'User'
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      access_token: accessToken,
      refresh_token: 'mock-refresh-token',
      id_token: idToken,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } else if (grant_type === 'refresh_token') {
    // Mock token refresh
    const accessToken = jwt.sign(
      { sub: 'admin', preferred_username: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } else {
    res.status(400).json({ error: 'invalid_request' });
  }
});

// OIDC Logout endpoint
oidcApp.get('/logout', (req, res) => {
  const { post_logout_redirect_uri } = req.query;
  res.redirect(post_logout_redirect_uri || 'http://localhost:5173');
});

// Auth middleware for API
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// API Routes

// Get current user
app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.sub === req.user.sub);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    success: true,
    data: user
  });
});

// Search users
app.get('/api/users/search', authenticateToken, (req, res) => {
  const { q } = req.query;
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(q.toLowerCase()) ||
    user.email.toLowerCase().includes(q.toLowerCase()) ||
    user.preferred_username.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json({
    success: true,
    data: filteredUsers
  });
});

// Get conversations
app.get('/api/conversations', authenticateToken, (req, res) => {
  const currentUserId = users.find(u => u.sub === req.user.sub)?.id;
  const userConversations = conversations.filter(conv => 
    conv.participants.includes(currentUserId)
  );
  
  res.json({
    success: true,
    data: userConversations
  });
});

// Get single conversation
app.get('/api/conversations/:id', authenticateToken, (req, res) => {
  const conversation = conversations.find(c => c.id === req.params.id);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  
  res.json({
    success: true,
    data: conversation
  });
});

// Create conversation
app.post('/api/conversations', authenticateToken, (req, res) => {
  const { type, participantIds, name } = req.body;
  const currentUserId = users.find(u => u.sub === req.user.sub)?.id;
  
  const newConversation = {
    id: uuidv4(),
    type,
    name: type === 'group' ? name : users.find(u => u.id === participantIds.find(id => id !== currentUserId))?.name,
    participants: [currentUserId, ...participantIds.filter(id => id !== currentUserId)],
    lastMessage: null,
    unreadCount: 0,
    updatedAt: new Date().toISOString()
  };
  
  conversations.push(newConversation);
  
  res.json({
    success: true,
    data: newConversation
  });
});

// Get messages for conversation
app.get('/api/conversations/:id/messages', authenticateToken, (req, res) => {
  const conversationMessages = messages.filter(m => m.conversationId === req.params.id);
  
  res.json({
    success: true,
    data: conversationMessages
  });
});

// Send message
app.post('/api/messages', authenticateToken, (req, res) => {
  const { conversationId, content, replyTo } = req.body;
  const currentUser = users.find(u => u.sub === req.user.sub);
  
  const newMessage = {
    id: uuidv4(),
    conversationId,
    content,
    senderId: currentUser.id,
    senderName: currentUser.name,
    timestamp: new Date().toISOString(),
    type: 'text',
    status: 'delivered',
    replyTo
  };
  
  messages.push(newMessage);
  
  // Update conversation's last message
  const conversation = conversations.find(c => c.id === conversationId);
  if (conversation) {
    conversation.lastMessage = newMessage;
    conversation.updatedAt = newMessage.timestamp;
  }
  
  res.json({
    success: true,
    data: newMessage
  });
});

// Mark conversation as read
app.post('/api/conversations/:id/read', authenticateToken, (req, res) => {
  const conversation = conversations.find(c => c.id === req.params.id);
  if (conversation) {
    conversation.unreadCount = 0;
  }
  
  res.json({
    success: true,
    data: { message: 'Conversation marked as read' }
  });
});

// Mark message as read
app.post('/api/messages/:id/read', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { message: 'Message marked as read' }
  });
});

// Helper function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
};

// Start servers with port conflict handling
const startServers = async () => {
  try {
    // Start OIDC server
    const oidcPort = await findAvailablePort(OIDC_PORT);
    oidcApp.listen(oidcPort, () => {
      console.log(`🔐 Mock OIDC server running on http://localhost:${oidcPort}`);
      if (oidcPort !== OIDC_PORT) {
        console.log(`⚠️  Note: OIDC port changed from ${OIDC_PORT} to ${oidcPort} (original port was in use)`);
        console.log(`   Update your .env.local: VITE_OIDC_ISSUER=http://localhost:${oidcPort}`);
      }
    });

    // Start API server
    const apiPort = await findAvailablePort(PORT);
    app.listen(apiPort, () => {
      console.log(`🚀 Mock API server running on http://localhost:${apiPort}`);
      if (apiPort !== PORT) {
        console.log(`⚠️  Note: API port changed from ${PORT} to ${apiPort} (original port was in use)`);
        console.log(`   Update your .env.local: VITE_API_BASE_URL=http://localhost:${apiPort}/api`);
      }
      console.log(`📱 Frontend should run on http://localhost:5173`);
      console.log(`\n🔧 Environment variables needed:`);
      console.log(`VITE_OIDC_ISSUER=http://localhost:${oidcPort}`);
      console.log(`VITE_OIDC_CLIENT_ID=chat-app`);
      console.log(`VITE_API_BASE_URL=http://localhost:${apiPort}/api`);
      console.log(`VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback`);
    });

  } catch (error) {
    console.error('Failed to start servers:', error);
    process.exit(1);
  }
};

startServers();