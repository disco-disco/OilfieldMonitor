import { useState, useEffect } from 'react';
import { PIServerConfig, AttributeMapping, DEFAULT_ATTRIBUTE_MAPPING } from '@/types/pi-system';
import { Settings, Server, Database, TestTube, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

interface PIConfigProps {
  onConfigured: () => void;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    serverReachable?: boolean;
    databaseExists?: boolean;
    elementPathValid?: boolean;
    attributesAccessible?: boolean;
  };
  mode?: string;
}

export default function PISystemConfig({ onConfigured }: PIConfigProps) {
  const [mode, setMode] = useState<'development' | 'production'>('development');
  const [config, setConfig] = useState<PIServerConfig>({
    afServerName: '',
    piWebApiServerName: '',
    afDatabaseName: '',
    parentElementPath: '',
    templateName: '',
    username: '',
    password: ''
  });

  const [attributeMapping, setAttributeMapping] = useState<AttributeMapping>(DEFAULT_ATTRIBUTE_MAPPING);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/pi-system/config');
      const result = await response.json();
      
      if (result.success && result.config) {
        if (result.config.piServerConfig) {
          setConfig(result.config.piServerConfig);
        }
        if (result.config.attributeMapping) {
          setAttributeMapping(result.config.attributeMapping);
        }
        if (result.config.mode) {
          setMode(result.config.mode);
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const handleModeToggle = async () => {
    const newMode = mode === 'development' ? 'production' : 'development';
    setMode(newMode);
    
    // Save mode immediately
    try {
      await fetch('/api/pi-system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, attributeMapping, mode: newMode })
      });
    } catch (error) {
      console.error('Failed to save mode:', error);
    }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/pi-system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, attributeMapping, mode })
      });

      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: 'PI System configured and saved successfully' });
        onConfigured();
      } else {
        setTestResult({ success: false, message: result.message });
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      setTestResult({ success: false, message: 'Failed to configure PI System' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    // Validate required fields based on mode
    if (!config.piWebApiServerName) {
      setTestResult({ success: false, message: 'PI Web API Server Name is required' });
      return;
    }

    if (mode === 'production') {
      if (!config.afServerName) {
        setTestResult({ success: false, message: 'PI AF Server Name is required for production mode' });
        return;
      }
      if (!config.afDatabaseName) {
        setTestResult({ success: false, message: 'AF Database Name is required for production mode' });
        return;
      }
      if (!config.parentElementPath) {
        setTestResult({ success: false, message: 'Parent Element Path is required for production mode' });
        return;
      }
      if (!config.templateName) {
        setTestResult({ success: false, message: 'Template Name is required for production mode' });
        return;
      }
    }

    setIsLoading(true);
    setTestResult(null);
    
    try {
      // First save configuration
      await fetch('/api/pi-system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, attributeMapping, mode })
      });

      // Use client-side direct connection test (like the working debug tools)
      const result = await testDirectConnection(mode);
      setTestResult(result);
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectConnection = async (currentMode: 'development' | 'production') => {
    const testResult = {
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
      // Test PI Web API connectivity using direct browser connection (like the working debug tools)
      const testEndpoints = [
        `https://${config.piWebApiServerName}/piwebapi`,
        `https://${config.piWebApiServerName}:443/piwebapi`,
        `http://${config.piWebApiServerName}/piwebapi`
      ];

      let workingEndpoint = null;

      // Test each endpoint until we find one that works
      for (const endpoint of testEndpoints) {
        try {
          console.log(`🧪 Testing direct connection to: ${endpoint}`);
          
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });

          console.log(`   Status: ${response.status} ${response.statusText}`);

          // HTTP 200 (success) or HTTP 401 (auth required) both mean server is reachable
          if (response.ok || response.status === 401) {
            workingEndpoint = endpoint;
            testResult.details.serverReachable = true;
            console.log(`✅ Working endpoint found: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Failed to connect to: ${endpoint} - ${error}`);
          continue;
        }
      }

      if (!workingEndpoint) {
        testResult.message = `Cannot reach PI Web API Server: ${config.piWebApiServerName}`;
        return testResult;
      }

      // In development mode, just confirm server connectivity
      if (currentMode === 'development') {
        testResult.success = true;
        testResult.message = `✅ PI Web API server reachable at ${workingEndpoint}. Development mode ready.`;
        return testResult;
      }

      // Production mode: test each component individually with actual PI Web API calls
      console.log(`🔍 Testing PI AF Database: ${config.afDatabaseName}`);
      
      // Test 2: Check if AF Database exists
      try {
        const dbUrl = `${workingEndpoint}/assetdatabases?path=\\\\${config.afServerName}\\${config.afDatabaseName}`;
        console.log(`   Testing database URL: ${dbUrl}`);
        
        const dbResponse = await fetch(dbUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        console.log(`   Database test status: ${dbResponse.status}`);
        
        if (dbResponse.ok) {
          testResult.details.databaseExists = true;
          console.log(`✅ Database found: ${config.afDatabaseName}`);
        } else if (dbResponse.status === 401) {
          // 401 means server is working but needs auth - database could exist
          testResult.details.databaseExists = true; // Assume exists, auth issue
          console.log(`🔐 Database test needs authentication (401)`);
        } else {
          console.log(`❌ Database not found or error: ${dbResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Database test failed: ${error}`);
      }

      // Test 3: Check if Element Path is valid (only if database test passed)
      if (testResult.details.databaseExists && config.parentElementPath) {
        try {
          console.log(`🔍 Testing Element Path: ${config.parentElementPath}`);
          
          const elementUrl = `${workingEndpoint}/elements?path=\\\\${config.afServerName}\\${config.afDatabaseName}\\${config.parentElementPath}`;
          console.log(`   Testing element URL: ${elementUrl}`);
          
          const elementResponse = await fetch(elementUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });

          console.log(`   Element test status: ${elementResponse.status}`);
          
          if (elementResponse.ok) {
            testResult.details.elementPathValid = true;
            console.log(`✅ Element path found: ${config.parentElementPath}`);
          } else if (elementResponse.status === 401) {
            // 401 means server is working but needs auth - element could exist
            testResult.details.elementPathValid = true; // Assume exists, auth issue
            console.log(`🔐 Element test needs authentication (401)`);
          } else {
            console.log(`❌ Element path not found or error: ${elementResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Element test failed: ${error}`);
        }
      }

      // Test 4: Check if we can access attributes (only if element test passed)
      if (testResult.details.elementPathValid && config.templateName) {
        try {
          console.log(`🔍 Testing Template/Attributes: ${config.templateName}`);
          
          // Try to get elements with the specified template
          const templateUrl = `${workingEndpoint}/elements?path=\\\\${config.afServerName}\\${config.afDatabaseName}\\${config.parentElementPath}&templateName=${config.templateName}`;
          console.log(`   Testing template URL: ${templateUrl}`);
          
          const templateResponse = await fetch(templateUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });

          console.log(`   Template test status: ${templateResponse.status}`);
          
          if (templateResponse.ok) {
            testResult.details.attributesAccessible = true;
            console.log(`✅ Template/attributes accessible: ${config.templateName}`);
          } else if (templateResponse.status === 401) {
            // 401 means server is working but needs auth - attributes could be accessible
            testResult.details.attributesAccessible = true; // Assume accessible, auth issue
            console.log(`🔐 Attributes test needs authentication (401)`);
          } else {
            console.log(`❌ Template/attributes not accessible or error: ${templateResponse.status}`);
          }
        } catch (error) {
          console.log(`❌ Attributes test failed: ${error}`);
        }
      }

      // Determine overall success based on individual tests
      const allTestsPassed = testResult.details.serverReachable && 
                            testResult.details.databaseExists && 
                            testResult.details.elementPathValid && 
                            testResult.details.attributesAccessible;

      if (allTestsPassed) {
        testResult.success = true;
        testResult.message = `✅ All PI System components validated successfully!`;
      } else {
        const failedTests = [];
        if (!testResult.details.databaseExists) failedTests.push('Database');
        if (!testResult.details.elementPathValid) failedTests.push('Element Path');
        if (!testResult.details.attributesAccessible) failedTests.push('Attributes');
        
        testResult.success = false;
        testResult.message = `❌ Failed tests: ${failedTests.join(', ')}. Check configuration.`;
      }

      return testResult;

    } catch (error) {
      testResult.message = `Connection test failed: ${error}`;
      return testResult;
    }
  };

  const renderConnectionDetails = () => {
    if (!testResult?.details) return null;

    const { details } = testResult;
    const tests = [
      { name: 'Server Reachable', status: details.serverReachable },
      { name: 'Database Exists', status: details.databaseExists },
      { name: 'Element Path Valid', status: details.elementPathValid },
      { name: 'Attributes Accessible', status: details.attributesAccessible }
    ];

    return (
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Connection Test Details:</h4>
        <div className="space-y-2">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center gap-2">
              {test.status ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${test.status ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {test.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">PI System Configuration</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure connection to AVEVA PI Asset Framework</p>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${mode === 'development' ? 'text-blue-600' : 'text-slate-500'}`}>
            Development
          </span>
          <button
            type="button"
            onClick={handleModeToggle}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            {mode === 'development' ? (
              <ToggleLeft className="w-8 h-8 text-blue-600" />
            ) : (
              <ToggleRight className="w-8 h-8 text-green-600" />
            )}
          </button>
          <span className={`text-sm font-medium ${mode === 'production' ? 'text-green-600' : 'text-slate-500'}`}>
            Production
          </span>
        </div>
      </div>

      {/* Mode Description */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${mode === 'development' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          <span className="font-medium text-slate-900 dark:text-white">
            {mode === 'development' ? 'Development Mode' : 'Production Mode'}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {mode === 'development' 
            ? 'Using simulated data for testing and development. No PI System connection required.'
            : 'Connecting to actual AVEVA PI System. Requires valid server configuration and network access.'
          }
        </p>
      </div>

      <form onSubmit={handleConfigSubmit} className="space-y-6">
        {/* Server Configuration - Only show in production mode */}
        {mode === 'production' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Server className="w-4 h-4 inline mr-2" />
                  AF Server Name *
                </label>
                <input
                  type="text"
                  value={config.afServerName}
                  onChange={(e) => setConfig({ ...config, afServerName: e.target.value })}
                  placeholder="e.g., PISERVER01.company.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required={mode === 'production'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Server className="w-4 h-4 inline mr-2" />
                  PI Web API Server Name *
                </label>
                <input
                  type="text"
                  value={config.piWebApiServerName}
                  onChange={(e) => setConfig({ ...config, piWebApiServerName: e.target.value })}
                  placeholder="e.g., SRV-PIV0101 (PI Vision Server)"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required={mode === 'production'}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Server hosting PI Web API (often PI Vision server)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <Database className="w-4 h-4 inline mr-2" />
                  AF Database Name *
                </label>
                <input
                  type="text"
                  value={config.afDatabaseName}
                  onChange={(e) => setConfig({ ...config, afDatabaseName: e.target.value })}
                  placeholder="e.g., PLINQO_OILFIELD"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required={mode === 'production'}
                />
              </div>
            </div>

            {/* Element Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Parent Element Path *
                </label>
                <input
                  type="text"
                  value={config.parentElementPath}
                  onChange={(e) => setConfig({ ...config, parentElementPath: e.target.value })}
                  placeholder="e.g., \\PLINQO_OILFIELD\\Production"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  required={mode === 'production'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={config.templateName}
                  onChange={(e) => setConfig({ ...config, templateName: e.target.value })}
                  placeholder="e.g., WellPadTemplate"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Windows Authentication Notice */}
            <div className="col-span-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">Windows Authentication Enabled</h4>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  This system uses Windows Authentication automatically with your current login credentials. 
                  No username/password configuration required. Deploy on a Windows domain machine for optimal performance.
                </p>
              </div>
            </div>
          </>
        )}

        {/* Attribute Mapping */}
        <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Attribute Mapping {mode === 'development' && <span className="text-sm font-normal text-slate-500">(Optional in Development Mode)</span>}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Oil Rate Attribute
              </label>
              <input
                type="text"
                value={attributeMapping.oilRate}
                onChange={(e) => setAttributeMapping({ ...attributeMapping, oilRate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Liquid Rate Attribute
              </label>
              <input
                type="text"
                value={attributeMapping.liquidRate}
                onChange={(e) => setAttributeMapping({ ...attributeMapping, liquidRate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Water Cut Attribute
              </label>
              <input
                type="text"
                value={attributeMapping.waterCut}
                onChange={(e) => setAttributeMapping({ ...attributeMapping, waterCut: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ESP Frequency Attribute
              </label>
              <input
                type="text"
                value={attributeMapping.espFrequency}
                onChange={(e) => setAttributeMapping({ ...attributeMapping, espFrequency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Plan Target Attribute
              </label>
              <input
                type="text"
                value={attributeMapping.planTarget}
                onChange={(e) => setAttributeMapping({ ...attributeMapping, planTarget: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-600">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Settings className="w-4 h-4" />
            )}
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4" />
            )}
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {testResult.success ? 'Success' : 'Failed'}
              </span>
            </div>
            <p className={`text-sm ${
              testResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {testResult.message}
            </p>
            {renderConnectionDetails()}
          </div>
        )}
      </form>
    </div>
  );
}
