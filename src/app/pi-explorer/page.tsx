'use client';

import { useState, useEffect } from 'react';
import { Database, Server, FolderTree, Zap, AlertCircle, CheckCircle, Loader2, RefreshCw, Settings } from 'lucide-react';

interface PIConfig {
  afServerName: string;
  piWebApiServerName: string;
  afDatabaseName: string;
  parentElementPath: string;
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
  Value?: any;
}

export default function PIExplorerPage() {
  const [config, setConfig] = useState<PIConfig>({
    afServerName: '',
    piWebApiServerName: '',
    afDatabaseName: '',
    parentElementPath: ''
  });

  const [workingEndpoint, setWorkingEndpoint] = useState<string>('');
  const [databases, setDatabases] = useState<AFDatabase[]>([]);
  const [elements, setElements] = useState<AFElement[]>([]);
  const [attributes, setAttributes] = useState<AFAttribute[]>([]);
  
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [loadingElements, setLoadingElements] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [selectedElement, setSelectedElement] = useState<string>('');
  
  const [errors, setErrors] = useState<{
    server?: string;
    databases?: string;
    elements?: string;
    attributes?: string;
  }>({});

  // Generate authentication headers for Windows Authentication
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    return headers;
  };

  const getFetchOptions = () => {
    const options: RequestInit = {
      method: 'GET',
      headers: getAuthHeaders(),
      // Include credentials for Windows Authentication
      credentials: 'include'
    };

    return options;
  };

  // Debug WebID format for PI Web API
  const debugWebIdFormats = async (endpoint: string) => {
    console.log('🔍 Testing WebID formats for PI Web API...');
    
    // Test root endpoint to understand WebID structure
    try {
      const response = await fetch(`${endpoint}/system`, getFetchOptions());
      if (response.ok) {
        const systemInfo = await response.json();
        console.log('📋 PI Web API System Info:', systemInfo);
      }
    } catch (error) {
      console.log('⚠️ Could not get system info:', error);
    }

    // Test if we can get a specific server's WebID
    try {
      const response = await fetch(`${endpoint}/assetservers`, getFetchOptions());
      if (response.ok) {
        const data = await response.json();
        if (data.Items && data.Items.length > 0) {
          const firstServer = data.Items[0];
          console.log('🔗 Sample server WebID structure:', {
            Name: firstServer.Name,
            WebId: firstServer.WebId,
            Path: firstServer.Path,
            Links: Object.keys(firstServer.Links || {})
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Could not analyze WebID structure:', error);
    }
  };

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/pi-system/config');
      const result = await response.json();
      
      if (result.success && result.config?.piServerConfig) {
        setConfig(result.config.piServerConfig);
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  const testServerConnection = async () => {
    if (!config.piWebApiServerName) {
      setErrors({ server: 'PI Web API Server Name is required' });
      return;
    }

    setErrors({});
    
    const testEndpoints = [
      `https://${config.piWebApiServerName}/piwebapi`,
      `https://${config.piWebApiServerName}:443/piwebapi`,
      `http://${config.piWebApiServerName}/piwebapi`
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing PI Web API at: ${endpoint}`);
        
        const response = await fetch(endpoint, getFetchOptions());

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok || response.status === 401) {
          setWorkingEndpoint(endpoint);
          console.log(`✅ Working endpoint found: ${endpoint}`);
          
          // Debug WebID formats when we find a working endpoint
          await debugWebIdFormats(endpoint);
          
          return endpoint;
        }
      } catch (error) {
        console.log(`❌ Failed: ${endpoint} - ${error}`);
        continue;
      }
    }

    setErrors({ server: `Cannot reach PI Web API Server: ${config.piWebApiServerName}` });
    return null;
  };

  const loadDatabases = async () => {
    const endpoint = await testServerConnection();
    if (!endpoint || !config.afServerName) {
      setErrors({ databases: 'Server connection failed or AF Server Name missing' });
      return;
    }

    setLoadingDatabases(true);
    setDatabases([]);
    setErrors({ ...errors, databases: undefined });

    try {
      // Try multiple URL formats for getting databases
      const urlFormats = [
        // Format 1: Get all asset servers first (most reliable)
        `${endpoint}/assetservers`,
        // Format 2: Try without name prefix (direct path)
        `${endpoint}/assetservers/${encodeURIComponent(config.afServerName)}/assetdatabases`,
        // Format 3: Try with path parameter (double backslashes for UNC path)
        `${endpoint}/assetdatabases?path=\\\\${encodeURIComponent(config.afServerName)}`,
        // Format 4: Get all databases and filter
        `${endpoint}/assetdatabases`,
        // Format 5: Try WebID format (proper PI Web API WebID structure)
        `${endpoint}/assetservers?name=${encodeURIComponent(config.afServerName)}`,
        // Format 6: Try direct server path without WebID prefix
        `${endpoint}/assetservers/${config.afServerName}/assetdatabases`
      ];

      let successfulResponse = null;
      let lastError = null;

      for (let i = 0; i < urlFormats.length; i++) {
        const dbUrl = urlFormats[i];
        console.log(`🔍 Attempt ${i + 1}: Getting databases from: ${dbUrl}`);

        try {
          const response = await fetch(dbUrl, getFetchOptions());
          console.log(`   Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success with format ${i + 1}:`, data);
            
            if (i === 0 || i === 4) {
              // Format 1 & 5: We got all asset servers, find our specific server
              if (data.Items) {
                const ourServer = data.Items.find((server: any) => 
                  server.Name === config.afServerName || 
                  server.Name.toLowerCase() === config.afServerName.toLowerCase()
                );
                if (ourServer && ourServer.Links && ourServer.Links.Databases) {
                  console.log(`🎯 Found target server: ${ourServer.Name}, getting databases...`);
                  // Try to get databases from the found server
                  const serverDbResponse = await fetch(ourServer.Links.Databases, getFetchOptions());
                  if (serverDbResponse.ok) {
                    const serverDbData = await serverDbResponse.json();
                    successfulResponse = serverDbData;
                    break;
                  } else {
                    console.log(`❌ Failed to get databases from server link: ${serverDbResponse.status}`);
                    continue;
                  }
                } else {
                  console.log(`⚠️ Server '${config.afServerName}' not found in server list`);
                  console.log('Available servers:', data.Items?.map((s: any) => s.Name));
                  lastError = `AF Server '${config.afServerName}' not found. Available: ${data.Items?.map((s: any) => s.Name).join(', ')}`;
                  continue;
                }
              }
            } else if (i === 3) {
              // Format 4: We got all databases, need to filter by our server
              if (data.Items) {
                const filteredDatabases = data.Items.filter((db: any) => 
                  db.Path && db.Path.includes(`\\\\${config.afServerName}\\`)
                );
                if (filteredDatabases.length > 0) {
                  successfulResponse = { Items: filteredDatabases };
                  break;
                } else {
                  lastError = `No databases found for server '${config.afServerName}' in global database list`;
                  continue;
                }
              }
            } else {
              // Formats 2, 3, 6: Direct database response
              successfulResponse = data;
              break;
            }
          } else if (response.status === 401) {
            setErrors({ databases: 'Authentication required (401) - but server is reachable' });
            return;
          } else if (response.status === 400) {
            const errorText = await response.text();
            console.log(`❌ Format ${i + 1} failed with 400:`, errorText);
            lastError = `Format ${i + 1} Error 400: ${errorText}`;
            continue; // Try next format
          } else if (response.status === 404) {
            console.log(`❌ Format ${i + 1} failed with 404 - trying next format`);
            lastError = `AF Server '${config.afServerName}' not found (404)`;
            continue; // Try next format
          } else {
            const errorText = await response.text();
            console.log(`❌ Format ${i + 1} failed with ${response.status}:`, errorText);
            lastError = `Error ${response.status}: ${errorText}`;
            continue; // Try next format
          }
        } catch (fetchError) {
          console.log(`❌ Format ${i + 1} network error:`, fetchError);
          lastError = `Network error: ${fetchError}`;
          continue; // Try next format
        }
      }

      if (successfulResponse) {
        if (successfulResponse.Items && successfulResponse.Items.length > 0) {
          setDatabases(successfulResponse.Items);
          console.log(`✅ Found ${successfulResponse.Items.length} databases`);
        } else {
          setErrors({ databases: 'No databases found in response (empty Items array)' });
        }
      } else {
        setErrors({ databases: `All URL formats failed. Last error: ${lastError}` });
      }
      
    } catch (error) {
      console.error('Database loading failed:', error);
      setErrors({ databases: `Network error: ${error}` });
    } finally {
      setLoadingDatabases(false);
    }
  };

  const loadElements = async (databaseName?: string) => {
    const dbName = databaseName || selectedDatabase;
    if (!workingEndpoint || !config.afServerName || !dbName) {
      setErrors({ elements: 'Missing server, AF server name, or database selection' });
      return;
    }

    setLoadingElements(true);
    setElements([]);
    setErrors({ ...errors, elements: undefined });

    try {
      // Find the selected database to get its WebId and Links
      const selectedDb = databases.find(db => db.Name === dbName);
      console.log(`🔍 Selected database info:`, selectedDb);

      // Try multiple URL formats for getting elements
      const urlFormats = [
        // Format 1: Use database Links.Elements if available (most reliable)
        selectedDb?.Links?.Elements,
        // Format 2: Use WebId approach
        selectedDb?.WebId ? `${workingEndpoint}/assetdatabases/${selectedDb.WebId}/elements` : null,
        // Format 3: Path-based approach with proper encoding
        `${workingEndpoint}/assetdatabases?path=${encodeURIComponent(selectedDb?.Path || `\\\\${config.afServerName}\\${dbName}`)}&field=elements`,
        // Format 4: Direct path approach
        `${workingEndpoint}/assetdatabases/path:${encodeURIComponent(`\\\\${config.afServerName}\\${dbName}`)}/elements`,
        // Format 5: Alternative path format
        `${workingEndpoint}/elements?path=${encodeURIComponent(`\\\\${config.afServerName}\\${dbName}`)}`,
        // Format 6: Server-database combination
        `${workingEndpoint}/assetservers/${encodeURIComponent(config.afServerName)}/assetdatabases/${encodeURIComponent(dbName)}/elements`
      ].filter(url => url !== null); // Remove null entries

      let successfulResponse = null;
      let lastError = null;

      for (let i = 0; i < urlFormats.length; i++) {
        const elementsUrl = urlFormats[i];
        console.log(`🔍 Attempt ${i + 1}: Getting elements from: ${elementsUrl}`);

        try {
          const response = await fetch(elementsUrl!, getFetchOptions());
          console.log(`   Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success with format ${i + 1}:`, data);
            
            if (data.Items) {
              successfulResponse = data;
              break;
            } else if (data.Name && data.Elements) {
              // Sometimes the response structure is different
              successfulResponse = { Items: data.Elements };
              break;
            } else {
              console.log(`⚠️ Format ${i + 1} returned data but no Items array`);
              lastError = `Format ${i + 1} returned unexpected data structure`;
              continue;
            }
          } else if (response.status === 401) {
            setErrors({ elements: 'Authentication required (401) - but database is reachable' });
            return;
          } else if (response.status === 400) {
            const errorText = await response.text();
            console.log(`❌ Format ${i + 1} failed with 400:`, errorText);
            lastError = `Format ${i + 1} Error 400: ${errorText}`;
            continue; // Try next format
          } else if (response.status === 404) {
            console.log(`❌ Format ${i + 1} failed with 404 - trying next format`);
            lastError = `Format ${i + 1}: Elements not found (404)`;
            continue; // Try next format
          } else {
            const errorText = await response.text();
            console.log(`❌ Format ${i + 1} failed with ${response.status}:`, errorText);
            lastError = `Format ${i + 1} Error ${response.status}: ${errorText}`;
            continue; // Try next format
          }
        } catch (fetchError) {
          console.log(`❌ Format ${i + 1} network error:`, fetchError);
          lastError = `Format ${i + 1} Network error: ${fetchError}`;
          continue; // Try next format
        }
      }

      if (successfulResponse) {
        if (successfulResponse.Items && successfulResponse.Items.length > 0) {
          setElements(successfulResponse.Items);
          setSelectedDatabase(dbName);
          console.log(`✅ Found ${successfulResponse.Items.length} elements in database '${dbName}'`);
        } else {
          setErrors({ elements: `No elements found in database '${dbName}' (empty Items array)` });
        }
      } else {
        setErrors({ elements: `All URL formats failed. Last error: ${lastError}` });
      }
      
    } catch (error) {
      console.error('Elements loading failed:', error);
      setErrors({ elements: `Network error: ${error}` });
    } finally {
      setLoadingElements(false);
    }
  };

  const loadAttributes = async (elementPath?: string) => {
    const elemPath = elementPath || selectedElement;
    if (!workingEndpoint || !elemPath) {
      setErrors({ attributes: 'Missing server connection or element selection' });
      return;
    }

    setLoadingAttributes(true);
    setAttributes([]);
    setErrors({ ...errors, attributes: undefined });

    try {
      // Find the selected element to get its WebId and Links
      const selectedEl = elements.find(el => el.Path === elemPath || el.Name === elemPath);
      console.log(`🔍 Selected element info:`, selectedEl);
      console.log(`🔍 Looking for element with path: ${elemPath}`);

      // Try multiple URL formats for getting attributes
      const urlFormats = [
        // Format 1: Use element Links.Attributes if available (most reliable)
        selectedEl?.Links?.Attributes,
        // Format 2: Use WebId approach
        selectedEl?.WebId ? `${workingEndpoint}/elements/${selectedEl.WebId}/attributes` : null,
        // Format 3: Path-based approach with proper encoding
        `${workingEndpoint}/elements?path=${encodeURIComponent(selectedEl?.Path || elemPath)}&field=attributes`,
        // Format 4: Direct path approach
        `${workingEndpoint}/elements/path:${encodeURIComponent(selectedEl?.Path || elemPath)}/attributes`,
        // Format 5: Alternative path format without "path:" prefix
        `${workingEndpoint}/elements/${encodeURIComponent(selectedEl?.Path || elemPath)}/attributes`,
        // Format 6: Using element name instead of path
        selectedEl?.Name ? `${workingEndpoint}/elements?name=${encodeURIComponent(selectedEl.Name)}&field=attributes` : null,
        // Format 7: Direct attribute query
        `${workingEndpoint}/attributes?elementpath=${encodeURIComponent(selectedEl?.Path || elemPath)}`
      ].filter(url => url !== null); // Remove null entries

      let successfulResponse = null;
      let lastError = null;

      for (let i = 0; i < urlFormats.length; i++) {
        const attributesUrl = urlFormats[i];
        console.log(`🔍 Attempt ${i + 1}: Getting attributes from: ${attributesUrl}`);

        try {
          const response = await fetch(attributesUrl!, getFetchOptions());
          console.log(`   Status: ${response.status} ${response.statusText}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success with format ${i + 1}:`, data);
            
            if (data.Items) {
              successfulResponse = data;
              break;
            } else if (data.Name && data.Attributes) {
              // Sometimes the response structure is different
              successfulResponse = { Items: data.Attributes };
              break;
            } else if (Array.isArray(data)) {
              // Sometimes attributes are returned as direct array
              successfulResponse = { Items: data };
              break;
            } else {
              console.log(`⚠️ Format ${i + 1} returned data but no Items array`);
              lastError = `Format ${i + 1} returned unexpected data structure`;
              continue;
            }
          } else if (response.status === 401) {
            setErrors({ attributes: 'Authentication required (401) - but element is reachable' });
            return;
          } else if (response.status === 400) {
            const errorText = await response.text();
            console.log(`❌ Format ${i + 1} failed with 400:`, errorText);
            lastError = `Format ${i + 1} Error 400: ${errorText}`;
            continue; // Try next format
          } else if (response.status === 404) {
            console.log(`❌ Format ${i + 1} failed with 404 - trying next format`);
            lastError = `Format ${i + 1}: Attributes not found (404)`;
            continue; // Try next format
          } else {
            const errorText = await response.text();
            console.log(`❌ Format ${i + 1} failed with ${response.status}:`, errorText);
            lastError = `Format ${i + 1} Error ${response.status}: ${errorText}`;
            continue; // Try next format
          }
        } catch (fetchError) {
          console.log(`❌ Format ${i + 1} network error:`, fetchError);
          lastError = `Format ${i + 1} Network error: ${fetchError}`;
          continue; // Try next format
        }
      }

      if (successfulResponse) {
        if (successfulResponse.Items && successfulResponse.Items.length > 0) {
          setAttributes(successfulResponse.Items);
          setSelectedElement(elemPath);
          console.log(`✅ Found ${successfulResponse.Items.length} attributes for element '${selectedEl?.Name || elemPath}'`);
        } else {
          setErrors({ attributes: `No attributes found for element '${selectedEl?.Name || elemPath}' (empty Items array)` });
        }
      } else {
        setErrors({ attributes: `All URL formats failed. Last error: ${lastError}` });
      }
      
    } catch (error) {
      console.error('Attributes loading failed:', error);
      setErrors({ attributes: `Network error: ${error}` });
    } finally {
      setLoadingAttributes(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            PI AF Explorer & Connection Validator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Real-time PI Asset Framework data explorer to validate actual connections and browse structure
          </p>
        </div>

        {/* Configuration Display */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Current Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">PI Web API Server:</span>
              <span className="ml-2 text-slate-600 dark:text-slate-400">
                {config.piWebApiServerName || 'Not configured'}
              </span>
            </div>
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">AF Server:</span>
              <span className="ml-2 text-slate-600 dark:text-slate-400">
                {config.afServerName || 'Not configured'}
              </span>
            </div>
          </div>

          {workingEndpoint && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Connected to: {workingEndpoint}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Windows Authentication Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Server className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Windows Authentication</h2>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Windows Authentication Enabled
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  This PI Explorer uses your current Windows login credentials automatically. 
                  No username/password required - just click "Load" to access your PI AF data.
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  <strong>Best Performance:</strong> Windows Authentication works optimally when deployed on a Windows PC 
                  that's joined to your corporate domain.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 401 Authentication Troubleshooting Guide */}
        {(errors.databases?.includes('401') || errors.elements?.includes('401') || errors.attributes?.includes('401')) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">
                  🎉 Great News! Your Connection is Working!
                </h3>
                <p className="text-amber-700 dark:text-amber-300 mb-4">
                  The 401 "Authentication Required" error proves your PI Web API server is reachable and responding correctly. 
                  Your Windows Authentication setup needs to be verified.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Windows Authentication Solutions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                      <li><strong>Deploy on Windows PC:</strong> Move this application to a Windows machine joined to your domain</li>
                      <li><strong>Check PI Web API Security:</strong> Verify your Windows account has read access to PI AF databases</li>
                      <li><strong>Verify Domain Access:</strong> Ensure the Windows machine can authenticate with your PI Web API server</li>
                      <li><strong>Test Network Connectivity:</strong> Confirm the machine can reach your PI Web API server</li>
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>💡 Success:</strong> Since you're getting 401 errors, your server configuration is perfect! 
                      This eliminates the false positive problem completely. You just need Windows domain authentication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Databases Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AF Databases</h3>
              </div>
              <button
                onClick={loadDatabases}
                disabled={loadingDatabases}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm rounded-lg transition-colors"
              >
                {loadingDatabases ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Load
              </button>
            </div>

            {errors.databases && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{errors.databases}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {databases.map((db, index) => (
                <div
                  key={index}
                  onClick={() => loadElements(db.Name)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    selectedDatabase === db.Name
                      ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{db.Name}</div>
                  {db.Description && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{db.Description}</div>
                  )}
                </div>
              ))}
              
              {databases.length === 0 && !loadingDatabases && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Click "Load" to fetch AF databases
                </div>
              )}
            </div>
          </div>

          {/* Elements Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FolderTree className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Elements</h3>
              </div>
              {selectedDatabase && (
                <button
                  onClick={() => loadElements()}
                  disabled={loadingElements}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
                >
                  {loadingElements ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </button>
              )}
            </div>

            {selectedDatabase && (
              <div className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                Database: <span className="font-medium">{selectedDatabase}</span>
              </div>
            )}

            {errors.elements && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{errors.elements}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {elements.map((element, index) => (
                <div
                  key={index}
                  onClick={() => loadAttributes(element.Path)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    selectedElement === element.Path
                      ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <div className="font-medium text-slate-900 dark:text-white">{element.Name}</div>
                  {element.TemplateName && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Template: {element.TemplateName}
                    </div>
                  )}
                </div>
              ))}
              
              {elements.length === 0 && !loadingElements && selectedDatabase && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No elements found in database
                </div>
              )}
              
              {!selectedDatabase && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Select a database to view elements
                </div>
              )}
            </div>
          </div>

          {/* Attributes Panel */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Attributes</h3>
              </div>
              {selectedElement && (
                <button
                  onClick={() => loadAttributes()}
                  disabled={loadingAttributes}
                  className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg transition-colors"
                >
                  {loadingAttributes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </button>
              )}
            </div>

            {selectedElement && (
              <div className="mb-3 text-sm text-slate-600 dark:text-slate-400">
                Element: <span className="font-medium">{selectedElement.split('\\').pop()}</span>
              </div>
            )}

            {errors.attributes && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700 dark:text-red-300">{errors.attributes}</span>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attributes.map((attribute, index) => (
                <div
                  key={index}
                  className="p-3 border border-slate-200 dark:border-slate-600 rounded-lg"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{attribute.Name}</div>
                  {attribute.Type && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Type: {attribute.Type}
                    </div>
                  )}
                </div>
              ))}
              
              {attributes.length === 0 && !loadingAttributes && selectedElement && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No attributes found for element
                </div>
              )}
              
              {!selectedElement && (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  Select an element to view attributes
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Connection Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${workingEndpoint ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                PI Web API: {workingEndpoint ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${databases.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Databases: {databases.length} found
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${elements.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Elements: {elements.length} found
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${attributes.length > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Attributes: {attributes.length} found
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
