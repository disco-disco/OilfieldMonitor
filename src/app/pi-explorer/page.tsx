'use client';

import { useState, useEffect } from 'react';
import { Database, Server, FolderTree, Zap, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

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
}

interface AFElement {
  Name: string;
  Path: string;
  TemplateName?: string;
  HasChildren?: boolean;
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
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok || response.status === 401) {
          setWorkingEndpoint(endpoint);
          console.log(`✅ Working endpoint found: ${endpoint}`);
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
      // Try to get all databases from AF Server
      const dbUrl = `${endpoint}/assetservers/name:${encodeURIComponent(config.afServerName)}/assetdatabases`;
      console.log(`🔍 Getting databases from: ${dbUrl}`);

      const response = await fetch(dbUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      console.log(`   Database list status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Databases retrieved:', data);
        
        if (data.Items) {
          setDatabases(data.Items);
        } else {
          setErrors({ databases: 'No databases found in response' });
        }
      } else if (response.status === 401) {
        setErrors({ databases: 'Authentication required (401) - but server is reachable' });
      } else if (response.status === 404) {
        setErrors({ databases: `AF Server '${config.afServerName}' not found (404)` });
      } else {
        const errorText = await response.text();
        setErrors({ databases: `Error ${response.status}: ${errorText}` });
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
      // Get root elements from the database
      const elementsUrl = `${workingEndpoint}/assetdatabases/path:\\\\\\\\${encodeURIComponent(config.afServerName)}\\\\${encodeURIComponent(dbName)}/elements`;
      console.log(`🔍 Getting elements from: ${elementsUrl}`);

      const response = await fetch(elementsUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      console.log(`   Elements list status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Elements retrieved:', data);
        
        if (data.Items) {
          setElements(data.Items);
          setSelectedDatabase(dbName);
        } else {
          setErrors({ elements: 'No elements found in database' });
        }
      } else if (response.status === 401) {
        setErrors({ elements: 'Authentication required (401) - but database is reachable' });
      } else if (response.status === 404) {
        setErrors({ elements: `Database '${dbName}' not found (404)` });
      } else {
        const errorText = await response.text();
        setErrors({ elements: `Error ${response.status}: ${errorText}` });
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
      // Get attributes for the selected element
      const attributesUrl = `${workingEndpoint}/elements/path:${encodeURIComponent(elemPath)}/attributes`;
      console.log(`🔍 Getting attributes from: ${attributesUrl}`);

      const response = await fetch(attributesUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      console.log(`   Attributes list status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Attributes retrieved:', data);
        
        if (data.Items) {
          setAttributes(data.Items);
          setSelectedElement(elemPath);
        } else {
          setErrors({ attributes: 'No attributes found for element' });
        }
      } else if (response.status === 401) {
        setErrors({ attributes: 'Authentication required (401) - but element is reachable' });
      } else if (response.status === 404) {
        setErrors({ attributes: `Element not found (404)` });
      } else {
        const errorText = await response.text();
        setErrors({ attributes: `Error ${response.status}: ${errorText}` });
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
