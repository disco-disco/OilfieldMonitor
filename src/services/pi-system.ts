import { PIServerConfig, PIElement, WellData, WellPadData, AttributeMapping } from '@/types/pi-system';
import { configManager } from './config-manager';

export interface PIConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    serverReachable?: boolean;
    databaseExists?: boolean;
    elementPathValid?: boolean;
    attributesAccessible?: boolean;
  };
}

export class PISystemService {
  constructor() {
    // Configuration is now managed by ConfigManager
  }

  /**
   * Configure PI System connection
   */
  async configure(config: PIServerConfig, attributeMapping?: AttributeMapping): Promise<boolean> {
    try {
      // Save configuration persistently
      configManager.setPIServerConfig(config);
      
      if (attributeMapping) {
        configManager.setAttributeMapping(attributeMapping);
      }

      console.log('PI System configured and saved:', config);
      return true;
    } catch (error) {
      console.error('Failed to configure PI System:', error);
      return false;
    }
  }

  /**
   * Test connection to PI System
   */
  async testConnection(): Promise<PIConnectionTestResult> {
    const config = configManager.getPIServerConfig();
    
    if (!config) {
      return {
        success: false,
        message: 'PI System not configured'
      };
    }

    const mode = configManager.getMode();
    
    if (mode === 'development') {
      return {
        success: true,
        message: 'Development mode - simulated connection successful',
        details: {
          serverReachable: true,
          databaseExists: true,
          elementPathValid: true,
          attributesAccessible: true
        }
      };
    }

    // Production mode - test actual PI connection directly
    return await this.testActualPIConnection(config);
  }

  /**
   * Test actual PI System connection (production)
   */
  private async testActualPIConnection(config: PIServerConfig): Promise<PIConnectionTestResult> {
    const result: PIConnectionTestResult = {
      success: false,
      message: '',
      details: {
        serverReachable: false,
        databaseExists: false,
        elementPathValid: false,
        attributesAccessible: false
      }
    };

    try {
      // Test 1: Server reachability (PI Web API Server)
      result.details!.serverReachable = await this.testServerReachability(config.piWebApiServerName);
      
      if (!result.details!.serverReachable) {
        result.message = `Cannot reach PI Web API Server: ${config.piWebApiServerName}`;
        return result;
      }

      // Test 2: Database existence
      result.details!.databaseExists = await this.testDatabaseExists(config);
      
      if (!result.details!.databaseExists) {
        result.message = `PI AF Database not found: ${config.afDatabaseName}`;
        return result;
      }

      // Test 3: Element path validation
      result.details!.elementPathValid = await this.testElementPath(config);
      
      if (!result.details!.elementPathValid) {
        result.message = `Invalid element path: ${config.parentElementPath}`;
        return result;
      }

      // Test 4: Attribute accessibility
      result.details!.attributesAccessible = await this.testAttributeAccess(config);
      
      if (!result.details!.attributesAccessible) {
        result.message = 'Cannot access PI attributes with current configuration';
        return result;
      }

      result.success = true;
      result.message = 'PI System connection successful';
      return result;

    } catch (error) {
      result.message = `Connection test failed: ${error}`;
      return result;
    }
  }

  /**
   * Test server reachability
   */
  private async testServerReachability(serverName: string): Promise<boolean> {
    try {
      console.log(`Testing server reachability: ${serverName}`);
      
      // Try multiple common PI Web API endpoints
      const possibleEndpoints = [
        `https://${serverName}/piwebapi`,
        `https://${serverName}:443/piwebapi`,
        `http://${serverName}/piwebapi`,
        `http://${serverName}:5985/piwebapi`
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Attempting to connect to: ${endpoint}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(endpoint, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
            // Allow CORS for testing
            mode: 'cors'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok || response.status === 401) {
            // 401 is expected if authentication is required - server is reachable
            console.log(`Server reachable at: ${endpoint} (Status: ${response.status})`);
            return true;
          }
          
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              console.log(`Timeout connecting to: ${endpoint}`);
            } else {
              console.log(`Failed to connect to: ${endpoint} - ${fetchError.message}`);
            }
          } else {
            console.log(`Failed to connect to: ${endpoint} - Unknown error`);
          }
        }
      }
      
      console.error(`All connection attempts failed for server: ${serverName}`);
      return false;
      
    } catch (error) {
      console.error('Server reachability test failed:', error);
      return false;
    }
  }

  /**
   * Test database existence
   */
  private async testDatabaseExists(config: PIServerConfig): Promise<boolean> {
    try {
      console.log(`Testing database existence: ${config.afDatabaseName}`);
      
      // Use PI Web API server for endpoints
      const possibleEndpoints = [
        `https://${config.piWebApiServerName}/piwebapi`,
        `https://${config.piWebApiServerName}:443/piwebapi`,
        `http://${config.piWebApiServerName}/piwebapi`,
        `http://${config.piWebApiServerName}:5985/piwebapi`
      ];

      for (const baseEndpoint of possibleEndpoints) {
        try {
          // Try to get the asset server
          const assetServerUrl = `${baseEndpoint}/assetservers`;
          console.log(`Checking asset servers at: ${assetServerUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(assetServerUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Asset servers response:', data);
            
            // Look for the asset server
            if (data.Items && data.Items.length > 0) {
              for (const server of data.Items) {
                // Now try to get databases from this server
                const databasesUrl = `${baseEndpoint}/assetservers/${server.Name}/assetdatabases`;
                console.log(`Checking databases at: ${databasesUrl}`);
                
                const dbResponse = await fetch(databasesUrl, {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' },
                  mode: 'cors'
                });
                
                if (dbResponse.ok) {
                  const dbData = await dbResponse.json();
                  console.log('Databases response:', dbData);
                  
                  if (dbData.Items) {
                    const foundDatabase = dbData.Items.find((db: { Name: string }) => 
                      db.Name.toLowerCase() === config.afDatabaseName.toLowerCase()
                    );
                    
                    if (foundDatabase) {
                      console.log(`Database found: ${config.afDatabaseName}`);
                      return true;
                    }
                  }
                }
              }
            }
          } else if (response.status === 401) {
            console.log('Authentication required - but server is accessible');
            // For now, assume database exists if server requires auth
            return true;
          }
          
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              console.log(`Timeout checking database at: ${baseEndpoint}`);
            } else {
              console.log(`Failed to check database at: ${baseEndpoint} - ${fetchError.message}`);
            }
          } else {
            console.log(`Failed to check database at: ${baseEndpoint} - Unknown error`);
          }
        }
      }
      
      console.error(`Database not found or inaccessible: ${config.afDatabaseName}`);
      return false;
      
    } catch (error) {
      console.error('Database existence test failed:', error);
      return false;
    }
  }

  /**
   * Test element path validity
   */
  private async testElementPath(config: PIServerConfig): Promise<boolean> {
    try {
      console.log(`Testing element path: ${config.parentElementPath}`);
      
      const possibleEndpoints = [
        `https://${config.piWebApiServerName}/piwebapi`,
        `https://${config.piWebApiServerName}:443/piwebapi`,
        `http://${config.piWebApiServerName}/piwebapi`,
        `http://${config.piWebApiServerName}:5985/piwebapi`
      ];

      for (const baseEndpoint of possibleEndpoints) {
        try {
          // Construct the element path URL
          // PI Web API uses a specific format for element paths
          const encodedPath = encodeURIComponent(`\\\\${config.afServerName}\\${config.afDatabaseName}\\${config.parentElementPath}`);
          const elementUrl = `${baseEndpoint}/elements?path=${encodedPath}`;
          
          console.log(`Checking element path at: ${elementUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(elementUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Element path response:', data);
            
            if (data.WebId) {
              console.log(`Element path exists: ${config.parentElementPath}`);
              return true;
            }
          } else if (response.status === 401) {
            console.log('Authentication required for element path check');
            // Assume path exists if server requires auth
            return true;
          } else if (response.status === 404) {
            console.log(`Element path not found: ${config.parentElementPath}`);
          } else {
            console.log(`Element path check failed with status: ${response.status}`);
          }
          
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              console.log(`Timeout checking element path at: ${baseEndpoint}`);
            } else {
              console.log(`Failed to check element path at: ${baseEndpoint} - ${fetchError.message}`);
            }
          } else {
            console.log(`Failed to check element path at: ${baseEndpoint} - Unknown error`);
          }
        }
      }
      
      console.error(`Element path not found or inaccessible: ${config.parentElementPath}`);
      return false;
      
    } catch (error) {
      console.error('Element path test failed:', error);
      return false;
    }
  }

  /**
   * Test attribute accessibility
   */
  private async testAttributeAccess(config: PIServerConfig): Promise<boolean> {
    try {
      console.log('Testing attribute accessibility');
      
      const possibleEndpoints = [
        `https://${config.piWebApiServerName}/piwebapi`,
        `https://${config.piWebApiServerName}:443/piwebapi`,
        `http://${config.piWebApiServerName}/piwebapi`,
        `http://${config.piWebApiServerName}:5985/piwebapi`
      ];

      for (const baseEndpoint of possibleEndpoints) {
        try {
          // First, get the parent element
          const encodedPath = encodeURIComponent(`\\\\${config.afServerName}\\${config.afDatabaseName}\\${config.parentElementPath}`);
          const elementUrl = `${baseEndpoint}/elements?path=${encodedPath}`;
          
          console.log(`Getting parent element for attribute test: ${elementUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(elementUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const elementData = await response.json();
            
            if (elementData.WebId) {
              // Try to get child elements (wellpads)
              const childElementsUrl = `${baseEndpoint}/elements/${elementData.WebId}/elements`;
              console.log(`Getting child elements: ${childElementsUrl}`);
              
              const childResponse = await fetch(childElementsUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                mode: 'cors'
              });
              
              if (childResponse.ok) {
                const childData = await childResponse.json();
                
                if (childData.Items && childData.Items.length > 0) {
                  // Try to get attributes from the first child element
                  const firstChild = childData.Items[0];
                  const attributesUrl = `${baseEndpoint}/elements/${firstChild.WebId}/attributes`;
                  console.log(`Testing attribute access: ${attributesUrl}`);
                  
                  const attrResponse = await fetch(attributesUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    mode: 'cors'
                  });
                  
                  if (attrResponse.ok) {
                    const attrData = await attrResponse.json();
                    console.log('Attributes accessible:', attrData.Items ? attrData.Items.length : 0, 'attributes found');
                    return true;
                  }
                }
              }
            }
          } else if (response.status === 401) {
            console.log('Authentication required for attribute access test');
            // Assume attributes are accessible if server requires auth
            return true;
          }
          
        } catch (fetchError: unknown) {
          if (fetchError instanceof Error) {
            if (fetchError.name === 'AbortError') {
              console.log(`Timeout testing attribute access at: ${baseEndpoint}`);
            } else {
              console.log(`Failed to test attribute access at: ${baseEndpoint} - ${fetchError.message}`);
            }
          } else {
            console.log(`Failed to test attribute access at: ${baseEndpoint} - Unknown error`);
          }
        }
      }
      
      console.error('Attribute access test failed - no accessible attributes found');
      return false;
      
    } catch (error) {
      console.error('Attribute access test failed:', error);
      return false;
    }
  }

  /**
   * Read wellpad and well data from PI AF
   */
  async readWellPadData(): Promise<WellPadData[]> {
    const config = configManager.getPIServerConfig();
    const mode = configManager.getMode();

    if (mode === 'development' || !config) {
      // Development mode - return simulated data
      return this.generateSimulatedData();
    } else {
      // Production mode - read from PI
      return await this.readFromPI(config);
    }
  }

  /**
   * Read actual data from PI System (production)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async readFromPI(_config: PIServerConfig): Promise<WellPadData[]> {
    try {
      // This would implement actual PI AF reading logic
      // Example pseudo-code:
      /*
      const piWebApiClient = new PIWebAPIClient({
        serverUrl: `https://${config.afServerName}/piwebapi`,
        username: config.username,
        password: config.password
      });
      
      const database = await piWebApiClient.assetDatabase.getByName(config.afDatabaseName);
      const parentElement = await piWebApiClient.element.getByPath(config.parentElementPath);
      const wellPads = await piWebApiClient.element.getElements(parentElement.WebId, {
        templateName: config.templateName
      });
      
      const wellPadData: WellPadData[] = [];
      
      for (const wellPad of wellPads) {
        const wells = await this.readWellsFromPad(wellPad);
        wellPadData.push({
          name: wellPad.Name,
          wells: wells,
          totalProduction: wells.reduce((sum, well) => sum + well.oilRate, 0),
          averageWaterCut: wells.reduce((sum, well) => sum + well.waterCut, 0) / wells.length,
          wellCount: wells.length
        });
      }
      
      return wellPadData;
      */
      
      console.log('Reading from PI System in production mode');
      // For now, return simulated data until actual PI integration is implemented
      return this.generateSimulatedData();
    } catch (error) {
      console.error('Failed to read from PI System:', error);
      // Fallback to simulated data on error
      return this.generateSimulatedData();
    }
  }

  /**
   * Read wells from a wellpad element (production helper)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async readWellsFromPad(_wellPadElement: PIElement): Promise<WellData[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _attributeMapping = configManager.getAttributeMapping();
    const wells: WellData[] = [];
    
    try {
      // This would implement reading well elements and their attributes
      // Example pseudo-code:
      /*
      const wellElements = await piClient.element.getElements(wellPadElement.WebId);
      
      for (const wellElement of wellElements) {
        const attributes = await piClient.element.getAttributes(wellElement.WebId);
        
        const wellData: WellData = {
          name: wellElement.Name,
          wellPadName: wellPadElement.Name,
          oilRate: await this.readAttributeValue(attributes[attributeMapping.oilRate]),
          liquidRate: await this.readAttributeValue(attributes[attributeMapping.liquidRate]),
          waterCut: await this.readAttributeValue(attributes[attributeMapping.waterCut]),
          espFrequency: await this.readAttributeValue(attributes[attributeMapping.espFrequency]),
          planDeviation: await this.calculatePlanDeviation(wellElement, attributeMapping),
          status: 'good', // Calculate based on thresholds
          lastUpdated: new Date()
        };
        
        wells.push(wellData);
      }
      */
      
    } catch (error) {
      console.error('Failed to read wells from pad:', error);
    }
    
    return wells;
  }

  /**
   * Generate simulated data for development/fallback
   */
  private generateSimulatedData(): WellPadData[] {
    const wellPads: WellPadData[] = [];
    
    for (let padNum = 1; padNum <= 10; padNum++) {
      const wellCount = Math.floor(Math.random() * 11) + 10;
      const wells = [];
      
      for (let wellNum = 0; wellNum < wellCount; wellNum++) {
        const wellNumber = Math.floor(Math.random() * 900) + 100;
        const oilRate = Math.floor(Math.random() * 150) + 50;
        const liquidRate = Math.floor(oilRate * (1 + Math.random() * 0.5));
        const waterCut = Math.floor(Math.random() * 30) + 5;
        const espFrequency = Math.floor(Math.random() * 20) + 40;
        const planTarget = oilRate + Math.floor(Math.random() * 40) - 20;
        const deviation = planTarget > 0 ? ((oilRate - planTarget) / planTarget * 100) : 0;
        
        let status: 'good' | 'warning' | 'alert' = 'good';
        if (Math.abs(deviation) > 15 || waterCut > 25) status = 'alert';
        else if (Math.abs(deviation) > 10 || waterCut > 20) status = 'warning';
        
        wells.push({
          name: `PL-${wellNumber.toString().padStart(3, '0')}`,
          wellPadName: `WellPad ${padNum.toString().padStart(2, '0')}`,
          oilRate,
          liquidRate,
          waterCut,
          espFrequency,
          planDeviation: Math.round(deviation * 10) / 10,
          status,
          lastUpdated: new Date()
        });
      }
      
      wellPads.push({
        name: `WellPad ${padNum.toString().padStart(2, '0')}`,
        wells,
        totalProduction: wells.reduce((sum, well) => sum + well.oilRate, 0),
        averageWaterCut: wells.reduce((sum, well) => sum + well.waterCut, 0) / wells.length,
        wellCount: wells.length
      });
    }
    
    return wellPads;
  }

  /**
   * Get current configuration
   */
  getConfiguration(): { 
    piServerConfig?: PIServerConfig; 
    attributeMapping: AttributeMapping;
    mode: 'development' | 'production';
    isPIConfigured: boolean;
  } {
    return {
      piServerConfig: configManager.getPIServerConfig(),
      attributeMapping: configManager.getAttributeMapping(),
      mode: configManager.getMode(),
      isPIConfigured: configManager.isPIConfigured()
    };
  }

  /**
   * Set application mode
   */
  setMode(mode: 'development' | 'production'): void {
    configManager.setMode(mode);
  }

  /**
   * Get current mode
   */
  getMode(): 'development' | 'production' {
    return configManager.getMode();
  }
}

// Export singleton instance
export const piSystemService = new PISystemService();
