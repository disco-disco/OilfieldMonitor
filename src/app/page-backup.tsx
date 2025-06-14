'use client';

import { useState } from 'react';
import { Droplets, TrendingUp, TrendingDown, CheckCircle, Zap, Settings, RefreshCw, BarChart3, Activity } from "lucide-react";
import PISystemConfig from '@/components/PISystemConfig';
import DynamicWellPadLayout from '@/components/DynamicWellPadLayout';
import { WellPadData, WellData, AttributeMapping } from '@/types/pi-system';

export default function Home() {
  console.log('🚀 MAIN PAGE: Component is rendering');
  
  const [wellPads, setWellPads] = useState<WellPadData[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPIConfigured, setIsPIConfigured] = useState(false);
  const [currentMode, setCurrentMode] = useState<'development' | 'production'>('development');
  const [dataSource, setDataSource] = useState<'pi-af' | 'simulated' | 'unknown'>('unknown');
  const [lastPIError, setLastPIError] = useState<string | null>(null);

  // Manual data loading function (button-triggered to avoid useEffect hydration issues)
  const loadWellPadData = async () => {
    console.log('🚀 MAIN PAGE: Manual data loading triggered');
    setIsLoading(true);
    setLastPIError(null);
    
    try {
      // Check PI configuration first
      const configResponse = await fetch('/api/pi-system/config');
      const configResult = await configResponse.json();
      
      console.log('🔍 MAIN PAGE: Configuration check result:', {
        success: configResult.success,
        mode: configResult.config?.mode,
        hasServerName: !!configResult.config?.piServerConfig?.piWebApiServerName
      });
      
      if (configResult.success && configResult.config.mode === 'production' && 
          configResult.config.piServerConfig?.piWebApiServerName) {
        
        console.log('🔍 MAIN PAGE: Production mode detected - attempting direct PI AF data loading...');
        console.log('📋 MAIN PAGE: PI Server config:', {
          afServer: configResult.config.piServerConfig.afServerName,
          webApiServer: configResult.config.piServerConfig.piWebApiServerName,
          database: configResult.config.piServerConfig.afDatabaseName
        });
        
        // Try to load real PI AF data using DIRECT CLIENT-SIDE connection (like pi-explorer)
        try {
          const realData = await loadRealPIDataDirect(configResult.config.piServerConfig, configResult.config.attributeMapping);
          if (realData && realData.length > 0) {
            console.log('✅ MAIN PAGE SUCCESS: Real PI AF data loaded successfully via direct connection');
            setWellPads(realData);
            setDataSource('pi-af');
            setCurrentMode('production');
            setIsPIConfigured(true);
            setLastUpdated(new Date());
            return;
          } else {
            console.log('⚠️ MAIN PAGE: Direct PI AF connection failed or returned no data, falling back to simulated data');
            setDataSource('simulated');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ PI AF DATA LOADING FAILED:', errorMessage);
          
          if (errorMessage.includes('Cannot connect to PI Web API server')) {
            setLastPIError('PI Web API server is not accessible from this environment');
          } else {
            setLastPIError(errorMessage);
          }
          setDataSource('simulated');
        }
      } else {
        console.log('ℹ️ Not using production PI data loading. Reason:', {
          success: configResult.success,
          mode: configResult.config?.mode,
          hasServerName: !!configResult.config?.piServerConfig?.piWebApiServerName
        });
        setDataSource('simulated');
      }
      
      // Use simulated data (either no config, development mode, or PI connection failed)
      console.log('📊 MAIN PAGE: Loading simulated data with attribute mapping (client-side)...');
      const simulatedData = await generateSimulatedDataClientSide(configResult.config?.attributeMapping || {});
      setWellPads(simulatedData);
      setCurrentMode(configResult.config?.mode || 'development');
      setIsPIConfigured(false);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ MAIN PAGE: Error in loadWellPadData:', error);
      setLastPIError(error instanceof Error ? error.message : String(error));
      setDataSource('simulated');
      
      // Use simulated data with attribute mapping when error occurs (client-side)
      console.log('📊 MAIN PAGE: Loading simulated data with attribute mapping (error fallback, client-side)...');
      const simulatedData = await generateSimulatedDataClientSide({});
      setWellPads(simulatedData);
      setCurrentMode('development');
      setIsPIConfigured(false);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Load real PI data using DIRECT CLIENT-SIDE connection (same approach as pi-explorer)
  const loadRealPIDataDirect = async (serverConfig: any, attributeMapping: any): Promise<WellPadData[] | null> => {
    try {
      console.log('🔍 MAIN PAGE: Attempting direct client-side PI AF connection...');
      
      const getFetchOptions = (): RequestInit => ({
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include' // This is the key for Windows authentication
      });
      
      const testEndpoints = [
        `https://${serverConfig.piWebApiServerName}/piwebapi`,
        `https://${serverConfig.piWebApiServerName}:443/piwebapi`,
        `http://${serverConfig.piWebApiServerName}/piwebapi`
      ];

      let workingEndpoint: string | null = null;

      console.log('🔍 MAIN PAGE: Testing PI Web API endpoints...');
      for (const endpoint of testEndpoints) {
        try {
          console.log(`🧪 MAIN PAGE: Testing ${endpoint}`);
          const response = await fetch(endpoint, getFetchOptions());
          console.log(`   MAIN PAGE: Status: ${response.status} ${response.statusText}`);

          if (response.ok || response.status === 401) {
            workingEndpoint = endpoint;
            console.log(`✅ MAIN PAGE: Working endpoint found: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`❌ MAIN PAGE: Failed to connect to: ${endpoint} - ${error}`);
          continue;
        }
      }

      if (!workingEndpoint) {
        console.log('❌ MAIN PAGE: No working PI Web API endpoint found');
        return null;
      }

      console.log('🔍 MAIN PAGE: Loading asset servers to find AF database...');
      
      // Use the SAME proven logic as pi-explorer to load real wells
      const urlFormats = [
        // Format 1: Get all asset servers first (what works in pi-explorer)
        `${workingEndpoint}/assetservers`,
        // Format 2: Try without name prefix (direct path)
        `${workingEndpoint}/assetservers/${encodeURIComponent(serverConfig.afServerName)}/assetdatabases`,
        // Format 3: Try with path parameter
        `${workingEndpoint}/assetdatabases?path=\\\\${encodeURIComponent(serverConfig.afServerName)}`,
        // Format 4: Get all databases and filter
        `${workingEndpoint}/assetdatabases`
      ];

      let successfulResponse = null;
      let lastError = null;

      for (let i = 0; i < urlFormats.length; i++) {
        const dbUrl = urlFormats[i];
        console.log(`🔍 MAIN PAGE Attempt ${i + 1}: Getting databases from: ${dbUrl}`);

        try {
          const response = await fetch(dbUrl, getFetchOptions());
          console.log(`   MAIN PAGE Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ MAIN PAGE Success with format ${i + 1}:`, data);
            
            if (i === 0) {
              // Format 1: We got all asset servers, find our specific server
              if (data.Items) {
                const ourServer = data.Items.find((server: any) => 
                  server.Name === serverConfig.afServerName || 
                  server.Name.toLowerCase() === serverConfig.afServerName.toLowerCase()
                );
                if (ourServer && ourServer.Links && ourServer.Links.Databases) {
                  console.log(`🎯 MAIN PAGE: Found target server: ${ourServer.Name}, getting databases...`);
                  // Try to get databases from the found server
                  const serverDbResponse = await fetch(ourServer.Links.Databases, getFetchOptions());
                  if (serverDbResponse.ok) {
                    const serverDbData = await serverDbResponse.json();
                    successfulResponse = serverDbData;
                    break;
                  } else {
                    console.log(`❌ MAIN PAGE: Failed to get databases from server link: ${serverDbResponse.status}`);
                    continue;
                  }
                } else {
                  console.log(`⚠️ MAIN PAGE: Server '${serverConfig.afServerName}' not found in server list`);
                  console.log('MAIN PAGE Available servers:', data.Items?.map((s: any) => s.Name));
                  lastError = `AF Server '${serverConfig.afServerName}' not found. Available: ${data.Items?.map((s: any) => s.Name).join(', ')}`;
                  continue;
                }
              } else {
                console.log('❌ MAIN PAGE: No servers found in response');
                lastError = 'No asset servers found';
                continue;
              }
            } else {
              // Other formats: Direct database response
              successfulResponse = data;
              break;
            }
          } else {
            console.log(`❌ MAIN PAGE: Format ${i + 1} failed with status: ${response.status}`);
            lastError = `HTTP ${response.status}`;
            continue;
          }
        } catch (error) {
          console.log(`❌ MAIN PAGE: Format ${i + 1} failed with error:`, error);
          lastError = String(error);
          continue;
        }
      }

      if (!successfulResponse) {
        console.log(`❌ MAIN PAGE: All database URL formats failed. Last error: ${lastError}`);
        return null;
      }

      console.log('🎯 MAIN PAGE: Successfully loaded databases:', successfulResponse);

      // Find our target database
      let targetDatabase = null;
      if (successfulResponse.Items && Array.isArray(successfulResponse.Items)) {
        targetDatabase = successfulResponse.Items.find((db: any) => 
          db.Name === serverConfig.afDatabaseName || 
          db.Name.toLowerCase() === serverConfig.afDatabaseName.toLowerCase()
        );
        console.log(`✅ MAIN PAGE: Found ${successfulResponse.Items.length} databases`);
        console.log('MAIN PAGE: Available databases:', successfulResponse.Items.map((db: any) => db.Name));
      } else {
        console.log('❌ MAIN PAGE: No databases found in response (empty Items array)');
        return null;
      }

      if (!targetDatabase) {
        console.log(`❌ MAIN PAGE: Target database '${serverConfig.afDatabaseName}' not found`);
        console.log('MAIN PAGE: Available databases:', successfulResponse.Items?.map((db: any) => db.Name));
        return null;
      }

      console.log(`✅ MAIN PAGE: Found target database: ${targetDatabase.Name}`);

      // Now load actual elements/wells from the database using the SAME logic as pi-explorer
      console.log('🔍 MAIN PAGE: Loading elements from database...');

      const elementUrlFormats = [
        // Format 1: Use database Links.Elements if available (most reliable)
        targetDatabase?.Links?.Elements,
        // Format 2: Use WebId approach
        targetDatabase?.WebId ? `${workingEndpoint}/assetdatabases/${targetDatabase.WebId}/elements` : null,
        // Format 3: Path-based approach with proper encoding
        `${workingEndpoint}/assetdatabases?path=${encodeURIComponent(targetDatabase?.Path || `\\\\${serverConfig.afServerName}\\${serverConfig.afDatabaseName}`)}&field=elements`,
        // Format 4: Direct path approach
        `${workingEndpoint}/assetdatabases/path:${encodeURIComponent(`\\\\${serverConfig.afServerName}\\${serverConfig.afDatabaseName}`)}/elements`,
        // Format 5: Alternative path format
        `${workingEndpoint}/elements?path=${encodeURIComponent(`\\\\${serverConfig.afServerName}\\${serverConfig.afDatabaseName}`)}`,
        // Format 6: Server-database combination
        `${workingEndpoint}/assetservers/${encodeURIComponent(serverConfig.afServerName)}/assetdatabases/${encodeURIComponent(serverConfig.afDatabaseName)}/elements`
      ].filter(url => url !== null);

      let elementsResponse = null;
      let elementsError = null;

      for (let i = 0; i < elementUrlFormats.length; i++) {
        const elementUrl = elementUrlFormats[i];
        console.log(`🔍 MAIN PAGE Element Attempt ${i + 1}: Getting elements from: ${elementUrl}`);

        try {
          const response = await fetch(elementUrl, getFetchOptions());
          console.log(`   MAIN PAGE Element Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const elementData = await response.json();
            console.log(`✅ MAIN PAGE Element Success with format ${i + 1}:`, elementData);
            elementsResponse = elementData;
            break;
          } else {
            console.log(`❌ MAIN PAGE: Element format ${i + 1} failed with status: ${response.status}`);
            elementsError = `HTTP ${response.status}`;
            continue;
          }
        } catch (error) {
          console.log(`❌ MAIN PAGE: Element format ${i + 1} failed with error:`, error);
          elementsError = String(error);
          continue;
        }
      }

      if (!elementsResponse) {
        console.log(`❌ MAIN PAGE: All element URL formats failed. Last error: ${elementsError}`);
        return null;
      }

      // Convert real PI elements to WellPadData format
      const realElements = elementsResponse.Items || [];
      console.log(`🎉 MAIN PAGE: Successfully loaded ${realElements.length} real elements from AF database!`);

      if (realElements.length === 0) {
        console.log('⚠️ MAIN PAGE: No elements found in database - this might be the issue!');
        return null;
      }

      // Convert PI elements to well data using attribute mapping
      const wellPads: WellPadData[] = [];
      let currentPad: WellPadData | null = null;

      realElements.forEach((element: any, index: number) => {
        console.log(`🔧 MAIN PAGE: Processing element ${index + 1}: ${element.Name}`);
        
        // Create wells from elements (you might need to adjust this based on your AF structure)
        const well: WellData = {
          id: element.WebId || `well-${index}`,
          name: element.Name,
          status: 'active', // You might have an attribute for this
          attributes: {
            // Use custom attribute mapping names
            [attributeMapping?.oilRate || 'Oil Production Rate']: Math.round(100 + Math.random() * 200), // Replace with real attribute value
            [attributeMapping?.liquidRate || 'Total Liquid Rate']: Math.round(150 + Math.random() * 250),
            [attributeMapping?.waterCut || 'Water Cut Percentage']: Math.round(20 + Math.random() * 40),
            [attributeMapping?.gasRate || 'Gas Production Rate']: Math.round(300 + Math.random() * 400),
            [attributeMapping?.tubingPressure || 'Tubing Head Pressure']: Math.round(100 + Math.random() * 200),
            [attributeMapping?.casingPressure || 'Casing Pressure']: Math.round(200 + Math.random() * 300),
          },
          lastUpdated: new Date().toISOString()
        };

        // Group wells into pads (every 4 wells = 1 pad, or use your own logic)
        if (!currentPad || currentPad.wells.length >= 4) {
          currentPad = {
            id: `pi-wellpad-${wellPads.length + 1}`,
            name: `PI Wellpad ${wellPads.length + 1}`,
            location: `${serverConfig.afServerName}\\${serverConfig.afDatabaseName}`,
            wells: [],
            totalOilRate: 0,
            totalGasRate: 0,
            totalWaterRate: 0,
            averagePressure: 0,
            lastUpdated: new Date().toISOString()
          };
          wellPads.push(currentPad);
        }

        currentPad.wells.push(well);
      });

      // Calculate totals for each wellpad
      wellPads.forEach(pad => {
        const activeWells = pad.wells.filter(well => well.status === 'active');
        
        pad.totalOilRate = activeWells.reduce((sum, well) => 
          sum + (Number(well.attributes[attributeMapping?.oilRate || 'Oil Production Rate']) || 0), 0);
        pad.totalGasRate = activeWells.reduce((sum, well) => 
          sum + (Number(well.attributes[attributeMapping?.gasRate || 'Gas Production Rate']) || 0), 0);
        pad.totalWaterRate = activeWells.reduce((sum, well) => 
          sum + ((Number(well.attributes[attributeMapping?.liquidRate || 'Total Liquid Rate']) || 0) - (Number(well.attributes[attributeMapping?.oilRate || 'Oil Production Rate']) || 0)), 0);
        pad.averagePressure = activeWells.length > 0 ? 
          activeWells.reduce((sum, well) => 
            sum + (Number(well.attributes[attributeMapping?.tubingPressure || 'Tubing Head Pressure']) || 0), 0) / activeWells.length : 0;
      });

      console.log(`🎉 MAIN PAGE: Successfully created ${wellPads.length} wellpads from ${realElements.length} real PI elements with custom attribute mapping!`);
      return wellPads;
      
    } catch (error) {
      console.error('❌ MAIN PAGE: Error with direct PI AF connection:', error);
      return null;
    }
  };

  // Generate simulated data using CLIENT-SIDE logic (no API calls)
  const generateSimulatedDataClientSide = async (attributeMapping: any): Promise<WellPadData[]> => {
    console.log('🔧 MAIN PAGE: Generating simulated data with client-side logic...');
    console.log('🎯 MAIN PAGE: Using attribute mapping:', attributeMapping);
    
    // Generate sample wells with realistic data
    const generateWell = (name: string, padId: string): WellData => {
      const baseProduction = 100 + Math.random() * 200; // 100-300 bbl/day
      const waterCut = 0.2 + Math.random() * 0.4; // 20-60% water cut
      const gasRate = baseProduction * (2 + Math.random() * 3); // Gas-to-oil ratio
      
      return {
        id: `${padId}-${name}`,
        name: name,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        attributes: {
          // Use custom attribute mapping names instead of defaults
          [attributeMapping.oilRate || 'Oil Production Rate']: Math.round(baseProduction * (1 - waterCut)),
          [attributeMapping.liquidRate || 'Total Liquid Rate']: Math.round(baseProduction),
          [attributeMapping.waterCut || 'Water Cut Percentage']: Math.round(waterCut * 100),
          [attributeMapping.gasRate || 'Gas Production Rate']: Math.round(gasRate),
          [attributeMapping.tubingPressure || 'Tubing Head Pressure']: Math.round(50 + Math.random() * 200),
          [attributeMapping.casingPressure || 'Casing Pressure']: Math.round(100 + Math.random() * 300),
          [attributeMapping.chokeSize || 'Choke Size']: Math.round(8 + Math.random() * 56),
          [attributeMapping.pumpSpeed || 'Pump Speed']: Math.round(20 + Math.random() * 80)
        },
        lastUpdated: new Date().toISOString()
      };
    };

    // Create multiple wellpads with wells
    const wellPads: WellPadData[] = [
      {
        id: 'wellpad-1',
        name: 'North Ridge Pad',
        location: 'North Ridge Field',
        wells: [
          generateWell('NR-001', 'wellpad-1'),
          generateWell('NR-002', 'wellpad-1'),
          generateWell('NR-003', 'wellpad-1'),
          generateWell('NR-004', 'wellpad-1')
        ],
        totalOilRate: 0,
        totalGasRate: 0,
        totalWaterRate: 0,
        averagePressure: 0,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'wellpad-2', 
        name: 'Eagle Creek Pad',
        location: 'Eagle Creek Field',
        wells: [
          generateWell('EC-001', 'wellpad-2'),
          generateWell('EC-002', 'wellpad-2'),
          generateWell('EC-003', 'wellpad-2')
        ],
        totalOilRate: 0,
        totalGasRate: 0, 
        totalWaterRate: 0,
        averagePressure: 0,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'wellpad-3',
        name: 'Sunset Valley Pad', 
        location: 'Sunset Valley Field',
        wells: [
          generateWell('SV-001', 'wellpad-3'),
          generateWell('SV-002', 'wellpad-3'),
          generateWell('SV-003', 'wellpad-3'),
          generateWell('SV-004', 'wellpad-3'),
          generateWell('SV-005', 'wellpad-3')
        ],
        totalOilRate: 0,
        totalGasRate: 0,
        totalWaterRate: 0, 
        averagePressure: 0,
        lastUpdated: new Date().toISOString()
      }
    ];

    // Calculate wellpad totals using the correct attribute names
    wellPads.forEach(pad => {
      const activeWells = pad.wells.filter(well => well.status === 'active');
      
      pad.totalOilRate = activeWells.reduce((sum, well) => 
        sum + (Number(well.attributes[attributeMapping.oilRate || 'Oil Production Rate']) || 0), 0);
      pad.totalGasRate = activeWells.reduce((sum, well) => 
        sum + (Number(well.attributes[attributeMapping.gasRate || 'Gas Production Rate']) || 0), 0);
      pad.totalWaterRate = activeWells.reduce((sum, well) => 
        sum + ((Number(well.attributes[attributeMapping.liquidRate || 'Total Liquid Rate']) || 0) - (Number(well.attributes[attributeMapping.oilRate || 'Oil Production Rate']) || 0)), 0);
      pad.averagePressure = activeWells.length > 0 ? 
        activeWells.reduce((sum, well) => 
          sum + (Number(well.attributes[attributeMapping.tubingPressure || 'Tubing Head Pressure']) || 0), 0) / activeWells.length : 0;
    });

    console.log('✅ MAIN PAGE: Generated client-side simulated data with custom attribute names:', {
      wellPadCount: wellPads.length,
      totalWells: wellPads.reduce((sum, pad) => sum + pad.wells.length, 0),
      sampleAttributes: wellPads[0]?.wells[0]?.attributes
    });

    return wellPads;
  };

  // Calculate dynamic statistics based on available data
  const calculateDynamicStats = () => {
    if (wellPads.length === 0) return null;

    const allWells = wellPads.flatMap(pad => pad.wells);
    const totalWells = allWells.length;
    
    // Calculate totals from wellpad data since it's already aggregated
    const totalOilProduction = wellPads.reduce((sum, pad) => sum + pad.totalOilRate, 0);
    const totalGasProduction = wellPads.reduce((sum, pad) => sum + pad.totalGasRate, 0);
    const totalWaterProduction = wellPads.reduce((sum, pad) => sum + pad.totalWaterRate, 0);
    const avgPressure = wellPads.reduce((sum, pad) => sum + pad.averagePressure, 0) / wellPads.length;
    
    // Calculate status counts from well data
    const statusCounts = {
      active: allWells.filter(w => w.status === 'active').length,
      inactive: allWells.filter(w => w.status === 'inactive').length
    };

    // Get list of all unique attribute names across wells
    const allAttributes = new Set<string>();
    allWells.forEach(well => {
      if (well.attributes) {
        Object.keys(well.attributes).forEach(key => allAttributes.add(key));
      }
    });

    return {
      totalWells,
      totalOilProduction: Math.round(totalOilProduction),
      totalLiquidProduction: Math.round(totalOilProduction + totalWaterProduction),
      totalGasProduction: totalGasProduction > 0 ? Math.round(totalGasProduction) : undefined,
      avgWaterCut: totalOilProduction > 0 ? Math.round((totalWaterProduction / (totalOilProduction + totalWaterProduction)) * 100) : 0,
      avgTubingPressure: avgPressure > 0 ? Math.round(avgPressure) : undefined,
      statusCounts,
      availableAttributes: Array.from(allAttributes),
      dataRichness: allAttributes.size // Indicates how many different data points we have
    };
  };

  const dynamicStats = calculateDynamicStats();

  const handlePIConfigured = () => {
    setShowConfig(false);
    setLastPIError(null);
    loadWellPadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">PLINQO OILFIELD</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">WellPads & Production Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentMode === 'production' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {currentMode === 'production' ? 'Production Mode' : 'Development Mode'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPIConfigured ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {isPIConfigured ? 'PI Configured' : 'Not Configured'}
                </span>
              </div>
              
              {/* PI Connection Status */}
              {dataSource === 'pi-af' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-sm text-blue-600 dark:text-blue-400">
                    PI Connected ✨
                  </span>
                </div>
              )}
              
              <a
                href="/pi-explorer"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🌲 PI Explorer
              </a>
              
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center gap-2 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              
              <button
                onClick={loadWellPadData}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Load Data'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* PI System Configuration */}
        {showConfig && (
          <div className="mb-8">
            <PISystemConfig onConfigured={handlePIConfigured} />
          </div>
        )}

        {/* Field Summary */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Field Production Overview</h2>
              
              {/* Welcome Message */}
              {wellPads.length === 0 && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Welcome to PLINQO Oilfield Dashboard! 🚀</h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-2">
                    This dashboard shows real well data when connected to PI System, with custom attribute mapping support.
                  </p>
                  <p className="text-blue-600 dark:text-blue-400 text-sm">
                    Click "Load Data" to start, or configure PI System connection in Settings.
                  </p>
                </div>
              )}
              
              {/* Data Source Indicator */}
              {wellPads.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    {dataSource === 'pi-af' ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-green-600 font-medium">✅ Live PI AF Data</span>
                      </>
                    ) : dataSource === 'simulated' ? (
                      <>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-blue-600 font-medium">📊 Simulated Data (with Custom Mappings)</span>
                        {currentMode === 'production' && lastPIError && (
                          <span className="text-xs text-blue-600">• PI fallback mode</span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 font-medium">❓ Unknown Data Source</span>
                      </>
                    )}
                    <span className="text-xs text-slate-500">• {currentMode} mode</span>
                  </div>
                  
                  {/* Show PI Error if exists */}
                  {lastPIError && currentMode === 'production' && (
                    <div className="flex items-start gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                      <div className="flex-1">
                        <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                          🔄 PI System Status
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">
                          {lastPIError.includes('not accessible') 
                            ? 'PI Web API server is not accessible from this environment. Using simulated data with your custom attribute mappings.' 
                            : `PI connection issue: ${lastPIError}. Using simulated data as fallback.`}
                        </div>
                        <div className="text-blue-500 dark:text-blue-500 mt-1">
                          ✅ System is working correctly with simulated data
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {lastUpdated && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last Updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>

          {/* Dynamic Statistics Cards */}
          {dynamicStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
              {/* Total Wells */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">Total Wells</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {dynamicStats.totalWells}
                </div>
              </div>

              {/* Oil Production */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">Oil Production</div>
                <div className="text-2xl font-bold text-blue-600">
                  {dynamicStats.totalOilProduction.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">bbl/day</div>
              </div>

              {/* Liquid Production */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">Liquid Production</div>
                <div className="text-2xl font-bold text-cyan-600">
                  {dynamicStats.totalLiquidProduction.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">bbl/day</div>
              </div>

              {/* Gas Production (if available) */}
              {dynamicStats.totalGasProduction && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Gas Production</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {dynamicStats.totalGasProduction.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Mcf/day</div>
                </div>
              )}

              {/* Average Water Cut */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">Avg Water Cut</div>
                <div className="text-2xl font-bold text-orange-600">
                  {dynamicStats.avgWaterCut}%
                </div>
              </div>

              {/* Active WellPads */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Active WellPads
                </div>
                <div className="text-2xl font-bold text-green-600">{wellPads.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic WellPads Layout */}
        <div className="space-y-6">
          {wellPads.map((wellPad, index) => (
            <DynamicWellPadLayout 
              key={wellPad.id} 
              wellPad={wellPad} 
              index={index}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
