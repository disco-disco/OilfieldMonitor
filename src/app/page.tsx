'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets, TrendingUp, TrendingDown, CheckCircle, Zap, Settings, RefreshCw, BarChart3, Activity } from "lucide-react";
import PISystemConfig from '@/components/PISystemConfig';
import DynamicWellPadLayout from '@/components/DynamicWellPadLayout';
import { WellPadData, WellData, AttributeMapping } from '@/types/pi-system';

export default function Home() {
  const [wellPads, setWellPads] = useState<WellPadData[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPIConfigured, setIsPIConfigured] = useState(false);
  const [currentMode, setCurrentMode] = useState<'development' | 'production'>('development');
  const [dataSource, setDataSource] = useState<'pi-af' | 'simulated' | 'unknown'>('unknown');
  const [lastPIError, setLastPIError] = useState<string | null>(null);

  // Load wellpad data
  const loadWellPadData = useCallback(async () => {
    setIsLoading(true);
    setLastPIError(null); // Clear previous errors
    
    try {
      // Check if we have a working PI configuration first
      const configResponse = await fetch('/api/pi-system/config');
      const configResult = await configResponse.json();
      
      if (configResult.success && configResult.config.mode === 'production' && 
          configResult.config.piServerConfig?.piWebApiServerName) {
        
        console.log('🔍 Production mode detected - attempting PI AF data loading...');
        console.log('📋 Config validation:', {
          success: configResult.success,
          mode: configResult.config.mode,
          hasServerName: !!configResult.config.piServerConfig?.piWebApiServerName,
          config: configResult.config
        });
        
        // Try to load real PI AF data
        try {
          const realData = await loadRealPIData(configResult.config);
          if (realData && realData.length > 0) {
            console.log('✅ SUCCESS: Real PI AF data loaded successfully');
            setWellPads(realData);
            setDataSource('pi-af');
            setLastUpdated(new Date());
            return;
          } else {
            console.log('⚠️ PI AF connection failed or returned no data, falling back to simulated data');
            setDataSource('simulated');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ PI AF DATA LOADING FAILED:', errorMessage);
          
          // Set a more user-friendly error message
          if (errorMessage.includes('Cannot connect to PI Web API server')) {
            setLastPIError('PI Web API server is not accessible from this environment');
          } else {
            setLastPIError(errorMessage);
          }
          
          // Use simulated data because PI AF failed
          console.log('❌ Using simulated data because PI AF failed');
          setDataSource('simulated');
        }
      } else {
        console.log('ℹ️ Not using production PI data loading. Reason:', {
          success: configResult.success,
          mode: configResult.config?.mode,
          hasServerName: !!configResult.config?.piServerConfig?.piWebApiServerName,
          fullConfig: configResult
        });
        setDataSource('simulated');
      }
      
      // Use simulated data (either no config, development mode, or PI connection failed)
      console.log('📊 Loading simulated data with attribute mapping...');
      const simulatedData = await generateSimulatedDataWithMapping();
      setWellPads(simulatedData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error in loadWellPadData:', error);
      setLastPIError(error instanceof Error ? error.message : String(error));
      setDataSource('simulated');
      
      // Use simulated data with attribute mapping when error occurs
      console.log('📊 Loading simulated data with attribute mapping (error fallback)...');
      const simulatedData = await generateSimulatedDataWithMapping();
      setWellPads(simulatedData);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load real PI data using the API endpoint
  const loadRealPIData = async (config: any): Promise<WellPadData[] | null> => {
    try {
      console.log('🔍 Attempting to load real PI AF data via API...');
      
      const response = await fetch('/api/pi-system/load-data');
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log(`🎉 Successfully loaded ${result.data.length} wellpads from PI AF`);
        return result.data;
      } else {
        console.log(`⚠️ PI AF data loading failed: ${result.error}`);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error calling PI AF data API:', error);
      return null;
    }
  };

  // Generate simulated data using API endpoint with attribute mapping
  const generateSimulatedDataWithMapping = async (): Promise<WellPadData[]> => {
    try {
      console.log('🔧 Loading simulated data with attribute mapping via API...');
      
      const response = await fetch('/api/pi-system/simulated-data');
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('🎯 Successfully loaded simulated data with attribute mapping:', result.attributeMapping);
        return result.data;
      } else {
        console.log('⚠️ Failed to load simulated data via API, using empty fallback');
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading simulated data via API:', error);
      return [];
    }
  };

  // Calculate dynamic statistics based on available data
  const calculateDynamicStats = useCallback(() => {
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
  }, [wellPads]);

  const dynamicStats = calculateDynamicStats();

  // Check PI configuration on load
  useEffect(() => {
    const checkPIConfig = async () => {
      try {
        const response = await fetch('/api/pi-system/config');
        const result = await response.json();
        
        if (result.success && result.config) {
          setIsPIConfigured(result.config.isPIConfigured);
          setCurrentMode(result.config.mode || 'development');
        } else {
          setIsPIConfigured(false);
          setCurrentMode('development');
        }
      } catch (error) {
        console.error('Error checking PI config:', error);
        setIsPIConfigured(false);
        setCurrentMode('development');
      }
    };

    checkPIConfig();
    loadWellPadData();
  }, [loadWellPadData]);

  const handlePIConfigured = () => {
    setShowConfig(false);
    setLastPIError(null); // Clear any previous errors
    
    // Reload configuration status
    const checkPIConfig = async () => {
      try {
        const response = await fetch('/api/pi-system/config');
        const result = await response.json();
        
        if (result.success && result.config) {
          setIsPIConfigured(result.config.isPIConfigured);
          setCurrentMode(result.config.mode || 'development');
        }
      } catch (error) {
        console.error('Error checking PI config:', error);
      }
    };
    
    checkPIConfig();
    loadWellPadData();
  };

  const handleRefresh = () => {
    setLastPIError(null); // Clear any previous errors
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
                href="/debug"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🔍 Debug
              </a>
              
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
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
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
              {/* Data Source Indicator */}
              {wellPads.length > 0 && (
                <div className="space-y-1">
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
                  
                  {/* Development Mode Info */}
                  {currentMode === 'development' && dataSource === 'simulated' && (
                    <div className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800 mt-1">
                      ℹ️ Development Mode: Using simulated data with custom attribute mappings from pi-config.json
                    </div>
                  )}
                  
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            {/* Total Wells */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Wells</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {dynamicStats?.totalWells || 0}
              </div>
            </div>

            {/* Oil Production */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Oil Production</div>
              <div className="text-2xl font-bold text-blue-600">
                {dynamicStats?.totalOilProduction.toLocaleString() || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">bbl/day</div>
            </div>

            {/* Liquid Production */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Liquid Production</div>
              <div className="text-2xl font-bold text-cyan-600">
                {dynamicStats?.totalLiquidProduction.toLocaleString() || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">bbl/day</div>
            </div>

            {/* Gas Production (if available) */}
            {dynamicStats?.totalGasProduction && (
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
                {dynamicStats?.avgWaterCut || 0}%
              </div>
            </div>

            {/* Well Status Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Well Status</div>
              <div className="flex items-center gap-2 mt-1">
                {(dynamicStats?.statusCounts?.inactive || 0) > 0 && (
                  <span className="text-sm font-bold text-red-600">
                    {dynamicStats?.statusCounts?.inactive} ⚠️
                  </span>
                )}
                <span className="text-sm font-bold text-green-600">
                  {dynamicStats?.statusCounts?.active || 0} ✅
                </span>
              </div>
            </div>

            {/* Average Tubing Pressure (if available) */}
            {dynamicStats?.avgTubingPressure && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">Avg Tubing P</div>
                <div className="text-2xl font-bold text-orange-500">
                  {dynamicStats.avgTubingPressure}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">psi</div>
              </div>
            )}

            {/* Data Richness Indicator */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Data Points
              </div>
              <div className="text-2xl font-bold text-indigo-600">
                {dynamicStats?.dataRichness || 0}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">attributes</div>
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
        </div>

        {/* Dynamic WellPads Layout */}
        <div className="space-y-6">
          {wellPads.map((wellPad, index) => (
            <DynamicWellPadLayout 
              key={index} 
              wellPad={wellPad} 
              index={index}
            />
          ))}
          
          {/* Empty State */}
          {wellPads.length === 0 && !isLoading && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="text-slate-400 dark:text-slate-500 mb-4">
                <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Well Data Available</h3>
                <p className="text-sm">
                  {currentMode === 'production' 
                    ? 'Configure PI System connection to load real well data' 
                    : 'Switch to production mode to connect to PI System'}
                </p>
              </div>
              <button
                onClick={() => setShowConfig(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Configure PI System
              </button>
            </div>
          )}

          {/* Data Source and Template Information */}
          {wellPads.length > 0 && dynamicStats && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Layout Adaptation:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    Dynamic grid based on {dynamicStats.totalWells} wells
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Attribute Coverage:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {dynamicStats.dataRichness} unique data points
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Available Attributes:</span>
                  <span className="ml-2 text-xs text-slate-600 dark:text-slate-300">
                    {dynamicStats.availableAttributes.slice(0, 5).join(', ')}
                    {dynamicStats.availableAttributes.length > 5 && ` +${dynamicStats.availableAttributes.length - 5} more`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}