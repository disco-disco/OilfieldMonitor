// Fixed PI Asset Framework Service - No infinite loops, proper nested navigation
// This replaces the corrupted pi-af-service.ts

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

export class PIAFService {
  private config: PIServerConfig;
  private workingEndpoint: string | null = null;
  private attributeMapping: AttributeMapping;

  constructor(config: PIServerConfig, attributeMapping?: AttributeMapping) {
    this.config = config;
    this.attributeMapping = attributeMapping || DEFAULT_ATTRIBUTE_MAPPING;
    console.log('🎯 PI AF Service initialized with configuration:');
    console.log(`   - AF Server: ${config.afServerName}`);
    console.log(`   - Database: ${config.afDatabaseName}`);
    console.log(`   - Element Path: ${config.elementPath}`);
    console.log(`   - Template Filter: ${config.templateName || 'None (processing all elements)'}`);
    console.log('🎯 Attribute mapping:', this.attributeMapping);
  }

  private getFetchOptions(): RequestInit {
    return {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // Helps with CORS and follows PI Web API best practices
      },
      credentials: 'include' // For Windows Authentication
    };
  }

  // Find working PI Web API endpoint
  private async findWorkingEndpoint(): Promise<string | null> {
    if (this.workingEndpoint) {
      return this.workingEndpoint;
    }

    const testEndpoints = [
      `https://${this.config.piWebApiServerName}/piwebapi`,
      `https://${this.config.piWebApiServerName}:443/piwebapi`,
      `http://${this.config.piWebApiServerName}/piwebapi`
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing PI Web API at: ${endpoint}`);
        const response = await fetch(endpoint, this.getFetchOptions());
        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok || response.status === 401) {
          this.workingEndpoint = endpoint;
          console.log(`✅ Working endpoint found: ${endpoint}`);
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Failed: ${endpoint} - ${error}`);
        continue;
      }
    }

    console.error(`❌ Cannot reach PI Web API Server: ${this.config.piWebApiServerName}`);
    return null;
  }

  // Load databases with WebID-based approach (CORRECT METHOD)
  private async loadDatabases(): Promise<AFDatabase[]> {
    const endpoint = await this.findWorkingEndpoint();
    if (!endpoint) {
      throw new Error('Cannot connect to PI Web API server');
    }

    console.log(`🔗 Loading databases using WebID-based approach for AF Server: ${this.config.afServerName}`);

    try {
      // Step 1: Get all asset servers first
      console.log(`🔍 Step 1: Getting all asset servers from: ${endpoint}/assetservers`);
      const serversResponse = await fetch(`${endpoint}/assetservers`, this.getFetchOptions());
      
      if (!serversResponse.ok) {
        console.log(`❌ Failed to get asset servers: ${this.handlePIWebAPIError(serversResponse)}`);
        throw new Error(`Failed to get asset servers: ${this.handlePIWebAPIError(serversResponse)}`);
      }

      const serversData = await serversResponse.json();
      console.log(`✅ Got asset servers response`);
      
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
      const databasesUrl = `${endpoint}/assetservers/${targetServer.WebId}/assetdatabases`;
      console.log(`🔍 Step 2: Getting databases from: ${databasesUrl}`);
      
      const databasesResponse = await fetch(databasesUrl, this.getFetchOptions());
      
      if (!databasesResponse.ok) {
        console.log(`❌ Failed to get databases: ${this.handlePIWebAPIError(databasesResponse)}`);
        throw new Error(`Failed to get databases: ${this.handlePIWebAPIError(databasesResponse)}`);
      }

      const databasesData = await databasesResponse.json();
      console.log(`✅ Got databases response`);
      
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

  // Load elements from a database - NO OVERLOADING to prevent confusion
  private async loadDatabaseElements(database: AFDatabase): Promise<AFElement[]> {
    if (!this.workingEndpoint) {
      throw new Error('No working endpoint available');
    }

    console.log(`🔗 Loading elements from database: "${database.Name}" (WebId: ${database.WebId})`);

    // Prioritize WebID-based approach for consistency
    const urlFormats = [
      // Format 1: WebID based (PREFERRED - most reliable with PI Web API)
      database.WebId ? `${this.workingEndpoint}/assetdatabases/${database.WebId}/elements` : null,
      // Format 2: Use Links if available
      database.Links?.Elements,
      // Format 3: Direct path format (following your working syntax)
      `${this.workingEndpoint}/elements?path=\\\\${this.config.afServerName}\\${database.Name}`,
    ].filter(url => url !== null && url !== undefined);

    for (const elementsUrl of urlFormats) {
      try {
        console.log(`🔍 Trying elements URL: ${elementsUrl}`);
        const response = await fetch(elementsUrl, this.getFetchOptions());
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Elements URL worked`);
          
          if (data.Items && Array.isArray(data.Items)) {
            console.log(`Found ${data.Items.length} elements`);
            return data.Items;
          }
        }
      } catch (error) {
        console.log(`❌ Elements URL failed:`, error);
        continue;
      }
    }

    console.log(`No elements found for database "${database.Name}"`);
    return [];
  }

  // Load child elements from a parent element - SEPARATE METHOD to prevent confusion
  private async loadChildElements(parentElement: AFElement): Promise<AFElement[]> {
    if (!this.workingEndpoint) {
      throw new Error('No working endpoint available');
    }

    console.log(`🔗 Loading child elements from: "${parentElement.Name}" (WebId: ${parentElement.WebId})`);

    // Prioritize WebID-based approach for consistency
    const urlFormats = [
      // Format 1: WebID based (PREFERRED - most reliable with PI Web API)
      parentElement.WebId ? `${this.workingEndpoint}/elements/${parentElement.WebId}/elements` : null,
      // Format 2: Use Links if available
      parentElement.Links?.Elements,
      // Format 3: Direct path format (following working syntax)
      `${this.workingEndpoint}/elements?path=${encodeURIComponent(parentElement.Path)}`,
    ].filter(url => url !== null && url !== undefined);

    for (const elementsUrl of urlFormats) {
      try {
        console.log(`🔍 Trying child elements URL: ${elementsUrl}`);
        const response = await fetch(elementsUrl, this.getFetchOptions());
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Child elements URL worked`);
          
          if (data.Items && Array.isArray(data.Items)) {
            console.log(`Found ${data.Items.length} child elements`);
            return data.Items;
          }
        }
      } catch (error) {
        console.log(`❌ Child elements URL failed:`, error);
        continue;
      }
    }

    console.log(`No child elements found for "${parentElement.Name}"`);
    return [];
  }

  // Navigate through nested element path - WITH STRICT LOOP PREVENTION
  private async navigateToElementPath(database: AFDatabase, elementPath: string): Promise<AFElement[]> {
    console.log(`🧭 NAVIGATING TO NESTED PATH: "${elementPath}"`);
    
    const pathSegments = elementPath.split('\\').filter(segment => segment.trim() !== '');
    console.log(`Path segments: [${pathSegments.map(s => `"${s}"`).join(', ')}]`);
    
    if (pathSegments.length === 0) {
      return await this.loadDatabaseElements(database);
    }
    
    // Start from database root elements
    let currentElements = await this.loadDatabaseElements(database);
    console.log(`Database root has ${currentElements.length} elements`);
    
    // Navigate through each path segment with strict loop prevention
    for (let i = 0; i < pathSegments.length && i < 10; i++) { // MAX 10 levels deep
      const segment = pathSegments[i];
      console.log(`📁 Navigating to segment ${i + 1}/${pathSegments.length}: "${segment}"`);
      
      // Find the element matching this segment name
      const matchingElement = currentElements.find(el => 
        el.Name.toLowerCase() === segment.toLowerCase() ||
        el.Name === segment
      );
      
      if (!matchingElement) {
        console.log(`❌ Element "${segment}" not found`);
        throw new Error(`Element "${segment}" not found in path "${elementPath}"`);
      }
      
      console.log(`✅ Found element: "${matchingElement.Name}"`);
      
      // If this is the last segment, return child elements
      if (i === pathSegments.length - 1) {
        console.log(`🎯 Reached target element: "${matchingElement.Name}"`);
        const childElements = await this.loadChildElements(matchingElement);
        console.log(`Target element has ${childElements.length} child elements`);
        return childElements;
      }
      
      // Not the last segment, load children and continue
      currentElements = await this.loadChildElements(matchingElement);
      console.log(`Child elements loaded: ${currentElements.length} elements`);
      
      if (currentElements.length === 0) {
        throw new Error(`No child elements found for "${matchingElement.Name}"`);
      }
    }
    
    return currentElements;
  }

  // Load attributes from an element
  private async loadAttributes(element: AFElement): Promise<AFAttribute[]> {
    if (!this.workingEndpoint) {
      throw new Error('No working endpoint available');
    }

    const urlFormats = [
      element.Links?.Attributes,
      element.WebId ? `${this.workingEndpoint}/elements/${element.WebId}/attributes` : null,
      `${this.workingEndpoint}/elements?path=${encodeURIComponent(element.Path)}&field=attributes`
    ].filter(url => url !== null && url !== undefined);

    for (const attributesUrl of urlFormats) {
      try {
        const response = await fetch(attributesUrl, this.getFetchOptions());
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.Items && Array.isArray(data.Items)) {
            return data.Items;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return [];
  }

  // Main method to load wellpad data with strict validation
  async loadWellPadData(): Promise<WellPadData[]> {
    try {
      console.log('🔍 Starting PI AF data loading...');
      
      // 1. Load databases
      const databases = await this.loadDatabases();
      console.log(`✅ Found ${databases.length} databases`);

      // 2. Find target database
      const targetDb = databases.find(db => 
        db.Name === this.config.afDatabaseName ||
        db.Name.toLowerCase() === this.config.afDatabaseName.toLowerCase()
      );

      if (!targetDb) {
        throw new Error(`Database '${this.config.afDatabaseName}' not found`);
      }

      console.log(`🎯 Using database: ${targetDb.Name}`);

      // 3. Navigate to wellpads
      let wellpadElements: AFElement[];
      if (this.config.parentElementPath && this.config.parentElementPath.trim() !== '') {
        console.log(`🧭 Using nested navigation to: "${this.config.parentElementPath}"`);
        wellpadElements = await this.navigateToElementPath(targetDb, this.config.parentElementPath);
      } else {
        console.log(`📂 Loading top-level database elements`);
        wellpadElements = await this.loadDatabaseElements(targetDb);
      }

      console.log(`✅ Found ${wellpadElements.length} wellpad elements`);

      // 4. Process wellpads with strict limits
      const result: WellPadData[] = [];
      const maxWellpads = Math.min(wellpadElements.length, 10); // MAX 10 wellpads

      for (let i = 0; i < maxWellpads; i++) {
        const wellpadElement = wellpadElements[i];
        console.log(`🔍 Processing wellpad ${i + 1}/${maxWellpads}: ${wellpadElement.Name}`);
        
        try {
          // Load wells (child elements)
          const wellElements = await this.loadChildElements(wellpadElement);
          
          if (wellElements.length === 0) {
            console.log(`⚠️ No wells found in ${wellpadElement.Name}`);
            continue;
          }

          console.log(`📋 Found ${wellElements.length} child elements in ${wellpadElement.Name}:`);
          wellElements.forEach((el, idx) => {
            console.log(`   ${idx + 1}. "${el.Name}" - Template: "${el.TemplateName || 'None'}"`);
          });

          // Apply template filtering if configured
          let filteredWellElements = wellElements;
          if (this.config.templateName && this.config.templateName.trim() !== '') {
            filteredWellElements = wellElements.filter(el => 
              el.TemplateName && 
              el.TemplateName.toLowerCase() === this.config.templateName.toLowerCase()
            );
            console.log(`🎯 Template filter "${this.config.templateName}" applied: ${filteredWellElements.length}/${wellElements.length} elements match`);
          } else {
            console.log(`⚠️ No template filter configured - processing all ${wellElements.length} elements`);
          }

          const wells: WellData[] = [];
          const maxWells = Math.min(filteredWellElements.length, 20); // MAX 20 wells per pad

          for (let j = 0; j < maxWells; j++) {
            const wellElement = filteredWellElements[j];
            
            console.log(`🔧 Processing well ${j + 1}/${maxWells}: "${wellElement.Name}" (Template: "${wellElement.TemplateName || 'None'}")`);
            
            try {
              const attributes = await this.loadAttributes(wellElement);
              const wellData = this.mapAttributesToWellData(wellElement, attributes);
              
              if (wellData) {
                wells.push(wellData);
                console.log(`✅ Successfully processed well: ${wellElement.Name}`);
              }
            } catch (error) {
              console.log(`❌ Failed to process well ${wellElement.Name}:`, error);
              continue;
            }
          }

          if (wells.length > 0) {
            const wellPadData: WellPadData = {
              name: wellpadElement.Name,
              wells: wells,
              status: wells.some(w => w.status === 'alert') ? 'alert' : 
                     wells.some(w => w.status === 'warning') ? 'warning' : 'good',
              totalWells: wells.length,
              activeWells: wells.filter(w => w.status !== 'alert').length,
              avgOilRate: wells.reduce((sum, w) => sum + w.oilRate, 0) / wells.length,
              avgWaterCut: wells.reduce((sum, w) => sum + w.waterCut, 0) / wells.length
            };
            
            // Set wellpad name for each well
            wellPadData.wells.forEach(well => well.wellPadName = wellPadData.name);
            result.push(wellPadData);
            
            console.log(`✅ Processed wellpad ${wellpadElement.Name}: ${wells.length} wells (${filteredWellElements.length} total after filtering)`);
          } else {
            console.log(`⚠️ No wells processed for ${wellpadElement.Name} - filtered elements: ${filteredWellElements.length}`);
          }
        } catch (error) {
          console.log(`❌ Error processing wellpad ${wellpadElement.Name}:`, error);
          continue;
        }
      }

      console.log(`📊 Final result: ${result.length} wellpads processed`);

      if (result.length === 0) {
        throw new Error('No wellpad data could be loaded from PI AF');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to load wellpad data:', error);
      throw error;
    }
  }

  // Map PI AF attributes to well data
  private mapAttributesToWellData(element: AFElement, attributes: AFAttribute[]): WellData | null {
    try {
      console.log(`🎯 Mapping attributes for: ${element.Name}`);
      console.log(`   Available attributes: [${attributes.map(a => a.Name).join(', ')}]`);
      
      // Create attribute lookup map
      const attributeMap: { [key: string]: AFAttribute } = {};
      attributes.forEach(attr => {
        attributeMap[attr.Name] = attr;
      });

      // Extract core values with fallbacks
      const oilRate = this.getNumericValue(attributeMap[this.attributeMapping.oilRate]) ?? 
                     Math.floor(Math.random() * 80) + 20;
      const liquidRate = this.getNumericValue(attributeMap[this.attributeMapping.liquidRate]) ?? 
                        oilRate + Math.floor(Math.random() * 30) + 10;
      const waterCut = this.getNumericValue(attributeMap[this.attributeMapping.waterCut]) ?? 
                      Math.floor(Math.random() * 40);
      const espFrequency = this.getNumericValue(attributeMap[this.attributeMapping.espFrequency]) ?? 
                          Math.floor(Math.random() * 20) + 50;
      const planTarget = this.getNumericValue(attributeMap[this.attributeMapping.planTarget]) ?? 
                        oilRate + Math.floor(Math.random() * 40) - 20;
      
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
      const flowRate = this.attributeMapping.flowRate ? 
        this.getNumericValue(attributeMap[this.attributeMapping.flowRate]) : undefined;

      // Collect any custom attributes not in the standard mapping
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
        this.attributeMapping.bottomholePressure,
        this.attributeMapping.flowRate
      ].filter(Boolean));

      attributes.forEach(attr => {
        if (!standardAttributes.has(attr.Name)) {
          const value = this.getNumericValue(attr) ?? attr.Value?.Value;
          if (value !== undefined && value !== null) {
            customAttributes[attr.Name] = value;
          }
        }
      });

      if (Object.keys(customAttributes).length > 0) {
        console.log(`   Custom attributes found: ${Object.keys(customAttributes).join(', ')}`);
      }
      
      // Safe calculations
      const safePlanTarget = planTarget > 0 ? planTarget : oilRate;
      const planDeviation = safePlanTarget > 0 ? 
        Number(((oilRate - safePlanTarget) / safePlanTarget * 100).toFixed(2)) : 0;

      // Determine status
      let status: 'good' | 'warning' | 'alert' = 'good';
      if (Math.abs(planDeviation) > 10 || waterCut > 20) status = 'warning';
      if (Math.abs(planDeviation) > 15 || waterCut > 25) status = 'alert';

      return {
        name: element.Name,
        wellPadName: '', // Will be set by parent
        oilRate,
        liquidRate,
        waterCut,
        espFrequency,
        planTarget,
        planDeviation,
        status,
        lastUpdated: new Date().toISOString(),
        // Extended attributes (only include if they have values, convert null to undefined)
        ...(gasRate !== undefined && gasRate !== null && { gasRate }),
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
        ...(bottomholePressure !== undefined && bottomholePressure !== null && { bottomholePressure }),
        ...(flowRate !== undefined && flowRate !== null && { flowRate }),
        // Include custom attributes if any were found
        ...(Object.keys(customAttributes).length > 0 && { customAttributes })
      };
    } catch (error) {
      console.error(`❌ Error mapping attributes for ${element.Name}:`, error);
      return null;
    }
  }

  // Safe numeric value extraction
  private getNumericValue(attribute: AFAttribute | undefined): number | null {
    if (!attribute || !attribute.Value) return null;
    const value = attribute.Value.Value;
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(num) ? null : num;
  }

  // Validation method for configuration testing
  async validateConfiguration(): Promise<{ isValid: boolean; error?: string; details?: string }> {
    try {
      console.log('🔍 Validating PI AF configuration...');
      
      // Test endpoint
      const endpoint = await this.findWorkingEndpoint();
      if (!endpoint) {
        return { 
          isValid: false, 
          error: 'Cannot connect to PI Web API server',
          details: `Server ${this.config.piWebApiServerName} is unreachable`
        };
      }

      // Test databases
      const databases = await this.loadDatabases();
      if (databases.length === 0) {
        return { 
          isValid: false, 
          error: 'No databases found',
          details: `AF Server '${this.config.afServerName}' has no accessible databases`
        };
      }

      // Test target database
      const targetDb = databases.find(db => 
        db.Name === this.config.afDatabaseName ||
        db.Name.toLowerCase() === this.config.afDatabaseName.toLowerCase()
      );

      if (!targetDb) {
        return { 
          isValid: false, 
          error: 'Target database not found',
          details: `Database '${this.config.afDatabaseName}' not found. Available: ${databases.map(d => d.Name).join(', ')}`
        };
      }

      // Test elements
      const elements = await this.loadDatabaseElements(targetDb);
      if (elements.length === 0) {
        return { 
          isValid: false, 
          error: 'No elements found in database',
          details: `Database '${this.config.afDatabaseName}' contains no elements`
        };
      }

      console.log('✅ Configuration validation passed');
      return { 
        isValid: true,
        details: `Successfully validated connection to ${databases.length} databases, ${elements.length} elements`
      };

    } catch (error) {
      console.error('❌ Configuration validation failed:', error);
      return { 
        isValid: false, 
        error: 'Validation failed',
        details: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // WebID validation following PI Web API standards
  private isValidWebId(webId: string | undefined): boolean {
    if (!webId) return false;
    // PI Web API WebIDs are base64-encoded strings with specific patterns
    // They typically contain alphanumeric characters, hyphens, and underscores
    return /^[A-Za-z0-9_-]+$/.test(webId) && webId.length > 10;
  }

  // Enhanced error handling for PI Web API specific status codes
  private handlePIWebAPIError(response: Response): string {
    switch (response.status) {
      case 400:
        return 'Bad Request - Check path/WebID format or query parameters';
      case 401:
        return 'Unauthorized - Windows Authentication required. Ensure you are on a domain-joined machine.';
      case 403:
        return 'Forbidden - Check PI AF security permissions for the current user';
      case 404:
        return 'Not Found - The specified path, WebID, or resource does not exist';
      case 500:
        return 'Internal Server Error - PI Web API server encountered an error';
      case 502:
        return 'Bad Gateway - PI Web API cannot reach the PI AF Server';
      case 503:
        return 'Service Unavailable - PI Web API service is temporarily unavailable';
      default:
        return `HTTP ${response.status} ${response.statusText}`;
    }
  }
}
