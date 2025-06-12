'use client';

import { useState, useEffect, useCallback } from 'react';
import { Droplets, TrendingUp, TrendingDown, CheckCircle, Zap, Settings, RefreshCw } from "lucide-react";
import PISystemConfig from '@/components/PISystemConfig';
import { WellPadData } from '@/types/pi-system';
import { PIAFService } from '@/services/pi-af-service';

export default function Home() {
  const [wellPads, setWellPads] = useState<WellPadData[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPIConfigured, setIsPIConfigured] = useState(false);
  const [currentMode, setCurrentMode] = useState<'development' | 'production'>('development');

  // Load wellpad data
  const loadWellPadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check if we have a working PI configuration first
      const configResponse = await fetch('/api/pi-system/config');
      const configResult = await configResponse.json();
      
      if (configResult.success && configResult.config.mode === 'production' && 
          configResult.config.piServerConfig?.piWebApiServerName) {
        // Try to load real PI AF data
        try {
          const realData = await loadRealPIData(configResult.config);
          if (realData) {
            setWellPads(realData);
            setLastUpdated(new Date());
            return;
          }
        } catch (error) {
          console.log('Real PI AF data loading failed, falling back to simulated data:', error);
        }
      }
      
      // Fall back to simulated data (either no config, development mode, or PI connection failed)
      console.log('Using simulated data');
      setWellPads(generateSimulatedData());
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading wellpad data:', error);
      // Fallback to simulated data
      setWellPads(generateSimulatedData());
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

      // Create PI AF service instance
      const piafService = new PIAFService(config.piServerConfig);
      
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

  // Generate simulated data as fallback
  const generateSimulatedData = (): WellPadData[] => {
    const wellPads: WellPadData[] = [];
    
    for (let padNum = 1; padNum <= 10; padNum++) {
      const wellCount = Math.floor(Math.random() * 11) + 10;
      const wells = [];
      
      for (let wellNum = 0; wellNum < wellCount; wellNum++) {
        const wellNumber = Math.floor(Math.random() * 900) + 100;
        const oilRate = Math.floor(Math.random() * 150) + 50;
        const liquidRate = Math.floor(oilRate * (1 + Math.random() * 0.5)); // Liquid rate is typically higher than oil rate
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
                <div className="flex items-center gap-2 mt-1">
                  {wellPads[0]?.isConnectedToPI ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Live PI AF Data</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-yellow-600 font-medium">Simulated Data</span>
                    </>
                  )}
                  <span className="text-xs text-slate-500">• {currentMode} mode</span>
                </div>
              )}
            </div>
            {lastUpdated && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Last Updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Wells</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {wellPads.reduce((sum, pad) => sum + pad.wellCount, 0)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Total Production</div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(wellPads.reduce((sum, pad) => sum + pad.totalProduction, 0)).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">bbl/day</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Active WellPads</div>
              <div className="text-2xl font-bold text-green-600">{wellPads.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500 dark:text-slate-400">Avg Water Cut</div>
              <div className="text-2xl font-bold text-orange-600">
                {wellPads.length > 0 ? Math.round(wellPads.reduce((sum, pad) => sum + pad.averageWaterCut, 0) / wellPads.length) : 0}%
              </div>
            </div>
          </div>
        </div>

        {/* WellPads List */}
        <div className="space-y-6">
          {wellPads.map((wellPad, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              {/* WellPad Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{wellPad.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {wellPad.wells.length} wells
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      {Math.round(wellPad.totalProduction).toLocaleString()} bbl/day
                    </span>
                    <span className="text-sm text-orange-600">
                      {Math.round(wellPad.averageWaterCut)}% water cut
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">Operational</span>
                </div>
              </div>

              {/* Wells Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {wellPad.wells.map((well, wellIndex) => (
                  <div
                    key={wellIndex}
                    className={`rounded-lg p-2 border transition-all hover:shadow-md cursor-pointer ${
                      well.status === 'good'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : well.status === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}
                  >
                    {/* Well Name */}
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{well.name}</h4>
                      <div className={`w-2 h-2 rounded-full ${
                        well.status === 'good' ? 'bg-green-500' :
                        well.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>

                    {/* Oil Rate */}
                    <div className="mb-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Oil Rate</div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{well.oilRate} bbl/day</div>
                    </div>

                    {/* Liquid Rate */}
                    <div className="mb-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Liquid Rate</div>
                      <div className="font-semibold text-blue-600 text-sm">{well.liquidRate} bbl/day</div>
                    </div>

                    {/* Deviation */}
                    <div className="mb-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Plan Deviation</div>
                      <div className={`font-semibold flex items-center gap-1 text-sm ${
                        well.planDeviation >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {well.planDeviation >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {well.planDeviation > 0 ? '+' : ''}{well.planDeviation}%
                      </div>
                    </div>

                    {/* Water Cut */}
                    <div className="mb-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">Water Cut</div>
                      <div className={`font-semibold text-sm ${
                        well.waterCut > 25 ? 'text-red-600' : 
                        well.waterCut > 20 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {well.waterCut}%
                      </div>
                    </div>

                    {/* ESP Frequency */}
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">ESP Freq</div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 text-sm">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {well.espFrequency} Hz
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}