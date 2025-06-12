'use client';

import { useState } from 'react';

interface HybridTestResult {
  method: string;
  endpoint: string;
  status: 'success' | 'error' | 'warning' | 'testing';
  statusCode?: number;
  message: string;
  details?: any;
}

export default function HybridConnectionTester() {
  const [serverName, setServerName] = useState('SRV-PIV0101');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<HybridTestResult[]>([]);

  const testMethods = [
    {
      name: 'CORS Proxy',
      description: 'Via CORS-enabled proxy (recommended)',
      test: async (url: string) => {
        const response = await fetch(`/api/pi-system/cors-proxy?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        return await response.json();
      }
    },
    {
      name: 'Server Proxy',
      description: 'Via Next.js API proxy (bypasses CORS)',
      test: async (url: string) => {
        const response = await fetch('/api/pi-system/debug-endpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        return await response.json();
      }
    },
    {
      name: 'Direct Fetch',
      description: 'Direct browser request (may hit CORS)',
      test: async (url: string) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          });
          return {
            success: response.ok,
            statusCode: response.status,
            message: `Direct fetch: ${response.status} ${response.statusText}`,
            details: { headers: Object.fromEntries(response.headers.entries()) }
          };
        } catch (error) {
          return {
            success: false,
            message: `Direct fetch failed: ${(error as Error).message}`,
            details: { error: (error as Error).name }
          };
        }
      }
    },
    {
      name: 'No-CORS Mode',
      description: 'Browser request with no-cors mode',
      test: async (url: string) => {
        try {
          const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            headers: { 'Accept': 'application/json' }
          });
          return {
            success: true,
            statusCode: response.status || 0,
            message: response.type === 'opaque' 
              ? 'Server reachable (CORS-blocked response)' 
              : `No-CORS success: ${response.status}`,
            details: { 
              type: response.type,
              opaque: response.type === 'opaque'
            }
          };
        } catch (error) {
          return {
            success: false,
            message: `No-CORS failed: ${(error as Error).message}`,
            details: { error: (error as Error).name }
          };
        }
      }
    }
  ];

  const runHybridTests = async () => {
    if (!serverName.trim()) {
      alert('Please enter a server name');
      return;
    }

    setIsRunning(true);
    setResults([]);

    const testUrls = [
      `https://${serverName}/piwebapi`,
      `http://${serverName}:5985/piwebapi`,
      `http://${serverName}/piwebapi`
    ];

    for (const url of testUrls) {
      for (const method of testMethods) {
        // Add initial testing state
        setResults(prev => [...prev, {
          method: method.name,
          endpoint: url,
          status: 'testing',
          message: `Testing ${method.description.toLowerCase()}...`
        }]);

        try {
          const result = await method.test(url);
          
          // Update the result
          setResults(prev => prev.map((r, idx) => 
            idx === prev.length - 1 ? {
              method: method.name,
              endpoint: url,
              status: result.success ? 'success' : result.statusCode === 401 ? 'warning' : 'error',
              statusCode: result.statusCode,
              message: result.message,
              details: result.details
            } : r
          ));

          // If we found a working method, note it but continue testing others
          if (result.success || result.statusCode === 401) {
            console.log(`✅ Working method found: ${method.name} with ${url}`);
          }

        } catch (error) {
          // Update with error
          setResults(prev => prev.map((r, idx) => 
            idx === prev.length - 1 ? {
              method: method.name,
              endpoint: url,
              status: 'error',
              message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            } : r
          ));
        }
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: HybridTestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'testing': return '🔄';
    }
  };

  const getStatusBadge = (result: HybridTestResult) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded";
    if (result.status === 'success') return <span className={`${baseClasses} bg-green-100 text-green-800`}>Success</span>;
    if (result.status === 'warning') return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Reachable</span>;
    if (result.status === 'testing') return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Testing...</span>;
    return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'CORS Proxy': return 'text-orange-600';
      case 'Server Proxy': return 'text-blue-600';
      case 'Direct Fetch': return 'text-green-600';
      case 'No-CORS Mode': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mt-6">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🔧 Hybrid CORS Solution Tester
        </h2>
        <p className="text-gray-600 mt-2">
          Tests multiple methods to overcome CORS restrictions
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter PI Web API server name (e.g., SRV-PIV0101)"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            disabled={isRunning}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            onClick={runHybridTests}
            disabled={isRunning || !serverName.trim()}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Testing All Methods...' : 'Test All Methods'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Hybrid Test Results</h3>
            
            {/* Group results by endpoint */}
            {Array.from(new Set(results.map(r => r.endpoint))).map(endpoint => (
              <div key={endpoint} className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-3 font-mono text-sm">
                  {endpoint}
                </h4>
                
                <div className="space-y-2">
                  {results.filter(r => r.endpoint === endpoint).map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getStatusIcon(result.status)}</span>
                        <div>
                          <span className={`font-semibold ${getMethodColor(result.method)}`}>
                            {result.method}
                          </span>
                          <div className="text-sm text-gray-600 mt-1">
                            {result.message}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.statusCode && (
                          <span className="text-xs text-gray-500">
                            HTTP {result.statusCode}
                          </span>
                        )}
                        {getStatusBadge(result)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-orange-600 text-lg">🔧</span>
            <div>
              <h4 className="font-semibold text-orange-800">CORS Solutions Explanation:</h4>
              <ul className="mt-2 space-y-1 text-sm text-orange-700">
                <li>• <strong className="text-orange-600">CORS Proxy</strong> - Enhanced proxy with full CORS support</li>
                <li>• <strong className="text-blue-600">Server Proxy</strong> - Routes through Next.js API to bypass CORS</li>
                <li>• <strong className="text-green-600">Direct Fetch</strong> - Direct browser request (blocked by CORS policy)</li>
                <li>• <strong className="text-purple-600">No-CORS Mode</strong> - Browser request with limited response access</li>
                <li>• <strong>Best approach</strong>: Use CORS Proxy or configure CORS on PI Web API server</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-800">CORS Configuration for PI Web API:</h4>
              <ol className="mt-2 space-y-1 text-sm text-blue-700 list-decimal list-inside">
                <li>Open PI Web API Admin Utility on your PI server</li>
                <li>Navigate to System Configuration → CORS</li>
                <li>Add allowed origins: <code className="bg-blue-100 px-1 rounded">http://localhost:3001</code></li>
                <li>Allow methods: GET, POST, PUT, DELETE, OPTIONS</li>
                <li>Restart PI Web API service</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
