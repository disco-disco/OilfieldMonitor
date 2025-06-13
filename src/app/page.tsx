'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets, TrendingUp, TrendingDown, CheckCircle, Zap, Settings, RefreshCw, BarChart3, Activity } from "lucide-react";
import PISystemConfig from '@/components/PISystemConfig';
import DynamicWellPadLayout from '@/components/DynamicWellPadLayout';
import { WellPadData, WellData, AttributeMapping } from '@/types/pi-system';
import { PIAFService } from '@/services/pi-af-service';

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
            throw new Error('PI AF service returned no data');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('❌ PI AF DATA LOADING FAILED:', errorMessage);
          setLastPIError(errorMessage);
          
          // IMPORTANT: Don't fall back silently - let user know PI failed
          console.log('❌ Using simulated data because PI AF failed');
          setDataSource('simulated');
        }
      } else {
        console.log('ℹ️ Development mode or no PI configuration - using simulated data');
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

  // Load real PI data using the new PI AF service
  const loadRealPIData = async (config: any): Promise<WellPadData[] | null> => {
    try {
      console.log('🔍 Attempting to load real PI AF data...');
      
      // Validate required configuration
      if (!config.piServerConfig || !config.piServerConfig.afServerName || 
          !config.piServerConfig.piWebApiServerName || !config.piServerConfig.afDatabaseName) {
        console.log('❌ Incomplete PI configuration for real data loading');
        return null;
      }

      // Create PI AF service instance with custom attribute mapping
      const piafService = new PIAFService(config.piServerConfig, config.attributeMapping);
      
      // Load wellpad data from PI AF
      const wellPads = await piafService.loadWellPadData();
      
      if (wellPads && wellPads.length > 0) {
        console.log(`🎉 Successfully loaded ${wellPads.length} wellpads from PI AF`);
        return wellPads;
      } else {
        console.log('⚠️ No wellpad data found in PI AF, falling back to simulated data');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error loading real PI AF data:', error);
      return null;
    }
  };

  // Generate simulated data using PI AF service with attribute mapping
  const generateSimulatedDataWithMapping = async (): Promise<WellPadData[]> => {
    try {
      console.log('🔧 Generating simulated data with attribute mapping...');
      
      // Get configuration (including attribute mapping) via API
      const response = await fetch('/api/pi-system/config');
      const result = await response.json();
      
      if (result.success && result.config && result.config.attributeMapping) {
        console.log('🎯 Using custom attribute mapping for simulated data:', result.config.attributeMapping);
        // Generate enhanced simulated data that respects attribute mapping
        return generateSimulatedDataWithAttributeMapping(result.config.attributeMapping);
      } else {
        console.log('⚠️ No attribute mapping found, using default simulated data');
        return generateSimulatedData();
      }
    } catch (error) {
      console.error('❌ Error generating simulated data with mapping:', error);
      return generateSimulatedData();
    }
  };

  // Generate enhanced simulated data that reflects the custom attribute mapping
  const generateSimulatedDataWithAttributeMapping = (attributeMapping: AttributeMapping): WellPadData[] => {
    console.log('🎯 Using custom attribute mapping for simulated data:', attributeMapping);
    
    const wellPads: WellPadData[] = [];
    
    for (let padNum = 1; padNum <= 10; padNum++) {
      const wellCount = Math.floor(Math.random() * 11) + 10;
      const wells: WellData[] = [];
      
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
        
        // Create base well with core attributes
        const baseWell: WellData = {
          name: `PL-${wellNumber.toString().padStart(3, '0')}`,
          wellPadName: `WellPad ${padNum.toString().padStart(2, '0')}`,
          oilRate,
          liquidRate,
          waterCut,
          espFrequency,
          planTarget,
          planDeviation: Math.round(deviation * 10) / 10,
          status,
          lastUpdate: new Date()
        };

        // Add extended attributes based on what's configured in attribute mapping
        // This shows that the mapping is being used and makes the data more realistic
        if (attributeMapping.gasRate) {
          console.log(`   ✅ Adding gasRate (mapped to "${attributeMapping.gasRate}")`);
          baseWell.gasRate = Math.floor(Math.random() * 500) + 100;
        }
        if (attributeMapping.tubingPressure) {
          console.log(`   ✅ Adding tubingPressure (mapped to "${attributeMapping.tubingPressure}")`);
          baseWell.tubingPressure = Math.floor(Math.random() * 200) + 800;
        }
        if (attributeMapping.casingPressure) {
          baseWell.casingPressure = Math.floor(Math.random() * 300) + 600;
        }
        if (attributeMapping.temperature) {
          baseWell.temperature = Math.floor(Math.random() * 50) + 180;
        }
        if (attributeMapping.flowlinePressure) {
          baseWell.flowlinePressure = Math.floor(Math.random() * 150) + 400;
        }
        if (attributeMapping.chokeSize) {
          baseWell.chokeSize = Math.floor(Math.random() * 16) + 8;
        }
        if (attributeMapping.motorAmps) {
          baseWell.motorAmps = Math.floor(Math.random() * 30) + 20;
        }

        // Add some random additional attributes for wells that have extended mapping
        if (Math.random() > 0.8 && Object.keys(attributeMapping).length > 5) {
          baseWell.customAttributes = {
            'Pump_Intake_Pressure': Math.floor(Math.random() * 100) + 300,
            'Surface_Temperature': Math.floor(Math.random() * 20) + 60,
          };
        }

        wells.push(baseWell);
      }
      
      const avgOilRate = wells.reduce((sum, w) => sum + w.oilRate, 0) / wells.length;
      const avgWaterCut = wells.reduce((sum, w) => sum + w.waterCut, 0) / wells.length;
      const status = wells.some(w => w.status === 'alert') ? 'alert' : 
                    wells.some(w => w.status === 'warning') ? 'warning' : 'good';
      
      wellPads.push({
        name: `WellPad ${padNum.toString().padStart(2, '0')}`,
        wells,
        status,
        totalWells: wells.length,
        activeWells: wells.filter(w => w.status !== 'alert').length,
        avgOilRate,
        avgWaterCut,
        isConnectedToPI: false
      });
    }
    
    console.log(`🎉 Generated ${wellPads.length} wellpads with custom attribute mapping`);
    return wellPads;
  };

  // Calculate dynamic statistics based on available data
  const calculateDynamicStats = useCallback(() => {
    if (wellPads.length === 0) return null;

    const allWells = wellPads.flatMap(pad => pad.wells);
    const totalWells = allWells.length;
    const totalOilProduction = wellPads.reduce((sum, pad) => sum + (pad.avgOilRate * pad.totalWells), 0);
    const totalLiquidProduction = allWells.reduce((sum, well) => sum + well.liquidRate, 0);
    const avgWaterCut = wellPads.reduce((sum, pad) => sum + pad.avgWaterCut, 0) / wellPads.length;
    
    // Calculate extended statistics if data is available
    const wellsWithGasRate = allWells.filter(well => well.gasRate !== undefined);
    const totalGasProduction = wellsWithGasRate.reduce((sum, well) => sum + (well.gasRate || 0), 0);
    
    const wellsWithTubingPressure = allWells.filter(well => well.tubingPressure !== undefined);
    const avgTubingPressure = wellsWithTubingPressure.length > 0 
      ? wellsWithTubingPressure.reduce((sum, well) => sum + (well.tubingPressure || 0), 0) / wellsWithTubingPressure.length
      : undefined;

    const wellsWithTemperature = allWells.filter(well => well.temperature !== undefined);
    const avgTemperature = wellsWithTemperature.length > 0
      ? wellsWithTemperature.reduce((sum, well) => sum + (well.temperature || 0), 0) / wellsWithTemperature.length
      : undefined;

    const statusCounts = {
      good: allWells.filter(w => w.status === 'good').length,
      warning: allWells.filter(w => w.status === 'warning').length,
      alert: allWells.filter(w => w.status === 'alert').length
    };

    // Get list of all unique attributes across wells for analytics
    const allAttributes = new Set<string>();
    allWells.forEach(well => {
      Object.keys(well).forEach(key => {
        if (typeof well[key as keyof WellData] === 'number' && key !== 'planDeviation') {
          allAttributes.add(key);
        }
      });
      if (well.customAttributes) {
        Object.keys(well.customAttributes).forEach(key => allAttributes.add(`custom_${key}`));
      }
    });

    return {
      totalWells,
      totalOilProduction: Math.round(totalOilProduction),
      totalLiquidProduction: Math.round(totalLiquidProduction),
      totalGasProduction: totalGasProduction > 0 ? Math.round(totalGasProduction) : undefined,
      avgWaterCut: Math.round(avgWaterCut),
      avgTubingPressure: avgTubingPressure ? Math.round(avgTubingPressure) : undefined,
      avgTemperature: avgTemperature ? Math.round(avgTemperature) : undefined,
      statusCounts,
      availableAttributes: Array.from(allAttributes),
      dataRichness: allAttributes.size // Indicates how many different data points we have
    };
  }, [wellPads]);

  const dynamicStats = calculateDynamicStats();
  const generateSimulatedData = (): WellPadData[] => {
    const wellPads: WellPadData[] = [];
    
    for (let padNum = 1; padNum <= 10; padNum++) {
      const wellCount = Math.floor(Math.random() * 11) + 10;
      const wells: WellData[] = [];
      
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
        
        // Add some enhanced simulated attributes to demonstrate dynamic layout
        const baseWell: WellData = {
          name: `PL-${wellNumber.toString().padStart(3, '0')}`,
          wellPadName: `WellPad ${padNum.toString().padStart(2, '0')}`,
          oilRate,
          liquidRate,
          waterCut,
          espFrequency,
          planTarget,
          planDeviation: Math.round(deviation * 10) / 10,
          status,
          lastUpdate: new Date()
        };

        // Randomly add extended attributes to some wells to show dynamic adaptation
        if (Math.random() > 0.3) { // 70% chance
          baseWell.gasRate = Math.floor(Math.random() * 500) + 100;
        }
        if (Math.random() > 0.4) { // 60% chance
          baseWell.tubingPressure = Math.floor(Math.random() * 200) + 800;
        }
        if (Math.random() > 0.5) { // 50% chance
          baseWell.casingPressure = Math.floor(Math.random() * 300) + 600;
        }
        if (Math.random() > 0.6) { // 40% chance
          baseWell.temperature = Math.floor(Math.random() * 50) + 180;
        }
        if (Math.random() > 0.7) { // 30% chance
          baseWell.flowlinePressure = Math.floor(Math.random() * 150) + 400;
        }
        if (Math.random() > 0.8) { // 20% chance
          baseWell.chokeSize = Math.floor(Math.random() * 16) + 8;
        }
        if (Math.random() > 0.8) { // 20% chance  
          baseWell.motorAmps = Math.floor(Math.random() * 30) + 20;
        }
        if (Math.random() > 0.9) { // 10% chance
          baseWell.customAttributes = {
            'Pump_Intake_Pressure': Math.floor(Math.random() * 100) + 300,
            'Pump_Discharge_Pressure': Math.floor(Math.random() * 200) + 1000,
            'Run_Hours_Today': Math.floor(Math.random() * 24)
          };
        }

        wells.push(baseWell);
      }
      
      wellPads.push({
        name: `WellPad ${padNum.toString().padStart(2, '0')}`,
        wells,
        status: wells.some(w => w.status === 'alert') ? 'alert' : 
               wells.some(w => w.status === 'warning') ? 'warning' : 'good',
        totalWells: wells.length,
        activeWells: wells.filter(w => w.status !== 'alert').length,
        avgOilRate: wells.reduce((sum, well) => sum + well.oilRate, 0) / wells.length,
        avgWaterCut: Math.round(wells.reduce((sum, well) => sum + well.waterCut, 0) / wells.length)
      });
    }
    
    return wellPads;
  };

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
              {wellPads.length > 0 && wellPads[0].isConnectedToPI && (
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
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-yellow-600 font-medium">⚠️ Simulated Data</span>
                        {currentMode === 'production' && (
                          <span className="text-xs text-red-600">(PI AF Failed)</span>
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
                    <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                      <span className="font-medium">❌ PI AF Error:</span>
                      <span className="flex-1">{lastPIError}</span>
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
                {(dynamicStats?.statusCounts?.alert || 0) > 0 && (
                  <span className="text-sm font-bold text-red-600">
                    {dynamicStats?.statusCounts?.alert} ⚠️
                  </span>
                )}
                {(dynamicStats?.statusCounts?.warning || 0) > 0 && (
                  <span className="text-sm font-bold text-yellow-600">
                    {dynamicStats?.statusCounts?.warning} ⚡
                  </span>
                )}
                <span className="text-sm font-bold text-green-600">
                  {dynamicStats?.statusCounts?.good || 0} ✅
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

            {/* Average Temperature (if available) */}
            {dynamicStats?.avgTemperature && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-500 dark:text-slate-400">Avg Temperature</div>
                <div className="text-2xl font-bold text-red-500">
                  {dynamicStats.avgTemperature}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">°F</div>
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