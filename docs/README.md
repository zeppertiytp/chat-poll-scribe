# ChatApp - WhatsApp-like Messaging Application

A modern, responsive chat application built with React, TypeScript, and Tailwind CSS. Features OIDC authentication, real-time messaging via HTTP polling, and a WhatsApp-inspired user interface.

## Features

- 🔐 **OIDC Authentication** - Secure login with Keycloak
- 💬 **Real-time Messaging** - HTTP polling-based message updates
- 👥 **Group Chats** - Create and manage group conversations
- 📎 **File Attachments** - Support for images, documents, and media files
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **WhatsApp-inspired UI** - Familiar and intuitive interface
- 🔍 **User Search** - Find and start conversations with team members
- ✅ **Message Status** - Read receipts and delivery status
- 🎯 **Message Replies** - Reply to specific messages in conversations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: OIDC (Keycloak)
- **State Management**: React hooks and context
- **HTTP Client**: Fetch API
- **File Upload**: FormData with multipart support
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A running Keycloak instance
- Backend API implementing the required endpoints (see API documentation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   # OIDC Configuration
   VITE_OIDC_ISSUER=https://your-keycloak-domain.com/realms/your-realm
   VITE_OIDC_CLIENT_ID=your-client-id
   VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
   VITE_OIDC_SCOPE=openid profile email
   
   # API Configuration
   VITE_API_BASE_URL=http://localhost:8080/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   
   Navigate to `http://localhost:5173` in your browser.

## Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── AuthGuard.tsx
│   │   ├── LoginScreen.tsx
│   │   └── CallbackScreen.tsx
│   ├── chat/                 # Chat-related components
│   │   ├── ChatApp.tsx       # Main chat application
│   │   ├── ConversationsList.tsx
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── NewConversationModal.tsx
│   └── ui/                   # shadcn/ui components
├── services/                 # API and auth services
│   ├── authService.ts        # OIDC authentication
│   └── apiService.ts         # Backend API communication
├── types/                    # TypeScript type definitions
│   └── chat.ts
├── hooks/                    # Custom React hooks
├── pages/                    # Route components
└── lib/                      # Utility functions
```

## Configuration

### Environment Variables

See [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md) for detailed configuration instructions.

### Keycloak Setup

1. Create a new client in your Keycloak realm
2. Set client type to "OpenID Connect"
3. Configure as a public client (no client secret)
4. Set valid redirect URIs to include your callback URL
5. Enable standard flow and disable direct access grants

### Backend Requirements

The application requires a backend API implementing specific endpoints. See [API Documentation](./docs/API_DOCUMENTATION.md) for complete specifications.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

The project uses ESLint and Prettier for code formatting. Configuration files:
- `.eslintrc.js` - ESLint rules
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration

### Development Features

- **Hot Module Replacement** - Instant updates during development
- **TypeScript** - Full type safety and IntelliSense
- **Tailwind CSS** - Utility-first styling with custom design system
- **Component Library** - shadcn/ui for consistent UI components

## Authentication Flow

1. **Login Initiation**: User clicks "Sign in with SSO"
2. **OIDC Redirect**: Application redirects to Keycloak login
3. **User Authentication**: User enters credentials in Keycloak
4. **Authorization Code**: Keycloak redirects back with authorization code
5. **Token Exchange**: Application exchanges code for JWT tokens
6. **API Access**: JWT token used for all API requests
7. **Auto Refresh**: Tokens automatically refreshed when expired

## Message Polling

The application uses HTTP polling instead of WebSocket connections:

- **Conversation List**: Polled every 3 seconds
- **Active Chat**: Messages polled every 3 seconds
- **Smart Polling**: Stops when user is inactive or switches conversations
- **Error Handling**: Graceful degradation when API is unavailable

## File Upload Support

Supported file types and limits:
- **Images**: PNG, JPG, JPEG, GIF, WebP (max 50MB)
- **Documents**: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX (max 50MB)
- **Audio**: MP3, WAV, M4A (max 50MB)
- **Video**: MP4, MOV, AVI (max 100MB)

## Deployment

### Production Build

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder

# Build arguments for environment variables
ARG VITE_OIDC_ISSUER
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_REDIRECT_URI
ARG VITE_API_BASE_URL

# Set environment variables
ENV VITE_OIDC_ISSUER=$VITE_OIDC_ISSUER
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Specific Builds

Since Vite embeds environment variables at build time, you need separate builds for different environments:

```bash
# Development build
npm run build

# Production build with environment variables
VITE_OIDC_ISSUER=https://auth.prod.com/realms/company \
VITE_OIDC_CLIENT_ID=chatapp-prod \
VITE_API_BASE_URL=https://api.prod.com/api \
npm run build
```

## API Integration

The frontend expects a REST API implementing specific endpoints. Key requirements:

- **Authentication**: JWT Bearer tokens
- **CORS**: Properly configured for your domain
- **File Upload**: Multipart form data support
- **Error Handling**: Consistent error response format
- **Rate Limiting**: Protection against abuse

See [API Documentation](./docs/API_DOCUMENTATION.md) for complete endpoint specifications.

## Security Considerations

- **HTTPS Required**: Use HTTPS in production
- **Token Storage**: JWT tokens stored securely in localStorage
- **CSRF Protection**: SameSite cookies and CORS configuration
- **XSS Prevention**: All user content properly sanitized
- **File Upload Security**: File type validation and size limits
- **Rate Limiting**: Client-side request throttling

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Performance

- **Bundle Size**: Optimized with tree shaking and code splitting
- **Caching**: Efficient HTTP caching headers
- **Polling Optimization**: Smart polling intervals and request deduplication
- **Image Optimization**: Automatic image compression and lazy loading
- **Memory Management**: Proper cleanup of polling intervals and event listeners

## Troubleshooting

### Common Issues

1. **Authentication Loop**
   - Check redirect URI configuration
   - Verify Keycloak client settings

2. **API Errors**
   - Confirm backend is running and accessible
   - Check CORS configuration
   - Verify JWT token format

3. **File Upload Fails**
   - Check file size limits
   - Verify supported file types
   - Confirm backend multipart support

4. **Messages Not Updating**
   - Check polling intervals
   - Verify API endpoint responses
   - Look for network connectivity issues

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'chatapp:*'` in browser console.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support:
- Check the [API Documentation](./docs/API_DOCUMENTATION.md)
- Review [Environment Setup](./docs/ENVIRONMENT_SETUP.md)
- Open an issue on GitHub
- Contact the development team