// Client-side PI AF Service for Windows Authentication
// This service runs in the browser and leverages browser Windows Auth capabilities

import { WellPadData, WellData, PIServerConfig, AttributeMapping, DEFAULT_ATTRIBUTE_MAPPING } from '@/types/pi-system';

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

export class ClientSidePIAFService {
  private config: PIServerConfig;
  private attributeMapping: AttributeMapping;
  private workingEndpoint: string | null = null;

  constructor(config: PIServerConfig, attributeMapping?: AttributeMapping) {
    this.config = config;
    this.attributeMapping = attributeMapping || DEFAULT_ATTRIBUTE_MAPPING;
    console.log('🌐 Client-side PI AF Service initialized with configuration:');
    console.log(`   - AF Server: ${config.afServerName}`);
    console.log(`   - Database: ${config.afDatabaseName}`);
    console.log(`   - Element Path: ${config.parentElementPath}`);
    console.log(`   - Template Filter: ${config.templateName || 'None'}`);
  }

  // Get fetch options for Windows Authentication
  private getFetchOptions(): RequestInit {
    return {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // This is the key - browser handles Windows Authentication
      credentials: 'include'
    };
  }

  // Find working PI Web API endpoint (client-side)
  private async findWorkingEndpoint(): Promise<string | null> {
    if (this.workingEndpoint) {
      return this.workingEndpoint;
    }

    const testEndpoints = [
      `https://${this.config.piWebApiServerName}/piwebapi`,
      `https://${this.config.piWebApiServerName}:443/piwebapi`,
      `https://${this.config.piWebApiServerName}/PIWebAPI`,
      `https://${this.config.piWebApiServerName}:5985/piwebapi`
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing client-side endpoint: ${endpoint}`);
        
        // Test with system endpoint
        const response = await fetch(`${endpoint}/system`, this.getFetchOptions());
        
        console.log(`   Status: ${response.status} ${response.statusText}`);

        // Success conditions for client-side (browser auth)
        // HTTP 200 = Authentication successful and server accessible
        // HTTP 401 = Server accessible but needs Windows Authentication (which browser can handle)
        if (response.ok || response.status === 401) {
          this.workingEndpoint = endpoint;
          console.log(`✅ Working client-side endpoint found: ${endpoint} (Status: ${response.status})`);
          return endpoint;
        }
        
      } catch (error) {
        console.log(`❌ Client-side endpoint failed: ${endpoint} - ${error}`);
        continue;
      }
    }

    console.log(`❌ No working client-side endpoints found`);
    return null;
  }

  // Load databases using client-side Windows Authentication
  private async loadDatabases(): Promise<AFDatabase[]> {
    const endpoint = await this.findWorkingEndpoint();
    if (!endpoint) {
      throw new Error('Cannot connect to PI Web API server from client');
    }

    console.log(`🔗 Loading databases client-side for AF Server: ${this.config.afServerName}`);

    try {
      // Step 1: Get all asset servers
      console.log(`🔍 Getting asset servers from: ${endpoint}/assetservers`);
      const serversResponse = await fetch(`${endpoint}/assetservers`, this.getFetchOptions());
      
      // Handle Windows Authentication responses
      if (serversResponse.status === 401) {
        throw new Error('Windows Authentication required. Please ensure you are running this application on a Windows domain-joined machine with valid credentials.');
      }
      
      if (!serversResponse.ok) {
        throw new Error(`Failed to get asset servers: ${serversResponse.status} ${serversResponse.statusText}`);
      }

      const serversData = await serversResponse.json();
      console.log(`✅ Got ${serversData.Items?.length || 0} asset servers`);
      
      if (!serversData.Items || !Array.isArray(serversData.Items)) {
        throw new Error('No asset servers found');
      }

      // Step 2: Find the target AF server
      const targetServer = serversData.Items.find((server: any) => 
        server.Name === this.config.afServerName || 
        server.Name.toLowerCase() === this.config.afServerName.toLowerCase()
      );

      if (!targetServer) {
        const availableServers = serversData.Items.map((s: any) => s.Name).join(', ');
        throw new Error(`AF Server '${this.config.afServerName}' not found. Available: ${availableServers}`);
      }

      console.log(`🎯 Found target AF Server: "${targetServer.Name}"`);

      // Step 3: Get databases
      const databasesResponse = await fetch(`${endpoint}/assetservers/${targetServer.WebId}/assetdatabases`, this.getFetchOptions());
      
      if (!databasesResponse.ok) {
        throw new Error(`Failed to get databases: ${databasesResponse.status} ${databasesResponse.statusText}`);
      }

      const databasesData = await databasesResponse.json();
      console.log(`✅ Got ${databasesData.Items?.length || 0} databases`);

      return databasesData.Items || [];

    } catch (error) {
      console.error(`❌ Client-side database loading failed:`, error);
      throw error;
    }
  }

  // Load elements from database
  private async loadDatabaseElements(database: AFDatabase): Promise<AFElement[]> {
    if (!this.workingEndpoint) {
      throw new Error('No working endpoint available');
    }

    console.log(`🔗 Loading elements from database: "${database.Name}"`);

    try {
      const response = await fetch(`${this.workingEndpoint}/assetdatabases/${database.WebId}/elements`, this.getFetchOptions());
      
      if (!response.ok) {
        throw new Error(`Failed to load elements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Got ${data.Items?.length || 0} elements from "${database.Name}"`);
      
      return data.Items || [];

    } catch (error) {
      console.error(`❌ Failed to load elements from "${database.Name}":`, error);
      return [];
    }
  }

  // Load child elements
  private async loadChildElements(parentElement: AFElement): Promise<AFElement[]> {
    if (!this.workingEndpoint) {
      throw new Error('No working endpoint available');
    }

    console.log(`🔗 Loading child elements from: "${parentElement.Name}"`);

    try {
      const response = await fetch(`${this.workingEndpoint}/elements/${parentElement.WebId}/elements`, this.getFetchOptions());
      
      if (!response.ok) {
        throw new Error(`Failed to load child elements: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Got ${data.Items?.length || 0} child elements from "${parentElement.Name}"`);
      
      return data.Items || [];

    } catch (error) {
      console.error(`❌ Failed to load child elements from "${parentElement.Name}":`, error);
      return [];
    }
  }

  // Navigate nested path
  private async navigateToNestedElement(database: AFDatabase, elementPath: string): Promise<AFElement[]> {
    console.log(`🧭 Client-side navigation to: "${elementPath}"`);
    
    const pathSegments = elementPath.split('\\').filter(segment => segment.trim() !== '');
    console.log(`Path segments: [${pathSegments.map(s => `"${s}"`).join(', ')}]`);

    let currentElements = await this.loadDatabaseElements(database);
    
    for (let i = 0; i < pathSegments.length && i < 10; i++) {
      const segmentName = pathSegments[i];
      console.log(`🔍 Looking for segment "${segmentName}"`);
      
      const matchingElement = currentElements.find(el => 
        el.Name === segmentName || 
        el.Name.toLowerCase() === segmentName.toLowerCase()
      );
      
      if (!matchingElement) {
        console.log(`❌ Path segment "${segmentName}" not found`);
        return [];
      }

      console.log(`✅ Found "${segmentName}"`);
      
      if (i === pathSegments.length - 1) {
        return await this.loadChildElements(matchingElement);
      }
      
      currentElements = await this.loadChildElements(matchingElement);
    }

    return currentElements;
  }

  // Load attributes
  private async loadElementAttributes(element: AFElement): Promise<AFAttribute[]> {
    if (!this.workingEndpoint) {
      throw new Error('No working endpoint available');
    }

    console.log(`🔍 Loading attributes for element: "${element.Name}" (WebId: ${element.WebId})`);

    try {
      const response = await fetch(`${this.workingEndpoint}/elements/${element.WebId}/attributes`, this.getFetchOptions());
      
      if (!response.ok) {
        // Log the status but don't treat 401 as a fatal error for attribute loading
        if (response.status === 401) {
          console.log(`⚠️ Windows Authentication required for attributes on "${element.Name}" - this is expected`);
          return [];
        }
        throw new Error(`Failed to load attributes: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const attributes = data.Items || [];
      
      console.log(`✅ Loaded ${attributes.length} attributes for "${element.Name}"`);
      if (attributes.length > 0) {
        console.log(`   Available attributes: [${attributes.slice(0, 5).map((a: any) => a.Name).join(', ')}${attributes.length > 5 ? '...' : ''}]`);
      }
      
      return attributes;

    } catch (error) {
      console.error(`❌ Failed to load attributes from "${element.Name}":`, error);
      return [];
    }
  }

  // Main method to load wellpad data using client-side Windows Authentication
  async loadWellPadData(): Promise<WellPadData[]> {
    console.log('🚀 Starting client-side wellpad data loading');
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
        wellpadElements = await this.navigateToNestedElement(targetDb, this.config.parentElementPath);
      } else {
        wellpadElements = await this.loadDatabaseElements(targetDb);
      }

      console.log(`📊 Found ${wellpadElements.length} wellpad elements`);

      // 4. Process wellpads
      for (let i = 0; i < Math.min(wellpadElements.length, 10); i++) {
        const wellpadElement = wellpadElements[i];
        console.log(`\n🏭 Processing wellpad: "${wellpadElement.Name}"`);
        
        try {
          // Get wells
          const wellElements = await this.loadChildElements(wellpadElement);
          
          // Apply template filtering
          let filteredWellElements = wellElements;
          if (this.config.templateName && this.config.templateName.trim() !== '') {
            filteredWellElements = wellElements.filter(el =>
              el.TemplateName && 
              el.TemplateName.toLowerCase() === this.config.templateName.toLowerCase()
            );
            console.log(`🎯 Filtered ${wellElements.length} → ${filteredWellElements.length} wells by template`);
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

      console.log(`📊 Client-side result: ${result.length} wellpads processed`);
      return result;

    } catch (error) {
      console.error(`❌ Client-side wellpad data loading failed:`, error);
      throw error;
    }
  }

  // Map attributes to well data
  private mapAttributesToWellData(element: AFElement, attributes: AFAttribute[]): WellData | null {
    try {
      console.log(`🎯 Mapping attributes for: ${element.Name}`);
      console.log(`   Available attributes: [${attributes.map(a => a.Name).join(', ')}]`);
      
      // Create attribute lookup map
      const attributeMap: { [key: string]: AFAttribute } = {};
      attributes.forEach(attr => {
        attributeMap[attr.Name] = attr;
      });

      // Extract core attributes using the attribute mapping
      const oilRate = this.getNumericValue(attributeMap[this.attributeMapping.oilRate]) ?? 0;
      const liquidRate = this.getNumericValue(attributeMap[this.attributeMapping.liquidRate]) ?? 0;
      const waterCut = this.getNumericValue(attributeMap[this.attributeMapping.waterCut]) ?? 0;
      const espFrequency = this.getNumericValue(attributeMap[this.attributeMapping.espFrequency]) ?? 0;

      // Extract extended attributes
      const gasRate = this.attributeMapping.gasRate ?
        this.getNumericValue(attributeMap[this.attributeMapping.gasRate]) : undefined;
      const tubingPressure = this.attributeMapping.tubingPressure ?
        this.getNumericValue(attributeMap[this.attributeMapping.tubingPressure]) : undefined;

      // Build the attributes object with custom display names for the tile component
      const displayAttributes: { [key: string]: number | string } = {};
      
      // Add core attributes using custom names from mapping
      if (this.attributeMapping.oilRate && oilRate !== null) {
        displayAttributes[this.attributeMapping.oilRate] = oilRate;
      }
      if (this.attributeMapping.liquidRate && liquidRate !== null) {
        displayAttributes[this.attributeMapping.liquidRate] = liquidRate;
      }
      if (this.attributeMapping.waterCut && waterCut !== null) {
        displayAttributes[this.attributeMapping.waterCut] = waterCut;
      }
      if (this.attributeMapping.espFrequency && espFrequency !== null) {
        displayAttributes[this.attributeMapping.espFrequency] = espFrequency;
      }
      
      // Add extended attributes using custom names
      if (this.attributeMapping.gasRate && gasRate !== undefined && gasRate !== null) {
        displayAttributes[this.attributeMapping.gasRate] = gasRate;
      }
      if (this.attributeMapping.tubingPressure && tubingPressure !== undefined && tubingPressure !== null) {
        displayAttributes[this.attributeMapping.tubingPressure] = tubingPressure;
      }
      
      // Add any additional attributes found that aren't in the standard mapping
      const standardAttributeNames = new Set([
        this.attributeMapping.oilRate,
        this.attributeMapping.liquidRate,
        this.attributeMapping.waterCut,
        this.attributeMapping.espFrequency,
        this.attributeMapping.gasRate,
        this.attributeMapping.tubingPressure
      ].filter(Boolean));
      
      attributes.forEach(attr => {
        if (!standardAttributeNames.has(attr.Name)) {
          const value = this.getNumericValue(attr);
          if (value !== null) {
            displayAttributes[attr.Name] = value;
          }
        }
      });

      console.log(`✅ Successfully mapped ${Object.keys(displayAttributes).length} attributes for "${element.Name}"`);
      console.log(`   Attributes: ${Object.keys(displayAttributes).join(', ')}`);

      return {
        id: element.WebId || `well-${element.Name}`,
        name: element.Name,
        status: oilRate > 0 ? 'active' : 'inactive',
        lastUpdated: new Date().toISOString(),
        attributes: displayAttributes,
        oilRate,
        gasRate: gasRate ?? 0,
        waterCut,
        waterRate: liquidRate * (waterCut / 100),
        liquidRate,
        espFrequency,
        ...(tubingPressure !== undefined && tubingPressure !== null && { tubingPressure })
      };

    } catch (error) {
      console.error(`❌ Failed to map attributes for "${element.Name}":`, error);
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

  // Test client-side connection
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const endpoint = await this.findWorkingEndpoint();
      if (!endpoint) {
        return {
          success: false,
          message: 'No working PI Web API endpoints found for client-side access'
        };
      }

      // Test databases
      const databases = await this.loadDatabases();
      
      return {
        success: true,
        message: `Client-side connection successful - found ${databases.length} databases`,
        details: { endpoint, databaseCount: databases.length }
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Client-side connection failed: ${error.message}`,
        details: error
      };
    }
  }
}
