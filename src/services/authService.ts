// OIDC Authentication Service
// This service handles authentication with Keycloak using OIDC

export interface OIDCConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scope: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

export interface UserProfile {
  sub: string;
  name: string;
  email: string;
  preferred_username: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

class AuthService {
  private config: OIDCConfig;
  private tokens: AuthTokens | null = null;

  constructor() {
    this.config = {
      issuer: process.env.VITE_OIDC_ISSUER || '',
      clientId: process.env.VITE_OIDC_CLIENT_ID || '',
      redirectUri: process.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/callback`,
      scope: process.env.VITE_OIDC_SCOPE || 'openid profile email'
    };

    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  /**
   * Initiates the OIDC login flow
   */
  public async login(): Promise<void> {
    const state = this.generateRandomString(32);
    const nonce = this.generateRandomString(32);
    
    // Store state and nonce for validation
    sessionStorage.setItem('oidc_state', state);
    sessionStorage.setItem('oidc_nonce', nonce);

    const authUrl = new URL(`${this.config.issuer}/auth`);
    authUrl.searchParams.set('client_id', this.config.clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', this.config.scope);
    authUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);

    window.location.href = authUrl.toString();
  }

  /**
   * Handles the callback from the OIDC provider
   */
  public async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      // Validate state
      const storedState = sessionStorage.getItem('oidc_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch(`${this.config.issuer}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          code,
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const tokenData = await tokenResponse.json();
      
      this.tokens = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        idToken: tokenData.id_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
      };

      this.saveTokensToStorage();
      
      // Clean up session storage
      sessionStorage.removeItem('oidc_state');
      sessionStorage.removeItem('oidc_nonce');

      return true;
    } catch (error) {
      console.error('OIDC callback error:', error);
      return false;
    }
  }

  /**
   * Logs out the user
   */
  public async logout(): Promise<void> {
    const idToken = this.tokens?.idToken;
    
    // Clear local tokens
    this.tokens = null;
    localStorage.removeItem('oidc_tokens');

    // Redirect to OIDC logout endpoint
    if (idToken) {
      const logoutUrl = new URL(`${this.config.issuer}/logout`);
      logoutUrl.searchParams.set('id_token_hint', idToken);
      logoutUrl.searchParams.set('post_logout_redirect_uri', window.location.origin);
      
      window.location.href = logoutUrl.toString();
    } else {
      window.location.href = '/';
    }
  }

  /**
   * Gets the current access token, refreshing if necessary
   */
  public async getAccessToken(): Promise<string | null> {
    if (!this.tokens) {
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() > (this.tokens.expiresAt - 300000)) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        return null;
      }
    }

    return this.tokens.accessToken;
  }

  /**
   * Gets the user profile from the ID token
   */
  public getUserProfile(): UserProfile | null {
    if (!this.tokens?.idToken) {
      return null;
    }

    try {
      const payload = this.tokens.idToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded as UserProfile;
    } catch (error) {
      console.error('Failed to decode ID token:', error);
      return null;
    }
  }

  /**
   * Checks if the user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.tokens !== null && Date.now() < this.tokens.expiresAt;
  }

  private async refreshToken(): Promise<boolean> {
    if (!this.tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.issuer}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId,
          refresh_token: this.tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokenData = await response.json();
      
      this.tokens = {
        ...this.tokens,
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        ...(tokenData.refresh_token && { refreshToken: tokenData.refresh_token }),
      };

      this.saveTokensToStorage();
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.tokens = null;
      localStorage.removeItem('oidc_tokens');
      return false;
    }
  }

  private saveTokensToStorage(): void {
    if (this.tokens) {
      localStorage.setItem('oidc_tokens', JSON.stringify(this.tokens));
    }
  }

  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem('oidc_tokens');
      if (stored) {
        this.tokens = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
      localStorage.removeItem('oidc_tokens');
    }
  }

  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }
}

export const authService = new AuthService();