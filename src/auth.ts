import { LinearClient } from "@linear/sdk";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";

/**
 * Solution Attempts:
 *
 * 1. OAuth Flow with Browser (Initial Attempt)
 * - Used browser redirect and local server for OAuth flow
 * - Issues: Browser extensions interfering, CORS issues
 * - Status: Failed - Browser extensions and CORS blocking requests
 *
 * 2. Personal Access Token (Current Attempt)
 * - Using PAT for initial integration tests
 * - Simpler approach without browser interaction
 * - Status: Working - Successfully authenticates and makes API calls
 *
 * 3. Direct OAuth Token Exchange (Current Attempt)
 * - Using form-urlencoded content type as required by Linear
 * - Status: In Progress - Testing token exchange
 */

export interface OAuthConfig {
  type: "oauth";
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface PersonalAccessTokenConfig {
  type: "pat";
  accessToken: string;
}

export type AuthConfig = OAuthConfig | PersonalAccessTokenConfig;

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class LinearAuth {
  private static readonly OAUTH_AUTH_URL = "https://linear.app/oauth";
  private static readonly OAUTH_TOKEN_URL = "https://api.linear.app";
  private config?: AuthConfig;
  private tokenData?: TokenData;
  private linearClient?: LinearClient;

  constructor() {}

  public getAuthorizationUrl(): string {
    if (!this.config || this.config.type !== "oauth") {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "OAuth config not initialized"
      );
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: "read,write,issues:create,offline_access",
      actor: "application", // Enable OAuth Actor Authorization
      state: this.generateState(),
      access_type: "offline",
    });

    return `${LinearAuth.OAUTH_AUTH_URL}/authorize?${params.toString()}`;
  }

  public async handleCallback(code: string): Promise<void> {
    if (!this.config || this.config.type !== "oauth") {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "OAuth config not initialized"
      );
    }

    try {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        code,
        access_type: "offline",
      });

      const response = await fetch(
        `${LinearAuth.OAUTH_TOKEN_URL}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token request failed: ${response.statusText}. Response: ${errorText}`
        );
      }

      const data = await response.json();

      // Ensure the access token doesn't have a "Bearer" prefix
      const accessToken = data.access_token.startsWith("Bearer ")
        ? data.access_token.substring(7)
        : data.access_token;

      this.tokenData = {
        accessToken: accessToken,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      this.linearClient = new LinearClient({
        accessToken: this.tokenData.accessToken,
      });
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `OAuth token exchange failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async refreshAccessToken(): Promise<void> {
    if (
      !this.config ||
      this.config.type !== "oauth" ||
      !this.tokenData?.refreshToken
    ) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "OAuth not initialized or no refresh token available"
      );
    }

    try {
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.tokenData.refreshToken,
      });

      const response = await fetch(
        `${LinearAuth.OAUTH_TOKEN_URL}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Token refresh failed: ${response.statusText}. Response: ${errorText}`
        );
      }

      const data = await response.json();

      // Ensure the access token doesn't have a "Bearer" prefix
      const accessToken = data.access_token.startsWith("Bearer ")
        ? data.access_token.substring(7)
        : data.access_token;

      this.tokenData = {
        accessToken: accessToken,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      this.linearClient = new LinearClient({
        accessToken: this.tokenData.accessToken,
      });
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Token refresh failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public initialize(config: AuthConfig): void {
    if (config.type === "pat") {
      // Personal Access Token flow
      this.tokenData = {
        accessToken: config.accessToken,
        refreshToken: "", // Not needed for PAT
        expiresAt: Number.MAX_SAFE_INTEGER, // PATs don't expire
      };

      // Use apiKey instead of accessToken for PAT authentication
      this.linearClient = new LinearClient({
        apiKey: config.accessToken,
      });
    } else {
      // OAuth flow
      if (!config.clientId || !config.clientSecret || !config.redirectUri) {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Missing required OAuth parameters: clientId, clientSecret, redirectUri"
        );
      }
      this.config = config;
    }
  }

  public getClient(): LinearClient {
    if (!this.linearClient) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        "Linear client not initialized"
      );
    }
    return this.linearClient;
  }

  public isAuthenticated(): boolean {
    return !!this.linearClient && !!this.tokenData;
  }

  public needsTokenRefresh(): boolean {
    if (!this.tokenData || !this.config || this.config.type === "pat")
      return false;
    return Date.now() >= this.tokenData.expiresAt - 300000; // Refresh 5 minutes before expiry
  }

  // For testing purposes
  public setTokenData(tokenData: TokenData): void {
    this.tokenData = tokenData;

    // Use apiKey for PAT authentication if this is a PAT
    if (this.config?.type === "pat") {
      this.linearClient = new LinearClient({
        apiKey: tokenData.accessToken,
      });
    } else {
      // Otherwise use accessToken for OAuth
      this.linearClient = new LinearClient({
        accessToken: tokenData.accessToken,
      });
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
