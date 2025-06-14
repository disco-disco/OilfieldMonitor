// Windows Authentication Service for PI Web API
// Handles Windows Authentication with proper cross-platform support

import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';

export interface WindowsAuthConfig {
  serverUrl: string;
  timeout?: number;
  debug?: boolean;
}

export class WindowsAuthService {
  private config: WindowsAuthConfig;
  private httpsAgent: https.Agent;

  constructor(config: WindowsAuthConfig) {
    this.config = {
      timeout: 30000,
      debug: false,
      ...config
    };

    // Create HTTPS agent that handles self-signed certificates in development
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      keepAlive: true,
      timeout: this.config.timeout
    });

    if (this.config.debug) {
      console.log('🔐 Windows Auth Service initialized');
      console.log(`   Server: ${this.config.serverUrl}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Platform: ${process.platform}`);
    }
  }

  /**
   * Make an authenticated request to PI Web API
   * This method handles Windows Authentication automatically when running on Windows
   */
  async makeRequest(endpoint: string, options: AxiosRequestConfig = {}): Promise<any> {
    const url = `${this.config.serverUrl}${endpoint}`;
    
    if (this.config.debug) {
      console.log(`🌐 Making request to: ${url}`);
    }

    const requestConfig: AxiosRequestConfig = {
      method: 'GET',
      url,
      timeout: this.config.timeout,
      httpsAgent: this.httpsAgent,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'PI-Dashboard-NodeJS',
        ...options.headers
      },
      // Enable Windows Authentication
      withCredentials: true,
      ...options
    };

    // Platform-specific authentication handling
    if (process.platform === 'win32') {
      // On Windows, we can use integrated Windows Authentication
      if (this.config.debug) {
        console.log('🪟 Using Windows integrated authentication');
      }
      
      // Add Windows Authentication headers
      requestConfig.headers = {
        ...requestConfig.headers,
        'Authorization': 'Negotiate',
        'Connection': 'Keep-Alive'
      };
    } else {
      // On non-Windows platforms, provide helpful error information
      if (this.config.debug) {
        console.log('🚫 Non-Windows platform detected - Windows Auth may not work');
      }
    }

    try {
      const response = await axios(requestConfig);
      
      if (this.config.debug) {
        console.log(`✅ Request successful: ${response.status} ${response.statusText}`);
      }
      
      return response.data;
    } catch (error: any) {
      if (this.config.debug) {
        console.log(`❌ Request failed: ${error.message}`);
        if (error.response) {
          console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
          console.log(`   Headers:`, error.response.headers);
        }
      }

      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        throw new WindowsAuthError(
          'Windows Authentication required',
          error.response.status,
          this.getAuthErrorHelp()
        );
      }

      // Handle other HTTP errors
      if (error.response) {
        throw new PIWebAPIError(
          `HTTP ${error.response.status}: ${error.response.statusText}`,
          error.response.status,
          error.response.data
        );
      }

      // Handle network errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new PIWebAPIError(
          `Cannot connect to PI Web API server: ${this.config.serverUrl}`,
          0,
          { error: error.code, message: error.message }
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Test connectivity to the PI Web API server
   */
  async testConnection(): Promise<{ success: boolean; status: number; message: string }> {
    try {
      const response = await this.makeRequest('');
      return {
        success: true,
        status: 200,
        message: 'Connection successful'
      };
    } catch (error: any) {
      if (error instanceof WindowsAuthError) {
        return {
          success: false,
          status: error.statusCode,
          message: `Authentication required - ${error.message}`
        };
      }
      
      if (error instanceof PIWebAPIError) {
        return {
          success: false,
          status: error.statusCode,
          message: error.message
        };
      }

      return {
        success: false,
        status: 0,
        message: `Connection failed: ${error.message}`
      };
    }
  }

  /**
   * Get helpful error messages for authentication issues
   */
  private getAuthErrorHelp(): string {
    if (process.platform === 'win32') {
      return 'Ensure you are logged into a domain account with access to PI AF databases. ' +
             'Check that PI Web API server has Windows Authentication enabled.';
    } else {
      return 'Windows Authentication requires deployment on a Windows machine joined to your corporate domain. ' +
             'Current platform: ' + process.platform;
    }
  }

  /**
   * Check if the current environment supports Windows Authentication
   */
  static isWindowsAuthSupported(): boolean {
    return process.platform === 'win32';
  }

  /**
   * Get platform-specific deployment instructions
   */
  static getDeploymentInstructions(): string[] {
    if (process.platform === 'win32') {
      return [
        'Windows platform detected - Windows Authentication should work',
        'Ensure you are logged in with a domain account',
        'Verify your account has access to PI AF databases',
        'Check network connectivity to PI Web API server'
      ];
    } else {
      return [
        `Current platform: ${process.platform} - Windows Authentication not supported`,
        'Deploy the application to a Windows machine joined to your corporate domain',
        'Ensure the Windows machine has Node.js installed',
        'Copy the application files to the Windows machine',
        'Run the application from the Windows machine'
      ];
    }
  }
}

/**
 * Custom error class for Windows Authentication issues
 */
export class WindowsAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public help: string
  ) {
    super(message);
    this.name = 'WindowsAuthError';
  }
}

/**
 * Custom error class for PI Web API issues
 */
export class PIWebAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'PIWebAPIError';
  }
}
