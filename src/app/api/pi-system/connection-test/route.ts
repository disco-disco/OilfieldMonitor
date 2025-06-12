import { NextRequest, NextResponse } from 'next/server';
import { PIServerConfig } from '@/types/pi-system';

export async function POST(request: NextRequest) {
  try {
    const { config }: { config: PIServerConfig } = await request.json();

    if (!config.afServerName) {
      return NextResponse.json(
        { success: false, message: 'AF Server name is required' },
        { status: 400 }
      );
    }

    if (!config.piWebApiServerName) {
      return NextResponse.json(
        { success: false, message: 'PI Web API Server name is required' },
        { status: 400 }
      );
    }

    console.log('🔍 PI System Connection Test Starting...');
    console.log(`   PI AF Server: ${config.afServerName}`);
    console.log(`   PI Web API Server: ${config.piWebApiServerName}`);
    console.log(`   Database: ${config.afDatabaseName}`);
    console.log(`   Element Path: ${config.parentElementPath}`);

    const result = await testPIServerConnection(config);
    
    console.log('🔍 Connection Test Complete:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          serverReachable: false,
          databaseExists: false,
          elementPathValid: false,
          attributesAccessible: false
        }
      },
      { status: 500 }
    );
  }
}

async function testPIServerConnection(config: PIServerConfig) {
  const result = {
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
    console.log(`Step 1: Testing PI Web API server reachability for ${config.piWebApiServerName}`);
    result.details.serverReachable = await testServerReachability(config.piWebApiServerName);
    
    if (!result.details.serverReachable) {
      result.message = `Cannot reach PI Web API Server: ${config.piWebApiServerName}`;
      return result;
    }

    // Test 2: Database existence
    console.log(`Step 2: Testing database existence: ${config.afDatabaseName}`);
    result.details.databaseExists = await testDatabaseExists(config);
    
    if (!result.details.databaseExists) {
      result.message = `PI AF Database not found: ${config.afDatabaseName}`;
      return result;
    }

    // Test 3: Element path validation
    console.log(`Step 3: Testing element path: ${config.parentElementPath}`);
    result.details.elementPathValid = await testElementPath(config);
    
    if (!result.details.elementPathValid) {
      result.message = `Invalid element path: ${config.parentElementPath}`;
      return result;
    }

    // Test 4: Attribute accessibility
    console.log(`Step 4: Testing attribute accessibility`);
    result.details.attributesAccessible = await testAttributeAccess(config);
    
    if (!result.details.attributesAccessible) {
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

async function testServerReachability(serverName: string): Promise<boolean> {
  const possibleEndpoints = [
    `https://${serverName}/piwebapi`,
    `https://${serverName}:443/piwebapi`,
    `http://${serverName}/piwebapi`,
    `http://${serverName}:5985/piwebapi`,
    `http://${serverName}:80/piwebapi`
  ];

  console.log(`📡 Testing server reachability for: ${serverName}`);

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`   Trying: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
      
      // Use Node.js fetch with proper headers and SSL handling
      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PLINQO-OilField-Monitor/1.0'
        },
        // Note: In Node.js, we can't easily disable SSL verification
        // If you have SSL issues, you might need to configure certificates
      });
      
      clearTimeout(timeoutId);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      
      if (response.ok || response.status === 401) {
        console.log(`   ✅ Server reachable at: ${endpoint} (Status: ${response.status})`);
        console.log(`   💡 This endpoint will be used for subsequent tests`);
        return true;
      }
      
      console.log(`   ❌ Server not accessible at: ${endpoint} (Status: ${response.status})`);
      
      // Read response body for more details
      try {
        const responseText = await response.text();
        console.log(`   📄 Response body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);
      } catch (bodyError) {
        console.log(`   ⚠️  Could not read response body: ${bodyError}`);
      }
      
    } catch (fetchError: unknown) {
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          console.log(`   ⏱️  Timeout connecting to: ${endpoint}`);
        } else {
          console.log(`   ❌ Failed to connect to: ${endpoint}`);
          console.log(`   🚫 Error: ${fetchError.message}`);
          console.log(`   🔧 Error type: ${fetchError.name}`);
          
          // Provide specific troubleshooting tips
          if (fetchError.message.includes('ENOTFOUND')) {
            console.log(`   💡 DNS resolution failed. Check server name: ${serverName}`);
          } else if (fetchError.message.includes('ECONNREFUSED')) {
            console.log(`   💡 Connection refused. PI Web API service may not be running.`);
          } else if (fetchError.message.includes('certificate')) {
            console.log(`   💡 SSL certificate issue. Try HTTP endpoints or fix certificates.`);
          }
        }
      } else {
        console.log(`   ❌ Failed to connect to: ${endpoint} - Unknown error type`);
      }
    }
  }
  
  console.log(`   ❌ No reachable endpoints found for server: ${serverName}`);
  return false;
}

async function testDatabaseExists(config: PIServerConfig): Promise<boolean> {
  const possibleEndpoints = [
    `https://${config.piWebApiServerName}/piwebapi`,
    `https://${config.piWebApiServerName}:443/piwebapi`,
    `http://${config.piWebApiServerName}/piwebapi`,
    `http://${config.piWebApiServerName}:5985/piwebapi`
  ];

  for (const baseEndpoint of possibleEndpoints) {
    try {
      const assetServerUrl = `${baseEndpoint}/assetservers`;
      console.log(`Checking asset servers at: ${assetServerUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(assetServerUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PLINQO-OilField-Monitor/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.Items && data.Items.length > 0) {
          for (const server of data.Items) {
            const databasesUrl = `${baseEndpoint}/assetservers/${encodeURIComponent(server.Name)}/assetdatabases`;
            console.log(`Checking databases at: ${databasesUrl}`);
            
            const dbResponse = await fetch(databasesUrl, {
              method: 'GET',
              headers: { 
                'Accept': 'application/json',
                'User-Agent': 'PLINQO-OilField-Monitor/1.0'
              }
            });
            
            if (dbResponse.ok) {
              const dbData = await dbResponse.json();
              
              if (dbData.Items) {
                const foundDatabase = dbData.Items.find((db: { Name: string }) => 
                  db.Name.toLowerCase() === config.afDatabaseName.toLowerCase()
                );
                
                if (foundDatabase) {
                  console.log(`✓ Database found: ${config.afDatabaseName}`);
                  return true;
                }
              }
            }
          }
        }
      } else if (response.status === 401) {
        console.log('✓ Authentication required - but server is accessible');
        return true;
      }
      
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.log(`✗ Database check failed: ${errorMessage}`);
    }
  }
  
  return false;
}

async function testElementPath(config: PIServerConfig): Promise<boolean> {
  const possibleEndpoints = [
    `https://${config.piWebApiServerName}/piwebapi`,
    `https://${config.piWebApiServerName}:443/piwebapi`,
    `http://${config.piWebApiServerName}/piwebapi`,
    `http://${config.piWebApiServerName}:5985/piwebapi`
  ];

  for (const baseEndpoint of possibleEndpoints) {
    try {
      const encodedPath = encodeURIComponent(`\\\\${config.afServerName}\\${config.afDatabaseName}\\${config.parentElementPath}`);
      const elementUrl = `${baseEndpoint}/elements?path=${encodedPath}`;
      
      console.log(`Checking element path: ${elementUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(elementUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PLINQO-OilField-Monitor/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.WebId) {
          console.log(`✓ Element path exists: ${config.parentElementPath}`);
          return true;
        }
      } else if (response.status === 401) {
        console.log('✓ Authentication required for element path check');
        return true;
      } else if (response.status === 404) {
        console.log(`✗ Element path not found: ${config.parentElementPath}`);
      }
      
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.log(`✗ Element path check failed: ${errorMessage}`);
    }
  }
  
  return false;
}

async function testAttributeAccess(config: PIServerConfig): Promise<boolean> {
  const possibleEndpoints = [
    `https://${config.piWebApiServerName}/piwebapi`,
    `https://${config.piWebApiServerName}:443/piwebapi`,
    `http://${config.piWebApiServerName}/piwebapi`,
    `http://${config.piWebApiServerName}:5985/piwebapi`
  ];

  for (const baseEndpoint of possibleEndpoints) {
    try {
      const encodedPath = encodeURIComponent(`\\\\${config.afServerName}\\${config.parentElementPath}`);
      const elementUrl = `${baseEndpoint}/elements?path=${encodedPath}`;
      
      const response = await fetch(elementUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PLINQO-OilField-Monitor/1.0'
        }
      });
      
      if (response.ok) {
        const elementData = await response.json();
        
        if (elementData.WebId) {
          const childElementsUrl = `${baseEndpoint}/elements/${elementData.WebId}/elements`;
          
          const childResponse = await fetch(childElementsUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          if (childResponse.ok) {
            const childData = await childResponse.json();
            
            if (childData.Items && childData.Items.length > 0) {
              const firstChild = childData.Items[0];
              const attributesUrl = `${baseEndpoint}/elements/${firstChild.WebId}/attributes`;
              
              const attrResponse = await fetch(attributesUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              });
              
              if (attrResponse.ok) {
                const attrData = await attrResponse.json();
                console.log(`✓ Attributes accessible: ${attrData.Items ? attrData.Items.length : 0} attributes found`);
                return true;
              }
            }
          }
        }
      } else if (response.status === 401) {
        console.log('✓ Authentication required for attribute access test');
        return true;
      }
      
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      console.log(`✗ Attribute access test failed: ${errorMessage}`);
    }
  }
  
  return false;
}
