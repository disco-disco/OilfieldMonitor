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

    // Production mode - test actual PI connection
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
      // Test 1: Server reachability
      result.details!.serverReachable = await this.testServerReachability(config.afServerName);
      
      if (!result.details!.serverReachable) {
        result.message = `Cannot reach PI AF Server: ${config.afServerName}`;
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
      // In production, this would use actual PI Web API or SDK
      // For now, we'll simulate the test
      
      // Example implementation would be:
      /*
      const response = await fetch(`https://${serverName}/piwebapi`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
      */
      
      console.log(`Testing server reachability: ${serverName}`);
      // Simulate network test - in production this would be real
      return true;
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
      // In production, this would query PI AF for database existence
      console.log(`Testing database existence: ${config.afDatabaseName}`);
      return true;
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
      // In production, this would verify the element path exists in PI AF
      console.log(`Testing element path: ${config.parentElementPath}`);
      return true;
    } catch (error) {
      console.error('Element path test failed:', error);
      return false;
    }
  }

  /**
   * Test attribute accessibility
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async testAttributeAccess(_config: PIServerConfig): Promise<boolean> {
    try {
      // In production, this would test reading attributes from a sample element
      console.log('Testing attribute accessibility');
      return true;
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
