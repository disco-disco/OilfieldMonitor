'use client';

import { useState } from 'react';

interface SimpleTestResult {
  url: string;
  method: string;
  status: 'success' | 'error' | 'warning' | 'testing';
  statusCode?: number;
  message: string;
  isWorking: boolean;
}

export default function SimpleConnectionTester() {
  const [serverName, setServerName] = useState('SRV-PIV01');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimpleTestResult[]>([]);
  const [workingEndpoint, setWorkingEndpoint] = useState<string | null>(null);

  const testDirectConnection = async () => {
    if (!serverName.trim()) {
      alert('Please enter a server name');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setWorkingEndpoint(null);

    // Test the most common PI Web API endpoints
    const endpoints = [
      `https://${serverName}/piwebapi`,
      `https://${serverName}:443/piwebapi`, 
      `http://${serverName}/piwebapi`,
      `http://${serverName}:5985/piwebapi`,
      `http://${serverName}:80/piwebapi`
    ];

    for (const url of endpoints) {
      // Add testing state
      setResults(prev => [...prev, {
        url,
        method: 'Direct Browser',
        status: 'testing',
        message: 'Testing...',
        isWorking: false
      }]);

      try {
        console.log(`Testing: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PLINQO-OilField-Monitor/1.0'
          }
        });

        clearTimeout(timeoutId);
        
        const isWorking = response.ok || response.status === 401;
        
        if (isWorking && !workingEndpoint) {
          setWorkingEndpoint(url);
        }

        // Update result
        setResults(prev => prev.map((r, idx) => 
          idx === prev.length - 1 ? {
            url,
            method: 'Direct Browser',
            status: response.ok ? 'success' : response.status === 401 ? 'warning' : 'error',
            statusCode: response.status,
            message: response.status === 401 
              ? '✅ Server reachable - Authentication required' 
              : response.ok 
                ? '✅ Connected successfully'
                : `❌ HTTP ${response.status}: ${response.statusText}`,
            isWorking
          } : r
        ));

        // If we found a working endpoint, we can continue testing others but note this one works
        if (isWorking) {
          console.log(`✅ Working endpoint found: ${url} (Status: ${response.status})`);
        }

      } catch (error) {
        const err = error as Error;
        
        // Update with error
        setResults(prev => prev.map((r, idx) => 
          idx === prev.length - 1 ? {
            url,
            method: 'Direct Browser',
            status: 'error',
            message: err.name === 'AbortError' 
              ? '❌ Timeout - Server not responding'
              : `❌ ${err.message}`,
            isWorking: false
          } : r
        ));
      }
    }

    setIsRunning(false);
  };

  const testWorkingEndpoint = async () => {
    if (!workingEndpoint) return;

    try {
      // Test some basic PI Web API endpoints with the working URL
      const testEndpoints = [
        `${workingEndpoint}`,
        `${workingEndpoint}/system`,
        `${workingEndpoint}/assetservers`,
      ];

      console.log('🧪 Testing PI Web API endpoints with working connection...');
      
      for (const endpoint of testEndpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          
          console.log(`${endpoint}: ${response.status} ${response.statusText}`);
          
          if (response.status === 401) {
            console.log('✅ Authentication required - server is working correctly');
          } else if (response.ok) {
            const data = await response.text();
            console.log(`✅ Success - Response length: ${data.length} characters`);
          }
        } catch (error) {
          console.log(`❌ ${endpoint}: ${error}`);
        }
      }
    } catch (error) {
      console.error('Error testing working endpoint:', error);
    }
  };

  const getStatusIcon = (status: SimpleTestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';  
      case 'error': return '❌';
      case 'testing': return '🔄';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🎯 Simple PI Web API Connection Test
        </h2>
        <p className="text-gray-600 mt-2">
          Direct connection test to find your working PI Web API endpoint
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter PI Web API server name"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            disabled={isRunning}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button 
            onClick={testDirectConnection}
            disabled={isRunning || !serverName.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isRunning ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {workingEndpoint && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">🎉</span>
              <div>
                <h4 className="font-semibold text-green-800">Working Endpoint Found!</h4>
                <p className="text-sm text-green-700 mt-1 font-mono">{workingEndpoint}</p>
                <button
                  onClick={testWorkingEndpoint}
                  className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Test PI Web API Features
                </button>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Connection Test Results</h3>
            {results.map((result, idx) => (
              <div 
                key={idx} 
                className={`border rounded-lg p-4 ${
                  result.isWorking 
                    ? 'bg-green-50 border-green-200' 
                    : result.status === 'testing' 
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-mono text-sm">{result.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.statusCode && (
                      <span className="text-xs text-gray-500">
                        HTTP {result.statusCode}
                      </span>
                    )}
                    {result.isWorking && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                        Working!
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {result.message}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-800">What We're Looking For:</h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• <strong>HTTP 200</strong> - Perfect! Full access to PI Web API</li>
                <li>• <strong>HTTP 401</strong> - Great! Server reachable, authentication required</li>
                <li>• <strong>HTTP 404</strong> - Wrong endpoint or PI Web API not installed</li>
                <li>• <strong>Connection errors</strong> - Server not reachable or firewall blocking</li>
              </ul>
            </div>
          </div>
        </div>

        {workingEndpoint && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-lg">🔧</span>
              <div>
                <h4 className="font-semibold text-yellow-800">Next Steps:</h4>
                <ol className="mt-2 space-y-1 text-sm text-yellow-700 list-decimal list-inside">
                  <li>Use this working endpoint in your PI System configuration</li>
                  <li>Configure authentication if needed (Windows Auth or Basic Auth)</li>
                  <li>Test with your actual PI AF server name and database</li>
                  <li>Open browser developer tools and check for any CORS messages</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
