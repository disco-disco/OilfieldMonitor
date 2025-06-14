'use client';

import { useState } from 'react';
import { Droplets, RefreshCw, Settings, Activity, Shield } from "lucide-react";
import PISystemConfig from '@/components/PISystemConfig';

// Simple working dashboard that avoids hydration issues
export default function Home() {
  const [wellPads, setWellPads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<string>('unknown');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentMode, setCurrentMode] = useState<string>('development');
  const [lastPIError, setLastPIError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isPIConfigured, setIsPIConfigured] = useState(false);
  const [authTestResult, setAuthTestResult] = useState<any>(null);

  // Simple button click handler that definitely works
  const handleLoadData = async () => {
    console.log('🚀 BUTTON CLICKED: Load Data button was clicked!');
    setIsLoading(true);
    setLastPIError(null);
    
    try {
      console.log('🔍 Loading PI configuration...');
      const configResponse = await fetch('/api/pi-system/config');
      const configResult = await configResponse.json();
      
      console.log('🔍 Configuration result:', configResult);
      
      if (configResult.success && configResult.config.mode === 'production' && 
          configResult.config.piServerConfig?.piWebApiServerName) {
        
        console.log('🔍 Production mode detected - attempting to load data from PI AF via API...');
        
        // Use the proper API endpoint that handles PI AF service integration
        const apiResponse = await fetch('/api/pi-system/load-data');
        const apiResult = await apiResponse.json();
        
        if (apiResult.success && apiResult.data && apiResult.data.length > 0) {
          console.log('✅ SUCCESS: Real PI AF data loaded via API!');
          setWellPads(apiResult.data);
          setDataSource('pi-af');
          setCurrentMode('production');
          setLastUpdated(new Date());
          return;
        } else {
          console.log('⚠️ API returned no data or error, falling back to simulated data');
          console.log('API result:', apiResult);
          setDataSource('simulated');
        }
      } else {
        console.log('ℹ️ Not production mode, using simulated data');
        setDataSource('simulated');
      }
      
      // Generate simulated data
      console.log('📊 Generating simulated data...');
      const simulatedData = generateSimulatedWells(configResult.config?.attributeMapping || {});
      setWellPads(simulatedData);
      setCurrentMode(configResult.config?.mode || 'development');
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('❌ Error in handleLoadData:', error);
      setLastPIError(error instanceof Error ? error.message : String(error));
      setDataSource('simulated');
      
      // Fallback simulated data
      const fallbackData = generateSimulatedWells({});
      setWellPads(fallbackData);
      setCurrentMode('development');
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Test Windows Authentication
  const handleTestWindowsAuth = async () => {
    console.log('🔐 Testing Windows Authentication...');
    setIsLoading(true);
    setAuthTestResult(null);
    
    try {
      const response = await fetch('/api/pi-system/test-windows-auth');
      const result = await response.json();
      
      console.log('🔐 Windows Auth Test Results:', result);
      setAuthTestResult(result);
      
      // Display results in browser console and alert
      if (result.success) {
        console.log('✅ Windows Authentication Test PASSED');
        console.log(`📊 Summary: ${result.summary.workingEndpoints}/${result.summary.totalEndpointsTested} endpoints working`);
        if (result.summary.bestEndpoint) {
          console.log(`🎯 Best endpoint: ${result.summary.bestEndpoint}`);
        }
      } else {
        console.log('❌ Windows Authentication Test FAILED');
        console.log('💡 Recommendations:', result.recommendations);
      }
      
      // Show platform info
      console.log('🖥️ Platform Info:', result.platformInfo);
      
    } catch (error) {
      console.error('❌ Windows Auth test error:', error);
      setAuthTestResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate simulated wells
  const generateSimulatedWells = (attributeMapping: any) => {
    console.log('🔧 Generating simulated wells...');
    
    const wells = [];
    for (let i = 1; i <= 8; i++) {
      wells.push({
        id: `sim-well-${i}`,
        name: `Well ${i}`,
        status: 'active',
        attributes: {
          [attributeMapping.oilRate || 'Oil Production Rate']: Math.round(100 + Math.random() * 200),
          [attributeMapping.liquidRate || 'Total Liquid Rate']: Math.round(150 + Math.random() * 250),
          [attributeMapping.waterCut || 'Water Cut Percentage']: Math.round(20 + Math.random() * 40),
          [attributeMapping.gasRate || 'Gas Production Rate']: Math.round(300 + Math.random() * 400),
          [attributeMapping.tubingPressure || 'Tubing Head Pressure']: Math.round(100 + Math.random() * 200),
          [attributeMapping.casingPressure || 'Casing Pressure']: Math.round(200 + Math.random() * 300),
        },
        lastUpdated: new Date().toISOString()
      });
    }

    const wellPads = [
      {
        id: 'wellpad-1',
        name: 'North Ridge Pad',
        location: 'North Ridge Field',
        wells: wells.slice(0, 4),
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
        wells: wells.slice(4, 8),
        totalOilRate: 0,
        totalGasRate: 0,
        totalWaterRate: 0,
        averagePressure: 0,
        lastUpdated: new Date().toISOString()
      }
    ];

    console.log(`✅ Generated ${wellPads.length} simulated wellpads with ${wells.length} wells`);
    return wellPads;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Oilfield Monitoring Dashboard</h1>
                <p className="text-sm text-slate-500">WellPads & Production Monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentMode === 'production' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
                <span className="text-sm text-slate-600">
                  {currentMode === 'production' ? 'Production Mode' : 'Development Mode'}
                </span>
              </div>
              
              {dataSource === 'pi-af' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-sm text-blue-600">PI Connected ✨</span>
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
                className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                {showConfig ? 'Hide Settings' : 'Settings'}
              </button>
              
              <button
                onClick={handleLoadData}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Load Data'}
              </button>
              
              <button
                onClick={handleTestWindowsAuth}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <Shield className="w-4 h-4" />
                Test Auth
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showConfig && (
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-6 py-6">
            <PISystemConfig 
              onConfigured={() => {
                setIsPIConfigured(true);
                setShowConfig(false);
              }} 
            />
          </div>
        </div>
      )}

      {/* Windows Authentication Test Results */}
      {authTestResult && (
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-6 py-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Windows Authentication Test Results
            </h3>
            
            {authTestResult.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-900">✅ Authentication Test PASSED</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>📊 Working Endpoints: {authTestResult.summary?.workingEndpoints}/{authTestResult.summary?.totalEndpointsTested}</p>
                  <p>🔐 Auth Required: {authTestResult.summary?.authRequiredEndpoints} endpoints need Windows Authentication</p>
                  {authTestResult.summary?.bestEndpoint && (
                    <p>🎯 Best Endpoint: <code className="bg-green-100 px-1 rounded">{authTestResult.summary.bestEndpoint}</code></p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="font-medium text-red-900">❌ Authentication Test FAILED</span>
                </div>
                <div className="text-sm text-red-700 space-y-1">
                  {authTestResult.error && <p>Error: {authTestResult.error}</p>}
                  {authTestResult.recommendations && (
                    <div>
                      <p className="font-medium mt-2">💡 Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {authTestResult.recommendations.slice(0, 5).map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {authTestResult.platformInfo && (
              <div className="mt-4 p-3 bg-gray-50 rounded border text-sm">
                <p><strong>Platform:</strong> {authTestResult.platformInfo.platform}</p>
                <p><strong>Windows Auth Supported:</strong> {authTestResult.platformInfo.supportsWindowsAuth ? '✅ Yes' : '❌ No'}</p>
              </div>
            )}
            
            <button 
              onClick={() => setAuthTestResult(null)}
              className="mt-3 text-sm text-gray-600 hover:text-gray-800"
            >
              ✕ Close Results
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Field Production Overview</h2>
          
          {/* Welcome Message */}
          {wellPads.length === 0 && (
            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Welcome to Oilfield Monitoring Dashboard! 🚀</h3>
              <p className="text-blue-700 text-sm mb-2">
                This dashboard loads real well data from PI System when configured in production mode.
              </p>
              <p className="text-blue-600 text-sm">
                Click "Load Data" to start loading your wells from your configured AF database.
              </p>
            </div>
          )}

          {/* Data Source Info */}
          {wellPads.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {dataSource === 'pi-af' ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-600 font-medium">✅ Live PI AF Data ({wellPads.length} wellpads loaded)</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-blue-600 font-medium">📊 Simulated Data ({wellPads.length} wellpads)</span>
                  </>
                )}
              </div>
              {lastUpdated && (
                <div className="text-xs text-slate-500">
                  Last Updated: {lastUpdated.toLocaleString()}
                </div>
              )}
              {lastPIError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-2">
                  PI Error: {lastPIError}
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          {wellPads.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-500">Total Wells</div>
                <div className="text-2xl font-bold text-slate-900">
                  {wellPads.reduce((sum, pad) => sum + pad.wells.length, 0)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-500">Active WellPads</div>
                <div className="text-2xl font-bold text-green-600">{wellPads.length}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-500">Data Source</div>
                <div className="text-lg font-bold text-blue-600">
                  {dataSource === 'pi-af' ? 'PI AF' : 'Simulated'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-500">Mode</div>
                <div className="text-lg font-bold text-purple-600">{currentMode}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Status
                </div>
                <div className="text-lg font-bold text-green-600">
                  {isLoading ? 'Loading...' : 'Ready'}
                </div>
              </div>
            </div>
          )}

          {/* WellPads Display */}
          <div className="space-y-6">
            {wellPads.map((wellPad) => (
              <div key={wellPad.id} className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{wellPad.name}</h3>
                    <p className="text-sm text-slate-500">{wellPad.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500">Wells</div>
                    <div className="text-2xl font-bold text-blue-600">{wellPad.wells.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {wellPad.wells.map((well: any) => (
                    <div key={well.id} className="bg-slate-50 rounded-lg p-4 border">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-slate-900">{well.name}</h4>
                        <div className={`w-3 h-3 rounded-full ${well.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <div className="space-y-1 text-xs">
                        {Object.entries(well.attributes).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-slate-600 truncate">{key}:</span>
                            <span className="font-medium text-slate-900">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
