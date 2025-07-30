# Environment Configuration Guide

This document explains how to configure the environment variables required for the ChatApp frontend application.

## Required Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

### OIDC Authentication Configuration

```bash
# Keycloak OIDC Configuration
VITE_OIDC_ISSUER=https://your-keycloak-domain.com/realms/your-realm
VITE_OIDC_CLIENT_ID=your-client-id
VITE_OIDC_REDIRECT_URI=https://your-app-domain.com/callback
VITE_OIDC_SCOPE=openid profile email
```

### API Configuration

```bash
# Backend API Base URL
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Environment Variable Descriptions

### VITE_OIDC_ISSUER
- **Description**: The base URL of your Keycloak realm
- **Format**: `https://{keycloak-domain}/realms/{realm-name}`
- **Example**: `https://auth.mycompany.com/realms/company`
- **Required**: Yes

### VITE_OIDC_CLIENT_ID
- **Description**: The client ID configured in Keycloak for this application
- **Format**: String (typically alphanumeric)
- **Example**: `chatapp-frontend`
- **Required**: Yes

### VITE_OIDC_REDIRECT_URI
- **Description**: The callback URL where Keycloak will redirect after authentication
- **Format**: Full URL ending with `/callback`
- **Example**: `https://chat.mycompany.com/callback`
- **Default**: `{current-origin}/callback`
- **Required**: No (uses default if not provided)

### VITE_OIDC_SCOPE
- **Description**: OAuth scopes to request during authentication
- **Format**: Space-separated list of scopes
- **Example**: `openid profile email groups`
- **Default**: `openid profile email`
- **Required**: No (uses default if not provided)

### VITE_API_BASE_URL
- **Description**: Base URL for your backend API
- **Format**: Full URL without trailing slash
- **Example**: `https://api.mycompany.com/api`
- **Default**: `http://localhost:8080/api`
- **Required**: No (uses default if not provided)

## Environment-Specific Configurations

### Development Environment (.env.development)
```bash
VITE_OIDC_ISSUER=https://dev-auth.mycompany.com/realms/company-dev
VITE_OIDC_CLIENT_ID=chatapp-frontend-dev
VITE_OIDC_REDIRECT_URI=http://localhost:5173/callback
VITE_API_BASE_URL=http://localhost:8080/api
```

### Staging Environment (.env.staging)
```bash
VITE_OIDC_ISSUER=https://staging-auth.mycompany.com/realms/company-staging
VITE_OIDC_CLIENT_ID=chatapp-frontend-staging
VITE_OIDC_REDIRECT_URI=https://staging-chat.mycompany.com/callback
VITE_API_BASE_URL=https://staging-api.mycompany.com/api
```

### Production Environment (.env.production)
```bash
VITE_OIDC_ISSUER=https://auth.mycompany.com/realms/company
VITE_OIDC_CLIENT_ID=chatapp-frontend
VITE_OIDC_REDIRECT_URI=https://chat.mycompany.com/callback
VITE_API_BASE_URL=https://api.mycompany.com/api
```

## Keycloak Client Configuration

To set up the OIDC client in Keycloak:

1. **Create a new client** in your Keycloak realm
2. **Client Type**: OpenID Connect
3. **Client ID**: Use the value from `VITE_OIDC_CLIENT_ID`
4. **Client authentication**: OFF (public client)
5. **Standard flow**: Enabled
6. **Direct access grants**: Disabled
7. **Valid redirect URIs**: Add your `VITE_OIDC_REDIRECT_URI` value
8. **Web origins**: Add your application's domain

### Required Client Scopes
Ensure these scopes are available and assigned to your client:
- `openid` (required)
- `profile` (required for user name and details)
- `email` (required for user email)

### Client Settings
```json
{
  "clientId": "chatapp-frontend",
  "enabled": true,
  "publicClient": true,
  "protocol": "openid-connect",
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": false,
  "redirectUris": [
    "https://chat.mycompany.com/callback",
    "http://localhost:5173/callback"
  ],
  "webOrigins": [
    "https://chat.mycompany.com",
    "http://localhost:5173"
  ],
  "defaultClientScopes": [
    "openid",
    "profile",
    "email"
  ]
}
```

## Deployment Considerations

### Build-Time Variables
Since this is a Vite application, all environment variables with the `VITE_` prefix are embedded into the built application at build time. This means:

1. **No runtime configuration**: Variables cannot be changed after the build without rebuilding
2. **Public exposure**: All `VITE_` variables are exposed to the client browser
3. **Build per environment**: You need separate builds for different environments

### Docker Deployment
For Docker deployments, you can use build arguments:

```dockerfile
FROM node:18-alpine

# Build arguments
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
COPY --from=0 /app/dist /usr/share/nginx/html
```

Build with environment-specific values:
```bash
docker build \
  --build-arg VITE_OIDC_ISSUER=https://auth.mycompany.com/realms/company \
  --build-arg VITE_OIDC_CLIENT_ID=chatapp-frontend \
  --build-arg VITE_OIDC_REDIRECT_URI=https://chat.mycompany.com/callback \
  --build-arg VITE_API_BASE_URL=https://api.mycompany.com/api \
  -t chatapp:latest .
```

## Security Notes

1. **No secrets in environment variables**: Since `VITE_` variables are exposed to the browser, never put secrets or sensitive information in them
2. **HTTPS in production**: Always use HTTPS URLs for production environments
3. **CORS configuration**: Ensure your backend API has proper CORS configuration for your frontend domain
4. **Client validation**: The Keycloak client should validate redirect URIs to prevent authorization code interception

## Troubleshooting

### Common Issues

1. **Authentication redirect loop**
   - Check that `VITE_OIDC_REDIRECT_URI` matches the configured redirect URI in Keycloak
   - Ensure the `/callback` route is accessible

2. **CORS errors**
   - Verify `VITE_API_BASE_URL` is correct
   - Check backend CORS configuration includes your frontend domain

3. **Build-time variable not applied**
   - Ensure variable names start with `VITE_`
   - Restart the development server after changing environment variables
   - For production, rebuild the application

4. **Token validation errors**
   - Verify `VITE_OIDC_ISSUER` URL is accessible and returns Keycloak's OIDC configuration
   - Check that the client is properly configured in Keycloak

### Environment Variable Validation

The application will validate environment variables on startup and show appropriate error messages if required variables are missing or invalid.

## Example Complete Configuration

### .env (Production)
```bash
# OIDC Configuration for production Keycloak
VITE_OIDC_ISSUER=https://auth.mycompany.com/realms/company
VITE_OIDC_CLIENT_ID=chatapp-frontend
VITE_OIDC_REDIRECT_URI=https://chat.mycompany.com/callback
VITE_OIDC_SCOPE=openid profile email

# Production API
VITE_API_BASE_URL=https://api.mycompany.com/api
```

This configuration assumes:
- Keycloak is running at `auth.mycompany.com`
- The realm is named `company`
- The client ID is `chatapp-frontend`
- The application is deployed at `chat.mycompany.com`
- The backend API is at `api.mycompany.com`