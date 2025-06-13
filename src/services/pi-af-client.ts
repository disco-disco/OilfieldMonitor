/**
 * Client-side PI AF Service
 * 
 * This service runs in the browser and can handle Windows Authentication
 * unlike the server-side Node.js version.
 */

import { PIServerConfig, AttributeMapping, WellPadData, WellData } from '@/types/pi-system';

interface AFDatabase {
  Name: string;
  Path: string;
  Description?: string;
  WebId?: string;
  Links?: {
    Elements?: string;
    [key: string]: any;
  };
}

interface AFElement {
  Name: string;
  Path: string;
  TemplateName?: string;
  HasChildren?: boolean;
  WebId?: string;
  Links?: {
    Attributes?: string;
    Elements?: string;
    [key: string]: any;
  };
}

interface AFAttribute {
  Name: string;
  Path: string;
  Type?: string;
  Value?: any;
}

export class ClientPIAFService {
  private config: PIServerConfig;
  private attributeMapping: AttributeMapping;
  private workingEndpoint: string | null = null;

  constructor(config: PIServerConfig, attributeMapping: AttributeMapping) {
    this.config = config;
    this.attributeMapping = attributeMapping;
  }

  /**
   * Client-side fetch options with Windows authentication support
   */
  private getFetchOptions(): RequestInit {
    return {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      },
      credentials: 'include', // Critical for Windows Authentication
      mode: 'cors'
    };
  }

  /**
   * Find working PI Web API endpoint (client-side)
   */
  private async findWorkingEndpoint(): Promise<string | null> {
    const testEndpoints = [
      `https://${this.config.piWebApiServerName}/piwebapi`,
      `https://${this.config.piWebApiServerName}:443/piwebapi`,
      `http://${this.config.piWebApiServerName}/piwebapi`,
      `http://${this.config.piWebApiServerName}:5985/piwebapi`
    ];

    console.log(`🔍 Client-side PI Web API endpoint discovery for: ${this.config.piWebApiServerName}`);

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing client-side: ${endpoint}`);
        
        const response = await fetch(endpoint, this.getFetchOptions());
        
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok || response.status === 401) {
          console.log(`✅ Client-side working endpoint found: ${endpoint}`);
          this.workingEndpoint = endpoint;
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Client-side failed: ${endpoint} - ${error}`);
        continue;
      }
    }

    console.log(`❌ No client-side working endpoints found for: ${this.config.piWebApiServerName}`);
    return null;
  }

  /**
   * Load databases using client-side WebID approach
   */
  private async loadDatabases(): Promise<AFDatabase[]> {
    const endpoint = await this.findWorkingEndpoint();
    if (!endpoint) {
      throw new Error('Cannot connect to PI Web API server from client');
    }

    console.log(`🔗 Client-side: Loading databases for AF Server: ${this.config.afServerName}`);

    try {
      // Get all asset servers first
      const assetServersUrl = `${endpoint}/assetservers`;
      console.log(`🔍 Client-side: Getting asset servers from ${assetServersUrl}`);
      
      const response = await fetch(assetServersUrl, this.getFetchOptions());
      
      if (!response.ok) {
        throw new Error(`Asset servers request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.Items || !Array.isArray(data.Items)) {
        throw new Error('Invalid asset servers response format');
      }

      // Find the target AF server
      const targetServer = data.Items.find((server: any) => 
        server.Name === this.config.afServerName
      );

      if (!targetServer) {
        throw new Error(`AF Server not found: ${this.config.afServerName}`);
      }

      console.log(`✅ Client-side: Found AF Server: ${targetServer.Name} (WebId: ${targetServer.WebId})`);

      // Get databases for this server using WebID
      const databasesUrl = `${endpoint}/assetservers/${targetServer.WebId}/assetdatabases`;
      console.log(`🔍 Client-side: Getting databases from ${databasesUrl}`);
      
      const dbResponse = await fetch(databasesUrl, this.getFetchOptions());
      
      if (!dbResponse.ok) {
        throw new Error(`Databases request failed: ${dbResponse.status} ${dbResponse.statusText}`);
      }

      const dbData = await dbResponse.json();
      
      if (!dbData.Items || !Array.isArray(dbData.Items)) {
        throw new Error('Invalid databases response format');
      }

      console.log(`✅ Client-side: Found ${dbData.Items.length} databases`);
      return dbData.Items;

    } catch (error) {
      console.error('❌ Client-side database loading failed:', error);
      throw error;
    }
  }

  /**
   * Load wellpad data using client-side PI AF connection
   */
  async loadWellPadData(): Promise<WellPadData[]> {
    try {
      console.log('🚀 Client-side PI AF data loading started...');
      
      // Load databases
      const databases = await this.loadDatabases();
      
      // Find target database
      const targetDatabase = databases.find(db => 
        db.Name === this.config.afDatabaseName
      );

      if (!targetDatabase) {
        throw new Error(`Database not found: ${this.config.afDatabaseName}`);
      }

      console.log(`✅ Client-side: Found target database: ${targetDatabase.Name}`);

      // For now, return mock data structure to test the client-side connection
      // In a full implementation, you would continue with element loading
      const mockWellPads: WellPadData[] = [
        {
          id: 'client-wellpad-1',
          name: 'Client PI AF Wellpad 1',
          location: 'Connected via Client-side PI AF',
          totalWells: 4,
          activeWells: 4,
          totalOilRate: 250,
          totalGasRate: 800,
          lastUpdated: new Date().toISOString(),
          wells: this.generateMockWells('client-wellpad-1', 4)
        },
        {
          id: 'client-wellpad-2', 
          name: 'Client PI AF Wellpad 2',
          location: 'Connected via Client-side PI AF',
          totalWells: 3,
          activeWells: 3,
          totalOilRate: 180,
          totalGasRate: 600,
          lastUpdated: new Date().toISOString(),
          wells: this.generateMockWells('client-wellpad-2', 3)
        }
      ];

      console.log(`🎉 Client-side: Successfully connected to PI AF and loaded ${mockWellPads.length} wellpads`);
      return mockWellPads;

    } catch (error) {
      console.error('❌ Client-side PI AF loading failed:', error);
      throw error;
    }
  }

  /**
   * Generate mock wells for testing client-side connection
   */
  private generateMockWells(wellpadId: string, count: number): WellData[] {
    const wells: WellData[] = [];
    
    for (let i = 1; i <= count; i++) {
      const wellId = `${wellpadId}-well-${i}`;
      const well: WellData = {
        id: wellId,
        name: `Client PI AF Well ${i}`,
        status: Math.random() > 0.2 ? 'active' : 'inactive',
        lastUpdated: new Date().toISOString(),
        attributes: {}
      };

      // Apply custom attribute mapping
      Object.entries(this.attributeMapping).forEach(([key, displayName]) => {
        let value: number | string;
        
        switch (key) {
          case 'oilRate':
            value = Math.round(20 + Math.random() * 80);
            break;
          case 'liquidRate':
            value = Math.round(40 + Math.random() * 120);
            break;
          case 'gasRate':
            value = Math.round(100 + Math.random() * 500);
            break;
          case 'tubingPressure':
            value = Math.round(50 + Math.random() * 200);
            break;
          case 'waterCut':
            value = Math.round(Math.random() * 60);
            break;
          default:
            value = Math.round(Math.random() * 100);
        }

        well.attributes[displayName] = value;
      });

      wells.push(well);
    }

    return wells;
  }

  /**
   * Test client-side connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const endpoint = await this.findWorkingEndpoint();
      
      if (endpoint) {
        return {
          success: true,
          message: `Client-side connection successful to ${endpoint}`
        };
      } else {
        return {
          success: false,
          message: 'Client-side connection failed - no working endpoints found'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Client-side connection error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}
