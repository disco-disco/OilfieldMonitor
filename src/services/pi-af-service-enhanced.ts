// Enhanced PI Asset Framework Service with Windows Authentication
// This service provides proper Windows Auth integration for PI Web API

import { WellPadData, WellData, PIServerConfig, AttributeMapping, DEFAULT_ATTRIBUTE_MAPPING } from '@/types/pi-system';
import { WindowsAuthService, WindowsAuthError, PIWebAPIError } from './windows-auth-service';

// Disable SSL certificate verification for development to handle self-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('🔓 SSL certificate verification disabled for development');
}

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
  Value?: {
    Value?: any;
    Timestamp?: string;
  };
  WebId?: string;
}

export class PIAFService {
  private config: PIServerConfig;
  private workingEndpoint: string | null = null;
  private attributeMapping: AttributeMapping;
  private authService: WindowsAuthService | null = null;

  constructor(config: PIServerConfig, attributeMapping?: AttributeMapping) {
    this.config = config;
    this.attributeMapping = attributeMapping || DEFAULT_ATTRIBUTE_MAPPING;
    console.log('🎯 PI AF Service initialized with configuration:');
    console.log(`   - AF Server: ${config.afServerName}`);
    console.log(`   - Database: ${config.afDatabaseName}`);
    console.log(`   - Element Path: ${config.parentElementPath}`);
    console.log(`   - Template Filter: ${config.templateName || 'None (processing all elements)'}`);
    console.log('🎯 Attribute mapping:', this.attributeMapping);
    
    // Log Windows Authentication support
    if (WindowsAuthService.isWindowsAuthSupported()) {
      console.log('🪟 Windows Authentication supported on this platform');
    } else {
      console.log('🚫 Windows Authentication not supported on this platform');
      console.log('📋 Deployment instructions:');
      WindowsAuthService.getDeploymentInstructions().forEach(instruction => {
        console.log(`   - ${instruction}`);
      });
    }
  }

  // Initialize Windows Authentication Service
  private async initializeAuthService(): Promise<void> {
    if (!this.authService) {
      // Find the working endpoint first
      const endpoint = await this.findWorkingEndpoint();
      if (!endpoint) {
        throw new Error('Cannot connect to PI Web API server');
      }

      this.authService = new WindowsAuthService({
        serverUrl: endpoint,
        timeout: 30000,
        debug: true
      });

      console.log('🔐 Windows Authentication service initialized');
    }
  }

  // Make authenticated request using Windows Authentication
  private async makeAuthenticatedRequest(endpoint: string): Promise<any> {
    await this.initializeAuthService();
    
    if (!this.authService) {
      throw new Error('Authentication service not initialized');
    }

    try {
      return await this.authService.makeRequest(endpoint);
    } catch (error) {
      if (error instanceof WindowsAuthError) {
        console.error('🚫 Windows Authentication failed:', error.message);
        console.log('💡 Help:', error.help);
        throw new Error(`Windows Authentication required: ${error.message}`);
      }
      
      if (error instanceof PIWebAPIError) {
        console.error('❌ PI Web API error:', error.message);
        throw new Error(`PI Web API error: ${error.message}`);
      }
      
      throw error;
    }
  }

  // Find working PI Web API endpoint
  private async findWorkingEndpoint(): Promise<string | null> {
    if (this.workingEndpoint) {
      return this.workingEndpoint;
    }

    const testEndpoints = [
      `https://${this.config.piWebApiServerName}/piwebapi`,
      `https://${this.config.piWebApiServerName}:443/piwebapi`,
      `http://${this.config.piWebApiServerName}/piwebapi`,
      // Additional common PI Web API paths
      `https://${this.config.piWebApiServerName}/PIWebAPI`,
      `http://${this.config.piWebApiServerName}/PIWebAPI`,
      `https://${this.config.piWebApiServerName}:5985/piwebapi`,
      `http://${this.config.piWebApiServerName}:5985/piwebapi`,
      // IIS default paths
      `https://${this.config.piWebApiServerName}/piwebapi2018`,
      `http://${this.config.piWebApiServerName}/piwebapi2018`,
      `https://${this.config.piWebApiServerName}/piwebapi2019`,
      `http://${this.config.piWebApiServerName}/piwebapi2019`
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing PI Web API at: ${endpoint}`);
        
        // Create a temporary auth service for testing
        const testAuthService = new WindowsAuthService({
          serverUrl: endpoint,
          timeout: 10000,
          debug: false
        });

        const connectionTest = await testAuthService.testConnection();
        console.log(`   Status: ${connectionTest.status} - ${connectionTest.message}`);

        // Success conditions: 
        // - 200 OK (working)
        // - 401 Unauthorized (working but needs auth)
        // - 403 Forbidden (working but needs permission)
        if (connectionTest.success || connectionTest.status === 401 || connectionTest.status === 403) {
          this.workingEndpoint = endpoint;
          console.log(`✅ Working endpoint found: ${endpoint} (Status: ${connectionTest.status})`);
          return endpoint;
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${endpoint} - ${error}`);
        continue;
      }
    }

    console.error(`❌ Cannot reach PI Web API Server: ${this.config.piWebApiServerName}`);
    console.log(`💡 Troubleshooting tips:`);
    console.log(`   1. Verify PI Web API server name: ${this.config.piWebApiServerName}`);
    console.log(`   2. Check if PI Web API service is running`);
    console.log(`   3. Verify network connectivity to the server`);
    console.log(`   4. Check if Windows Authentication is properly configured`);
    console.log(`   5. Ensure PI Web API is installed and configured on the server`);
    
    // Add platform-specific guidance
    if (!WindowsAuthService.isWindowsAuthSupported()) {
      console.log(`   6. Deploy to Windows for proper authentication support`);
    }
    
    return null;
  }

  // Load databases with Windows Authentication
  private async loadDatabases(): Promise<AFDatabase[]> {
    console.log(`🔗 Loading databases using Windows Authentication for AF Server: ${this.config.afServerName}`);

    try {
      // Step 1: Get all asset servers first
      console.log(`🔍 Step 1: Getting all asset servers`);
      const serversData = await this.makeAuthenticatedRequest('/assetservers');
      
      if (!serversData.Items || !Array.isArray(serversData.Items)) {
        console.log(`❌ No asset servers found in response`);
        throw new Error('No asset servers found');
      }

      console.log(`📋 Found ${serversData.Items.length} asset servers:`);
      serversData.Items.forEach((server: any, index: number) => {
        console.log(`   ${index + 1}. Name: "${server.Name}", WebId: "${server.WebId}"`);
      });

      // Step 2: Find the specific AF server we're looking for
      const targetServer = serversData.Items.find((server: any) => 
        server.Name === this.config.afServerName || 
        server.Name.toLowerCase() === this.config.afServerName.toLowerCase()
      );

      if (!targetServer) {
        const availableServers = serversData.Items.map((s: any) => s.Name).join(', ');
        console.log(`❌ AF Server '${this.config.afServerName}' not found`);
        console.log(`   Available servers: ${availableServers}`);
        throw new Error(`AF Server '${this.config.afServerName}' not found. Available: ${availableServers}`);
      }

      console.log(`🎯 Found target AF Server: "${targetServer.Name}" (WebId: ${targetServer.WebId})`);

      // Step 3: Get databases for the specific server using its WebID
      console.log(`🔍 Step 2: Getting databases from server`);
      const databasesData = await this.makeAuthenticatedRequest(`/assetservers/${targetServer.WebId}/assetdatabases`);
      
      if (!databasesData.Items || !Array.isArray(databasesData.Items)) {
        console.log(`❌ No databases found for server '${targetServer.Name}'`);
        throw new Error(`No databases found for server '${targetServer.Name}'`);
      }

      console.log(`📋 Found ${databasesData.Items.length} databases on server '${targetServer.Name}':`);
      databasesData.Items.forEach((db: any, index: number) => {
        console.log(`   ${index + 1}. Name: "${db.Name}", WebId: "${db.WebId}"`);
      });

      return databasesData.Items;

    } catch (error) {
      console.error(`❌ Database loading failed:`, error);
      throw error;
    }
  }

  // Load elements from a database
  private async loadDatabaseElements(database: AFDatabase): Promise<AFElement[]> {
    console.log(`🔗 Loading elements from database: "${database.Name}" (WebId: ${database.WebId})`);

    try {
      const elementsData = await this.makeAuthenticatedRequest(`/assetdatabases/${database.WebId}/elements`);
      
      if (!elementsData.Items || !Array.isArray(elementsData.Items)) {
        console.log(`❌ No elements found for database "${database.Name}"`);
        return [];
      }

      console.log(`📋 Found ${elementsData.Items.length} elements in database "${database.Name}"`);
      return elementsData.Items;

    } catch (error) {
      console.error(`❌ Failed to load elements from database "${database.Name}":`, error);
      return [];
    }
  }

  // Load child elements from a parent element
  private async loadChildElements(parentElement: AFElement): Promise<AFElement[]> {
    console.log(`🔗 Loading child elements from: "${parentElement.Name}" (WebId: ${parentElement.WebId})`);

    try {
      const elementsData = await this.makeAuthenticatedRequest(`/elements/${parentElement.WebId}/elements`);
      
      if (!elementsData.Items || !Array.isArray(elementsData.Items)) {
        console.log(`❌ No child elements found for "${parentElement.Name}"`);
        return [];
      }

      console.log(`📋 Found ${elementsData.Items.length} child elements in "${parentElement.Name}"`);
      return elementsData.Items;

    } catch (error) {
      console.error(`❌ Failed to load child elements from "${parentElement.Name}":`, error);
      return [];
    }
  }

  // Navigate through nested element path
  private async navigateToNestedElement(database: AFDatabase, elementPath: string): Promise<AFElement[]> {
    console.log(`🧭 NAVIGATING TO NESTED PATH: "${elementPath}"`);
    
    const pathSegments = elementPath.split('\\').filter(segment => segment.trim() !== '');
    console.log(`Path segments: [${pathSegments.map(s => `"${s}"`).join(', ')}]`);

    let currentElements = await this.loadDatabaseElements(database);
    
    // Navigate through each path segment
    for (let i = 0; i < pathSegments.length && i < 10; i++) { // MAX 10 levels deep
      const segmentName = pathSegments[i];
      console.log(`🔍 Looking for segment "${segmentName}" in ${currentElements.length} elements`);
      
      const matchingElement = currentElements.find(el => 
        el.Name === segmentName || 
        el.Name.toLowerCase() === segmentName.toLowerCase()
      );
      
      if (!matchingElement) {
        console.log(`❌ Path segment "${segmentName}" not found in path "${elementPath}"`);
        return [];
      }

      console.log(`✅ Found "${segmentName}" (WebId: ${matchingElement.WebId})`);
      
      // If this is the last segment, return its children
      if (i === pathSegments.length - 1) {
        console.log(`🎯 Final segment reached, loading children of "${segmentName}"`);
        return await this.loadChildElements(matchingElement);
      }
      
      // Otherwise, continue to children
      currentElements = await this.loadChildElements(matchingElement);
    }

    return currentElements;
  }

  // Load attributes from an element
  private async loadElementAttributes(element: AFElement): Promise<AFAttribute[]> {
    console.log(`🔗 Loading attributes from element: "${element.Name}" (WebId: ${element.WebId})`);

    try {
      const attributesData = await this.makeAuthenticatedRequest(`/elements/${element.WebId}/attributes`);
      
      if (!attributesData.Items || !Array.isArray(attributesData.Items)) {
        console.log(`❌ No attributes found for element "${element.Name}"`);
        return [];
      }

      console.log(`📋 Found ${attributesData.Items.length} attributes in element "${element.Name}"`);
      return attributesData.Items;

    } catch (error) {
      console.error(`❌ Failed to load attributes from element "${element.Name}":`, error);
      return [];
    }
  }

  // Main method to load wellpad data
  async loadWellPadData(): Promise<WellPadData[]> {
    console.log('🚀 Starting wellpad data loading process');
    const result: WellPadData[] = [];

    try {
      // 1. Load databases
      const databases = await this.loadDatabases();
      
      // 2. Find target database
      const targetDb = databases.find(db =>
        db.Name === this.config.afDatabaseName ||
        db.Name.toLowerCase() === this.config.afDatabaseName.toLowerCase()
      );

      if (!targetDb) {
        const availableDbs = databases.map(db => db.Name).join(', ');
        throw new Error(`Database '${this.config.afDatabaseName}' not found. Available: ${availableDbs}`);
      }

      console.log(`🎯 Found target database: "${targetDb.Name}"`);

      // 3. Navigate to wellpads
      let wellpadElements: AFElement[];
      if (this.config.parentElementPath && this.config.parentElementPath.trim() !== '') {
        console.log(`🧭 Using nested navigation to: "${this.config.parentElementPath}"`);
        wellpadElements = await this.navigateToNestedElement(targetDb, this.config.parentElementPath);
      } else {
        console.log(`📋 Loading root elements from database`);
        wellpadElements = await this.loadDatabaseElements(targetDb);
      }

      console.log(`📊 Found ${wellpadElements.length} wellpad elements`);

      // 4. Process wellpads with strict limits
      for (let i = 0; i < Math.min(wellpadElements.length, 10); i++) {
        const wellpadElement = wellpadElements[i];
        console.log(`\n🏭 Processing wellpad: "${wellpadElement.Name}"`);
        
        try {
          // Get wells from this wellpad
          const wellElements = await this.loadChildElements(wellpadElement);
          
          // Apply template filtering if configured
          let filteredWellElements = wellElements;
          if (this.config.templateName && this.config.templateName.trim() !== '') {
            filteredWellElements = wellElements.filter(el =>
              el.TemplateName && 
              el.TemplateName.toLowerCase() === this.config.templateName.toLowerCase()
            );
            console.log(`🎯 Filtered ${wellElements.length} → ${filteredWellElements.length} wells by template "${this.config.templateName}"`);
          }

          // Process wells
          const wells: WellData[] = [];
          for (let j = 0; j < Math.min(filteredWellElements.length, 20); j++) {
            const wellElement = filteredWellElements[j];
            console.log(`  🛢️ Processing well: "${wellElement.Name}"`);
            
            try {
              const attributes = await this.loadElementAttributes(wellElement);
              const wellData = this.mapAttributesToWellData(wellElement, attributes);
              if (wellData) {
                wells.push(wellData);
              }
            } catch (wellError) {
              console.error(`❌ Failed to process well "${wellElement.Name}":`, wellError);
            }
          }

          // Create wellpad summary
          if (wells.length > 0) {
            const wellPadData: WellPadData = {
              id: wellpadElement.WebId || `wellpad-${i}`,
              name: wellpadElement.Name,
              location: wellpadElement.Path || 'Unknown',
              wells: wells,
              totalOilRate: wells.reduce((sum, w) => sum + w.oilRate, 0),
              totalGasRate: wells.reduce((sum, w) => sum + (w.gasRate || 0), 0),
              totalWaterRate: wells.reduce((sum, w) => sum + (w.waterRate || 0), 0),
              averagePressure: wells.reduce((sum, w) => sum + (w.tubingPressure || 0), 0) / wells.length,
              lastUpdated: new Date().toISOString(),
              status: wells.some(w => w.status === 'alert') ? 'alert' :
                     wells.some(w => w.status === 'warning') ? 'warning' : 'good',
              totalWells: wells.length,
              activeWells: wells.filter(w => w.status === 'active').length,
              avgOilRate: wells.reduce((sum, w) => sum + w.oilRate, 0) / wells.length,
              avgWaterCut: wells.reduce((sum, w) => sum + w.waterCut, 0) / wells.length
            };
            
            result.push(wellPadData);
            console.log(`✅ Wellpad "${wellpadElement.Name}" processed: ${wells.length} wells`);
          }
        } catch (wellpadError) {
          console.error(`❌ Failed to process wellpad "${wellpadElement.Name}":`, wellpadError);
        }
      }

      console.log(`📊 Final result: ${result.length} wellpads processed`);
      return result;

    } catch (error) {
      console.error(`❌ Wellpad data loading failed:`, error);
      throw error;
    }
  }

  // Map PI attributes to well data structure
  private mapAttributesToWellData(element: AFElement, attributes: AFAttribute[]): WellData | null {
    try {
      // Create attribute lookup map
      const attributeMap: { [key: string]: AFAttribute } = {};
      attributes.forEach(attr => {
        attributeMap[attr.Name] = attr;
      });

      // Extract core attributes
      const oilRate = this.getNumericValue(attributeMap[this.attributeMapping.oilRate]) ?? 0;
      const liquidRate = this.getNumericValue(attributeMap[this.attributeMapping.liquidRate]) ?? 0;
      const waterCut = this.getNumericValue(attributeMap[this.attributeMapping.waterCut]) ?? 0;
      const espFrequency = this.getNumericValue(attributeMap[this.attributeMapping.espFrequency]) ?? 0;

      // Extract extended attributes if available
      const gasRate = this.attributeMapping.gasRate ?
        this.getNumericValue(attributeMap[this.attributeMapping.gasRate]) : undefined;
      const tubingPressure = this.attributeMapping.tubingPressure ?
        this.getNumericValue(attributeMap[this.attributeMapping.tubingPressure]) : undefined;
      const casingPressure = this.attributeMapping.casingPressure ?
        this.getNumericValue(attributeMap[this.attributeMapping.casingPressure]) : undefined;
      const temperature = this.attributeMapping.temperature ?
        this.getNumericValue(attributeMap[this.attributeMapping.temperature]) : undefined;
      const flowlinePressure = this.attributeMapping.flowlinePressure ?
        this.getNumericValue(attributeMap[this.attributeMapping.flowlinePressure]) : undefined;
      const chokeSize = this.attributeMapping.chokeSize ?
        this.getNumericValue(attributeMap[this.attributeMapping.chokeSize]) : undefined;
      const gasLiftRate = this.attributeMapping.gasLiftRate ?
        this.getNumericValue(attributeMap[this.attributeMapping.gasLiftRate]) : undefined;
      const pumpSpeed = this.attributeMapping.pumpSpeed ?
        this.getNumericValue(attributeMap[this.attributeMapping.pumpSpeed]) : undefined;
      const motorAmps = this.attributeMapping.motorAmps ?
        this.getNumericValue(attributeMap[this.attributeMapping.motorAmps]) : undefined;
      const vibration = this.attributeMapping.vibration ?
        this.getNumericValue(attributeMap[this.attributeMapping.vibration]) : undefined;
      const runtime = this.attributeMapping.runtime ?
        this.getNumericValue(attributeMap[this.attributeMapping.runtime]) : undefined;
      const shutinTime = this.attributeMapping.shutinTime ?
        this.getNumericValue(attributeMap[this.attributeMapping.shutinTime]) : undefined;
      const wellheadPressure = this.attributeMapping.wellheadPressure ?
        this.getNumericValue(attributeMap[this.attributeMapping.wellheadPressure]) : undefined;
      const bottomholePressure = this.attributeMapping.bottomholePressure ?
        this.getNumericValue(attributeMap[this.attributeMapping.bottomholePressure]) : undefined;

      // Create custom attributes map for additional attributes
      const customAttributes: { [key: string]: number | string } = {};
      const standardAttributes = new Set([
        this.attributeMapping.oilRate,
        this.attributeMapping.liquidRate,
        this.attributeMapping.waterCut,
        this.attributeMapping.espFrequency,
        this.attributeMapping.planTarget,
        this.attributeMapping.gasRate,
        this.attributeMapping.tubingPressure,
        this.attributeMapping.casingPressure,
        this.attributeMapping.temperature,
        this.attributeMapping.flowlinePressure,
        this.attributeMapping.chokeSize,
        this.attributeMapping.gasLiftRate,
        this.attributeMapping.pumpSpeed,
        this.attributeMapping.motorAmps,
        this.attributeMapping.vibration,
        this.attributeMapping.runtime,
        this.attributeMapping.shutinTime,
        this.attributeMapping.wellheadPressure,
        this.attributeMapping.bottomholePressure
      ].filter(Boolean));

      attributes.forEach(attr => {
        if (!standardAttributes.has(attr.Name)) {
          const value = this.getNumericValue(attr);
          if (value !== null) {
            customAttributes[attr.Name] = value;
          } else if (attr.Value?.Value !== undefined) {
            customAttributes[attr.Name] = String(attr.Value.Value);
          }
        }
      });

      return {
        id: element.WebId || `well-${element.Name}`,
        name: element.Name,
        status: oilRate > 0 ? 'active' : 'inactive',
        lastUpdated: new Date().toISOString(),
        attributes: customAttributes,
        oilRate,
        gasRate: gasRate ?? 0,
        waterCut,
        waterRate: liquidRate * (waterCut / 100),
        liquidRate,
        espFrequency,
        ...(tubingPressure !== undefined && tubingPressure !== null && { tubingPressure }),
        ...(casingPressure !== undefined && casingPressure !== null && { casingPressure }),
        ...(temperature !== undefined && temperature !== null && { temperature }),
        ...(flowlinePressure !== undefined && flowlinePressure !== null && { flowlinePressure }),
        ...(chokeSize !== undefined && chokeSize !== null && { chokeSize }),
        ...(gasLiftRate !== undefined && gasLiftRate !== null && { gasLiftRate }),
        ...(pumpSpeed !== undefined && pumpSpeed !== null && { pumpSpeed }),
        ...(motorAmps !== undefined && motorAmps !== null && { motorAmps }),
        ...(vibration !== undefined && vibration !== null && { vibration }),
        ...(runtime !== undefined && runtime !== null && { runtime }),
        ...(shutinTime !== undefined && shutinTime !== null && { shutinTime }),
        ...(wellheadPressure !== undefined && wellheadPressure !== null && { wellheadPressure }),
        ...(bottomholePressure !== undefined && bottomholePressure !== null && { bottomholePressure })
      };

    } catch (error) {
      console.error(`❌ Failed to map attributes for element "${element.Name}":`, error);
      return null;
    }
  }

  // Safe numeric value extraction
  private getNumericValue(attribute: AFAttribute | undefined): number | null {
    if (!attribute || !attribute.Value) {
      return null;
    }
    
    const value = attribute.Value.Value;
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    
    return null;
  }

  // Validation method for configuration testing
  async validateConfiguration(): Promise<{ isValid: boolean; error?: string; details?: string }> {
    try {
      // Test endpoint
      const endpoint = await this.findWorkingEndpoint();
      if (!endpoint) {
        return {
          isValid: false,
          error: 'Cannot connect to PI Web API server',
          details: `Server: ${this.config.piWebApiServerName}`
        };
      }

      // Test databases
      const databases = await this.loadDatabases();
      
      // Test target database
      const targetDb = databases.find(db =>
        db.Name === this.config.afDatabaseName ||
        db.Name.toLowerCase() === this.config.afDatabaseName.toLowerCase()
      );

      if (!targetDb) {
        const availableDbs = databases.map(db => db.Name).join(', ');
        return {
          isValid: false,
          error: `Database '${this.config.afDatabaseName}' not found`,
          details: `Available databases: ${availableDbs}`
        };
      }

      return {
        isValid: true,
        details: `Successfully connected to ${databases.length} databases`
      };

    } catch (error: any) {
      return {
        isValid: false,
        error: error.message || 'Unknown error',
        details: error.stack
      };
    }
  }
}
