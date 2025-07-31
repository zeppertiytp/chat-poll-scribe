# Build and Run Guide

## System Requirements

- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Version 8.x or higher (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux

## Quick Start (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd chat-app
   npm install
   ```

2. **Start with mock server:**
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Login: `admin` / `admin`

## Manual Setup

### 1. Environment Configuration

Create `.env.local` file in the root directory:

```env
VITE_OIDC_ISSUER=http://localhost:8081
VITE_OIDC_CLIENT_ID=chat-app
VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
VITE_API_BASE_URL=http://localhost:8080/api
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install mock server dependencies
cd mock-server
npm install
cd ..
```

### 3. Start Services

**Option A: Use the start script (recommended):**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Option B: Manual start:**

Terminal 1 (Mock Server):
```bash
cd mock-server
npm start
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview

# Serve static files
npx serve dist
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

## Mock Server Details

The mock server provides:
- **OIDC endpoints** on port 8081
- **API endpoints** on port 8080
- **Sample data**: 3 users, 2 conversations with messages
- **Login credentials**: `admin` / `admin`

### Mock Server Endpoints

- Auth: `http://localhost:8081/auth`
- Token: `http://localhost:8081/token`
- API: `http://localhost:8080/api/*`

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Frontend (5173), Mock Server (8080), OIDC (8081)
   - Change ports in respective config files

2. **Node version issues:**
   ```bash
   node --version  # Should be 18.x+
   npm --version   # Should be 8.x+
   ```

3. **Permission errors on start-dev.sh:**
   ```bash
   chmod +x start-dev.sh
   ```

4. **Environment variables not loading:**
   - Ensure `.env.local` is in root directory
   - Variables must start with `VITE_`
   - Restart development server after changes

5. **Mock server connection issues:**
   - Check if ports 8080/8081 are available
   - Verify mock server is running: `curl http://localhost:8080/api/health`

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('debug', 'true');
```

## Production Deployment

For production deployment:

1. Update environment variables for production URLs
2. Replace mock server with real backend
3. Configure Keycloak with production settings
4. Build and deploy using your preferred hosting service

See `docs/ENVIRONMENT_SETUP.md` for detailed production configuration.