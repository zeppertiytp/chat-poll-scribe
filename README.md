# WhatsApp-like Chat Application

A React-based chat application with OIDC authentication and HTTP polling for real-time updates.

## Features

- 🔐 OIDC Authentication (Keycloak integration)
- 💬 WhatsApp-like chat interface
- 👥 Direct and group conversations
- 📎 File attachments support
- 🔄 HTTP polling for real-time updates
- 📱 Responsive design

## System Requirements

- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 8.x or higher

## Quick Start with Mock Server

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development environment:**
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Login with: `admin` / `admin`

4. **Sample data includes:**
   - 3 users: Admin User, John Doe, Jane Smith
   - 2 conversations with sample messages
   - Direct and group chat examples

## Manual Setup

### Environment Variables

Create a `.env.local` file with:

```env
VITE_OIDC_ISSUER=http://localhost:8081
VITE_OIDC_CLIENT_ID=chat-app
VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
VITE_API_BASE_URL=http://localhost:8080/api
```

### Start Mock Server

```bash
cd mock-server
npm install
npm start
```

### Start Frontend

```bash
npm install
npm run dev
```

## Production Setup

See [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md) for production configuration with real Keycloak and backend services.

## API Documentation

See [API Documentation](docs/API_DOCUMENTATION.md) for complete backend API specification.

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Authentication**: OIDC/Keycloak
- **State Management**: React hooks + context
- **Styling**: Tailwind CSS with custom design system
- **Communication**: HTTP polling (no WebSockets)

## Development

The application uses HTTP polling instead of WebSockets for real-time updates, making it compatible with various deployment environments and backend technologies.

---

## Lovable Project Info

**URL**: https://lovable.dev/projects/b0ca19ac-0962-4404-9dc4-aaf42780b7ed

### How can I edit this code?

**Use Lovable**: Simply visit the [Lovable Project](https://lovable.dev/projects/b0ca19ac-0962-4404-9dc4-aaf42780b7ed) and start prompting.

**Use your preferred IDE**: Clone this repo and push changes. The only requirement is having Node.js & npm installed.

**Use GitHub Codespaces**: Navigate to the main page and click "Code" -> "Codespaces" -> "New codespace".

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
