'use client';

import { useState } from 'react';

interface TestResult {
  endpoint: string;
  status: 'success' | 'error' | 'warning' | 'testing';
  statusCode?: number;
  message: string;
  details?: any;
}

export default function ConnectionDebugger() {
  const [serverName, setServerName] = useState('SRV-PIV0101');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const testEndpoints = [
    { name: 'HTTPS Default', url: (server: string) => `https://${server}/piwebapi` },
    { name: 'HTTPS 443', url: (server: string) => `https://${server}:443/piwebapi` },
    { name: 'HTTP Default', url: (server: string) => `http://${server}/piwebapi` },
    { name: 'HTTP 5985', url: (server: string) => `http://${server}:5985/piwebapi` },
    { name: 'HTTP 80', url: (server: string) => `http://${server}:80/piwebapi` }
  ];

  const runConnectionTests = async () => {
    if (!serverName.trim()) {
      alert('Please enter a server name');
      return;
    }

    setIsRunning(true);
    setResults([]);

    for (const endpoint of testEndpoints) {
      const url = endpoint.url(serverName);
      
      // Add initial testing state
      setResults(prev => [...prev, {
        endpoint: `${endpoint.name}: ${url}`,
        status: 'testing',
        message: 'Testing connection...'
      }]);

      try {
        // Test via our API route to avoid CORS issues
        const response = await fetch('/api/pi-system/debug-endpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        const result = await response.json();

        // Update the result
        setResults(prev => prev.map((r, idx) => 
          idx === prev.length - 1 ? {
            endpoint: `${endpoint.name}: ${url}`,
            status: result.success ? 'success' : result.statusCode === 401 ? 'warning' : 'error',
            statusCode: result.statusCode,
            message: result.message,
            details: result.details
          } : r
        ));

        // If we found a working endpoint, break
        if (result.success || result.statusCode === 401) {
          break;
        }

      } catch (error) {
        // Update with error
        setResults(prev => prev.map((r, idx) => 
          idx === prev.length - 1 ? {
            endpoint: `${endpoint.name}: ${url}`,
            status: 'error',
            message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
          } : r
        ));
      }
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'testing':
        return '🔄';
    }
  };

  const getStatusBadge = (result: TestResult) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded";
    if (result.status === 'success') return <span className={`${baseClasses} bg-green-100 text-green-800`}>Connected</span>;
    if (result.status === 'warning') return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Auth Required</span>;
    if (result.status === 'testing') return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Testing...</span>;
    return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🔍 PI Web API Connection Debugger
          </h1>
          <p className="text-gray-600 mt-2">
            Test connectivity to your PI Web API server with different endpoint configurations
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
              onClick={runConnectionTests}
              disabled={isRunning || !serverName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Test Results</h3>
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <span className="font-mono text-sm">{result.endpoint}</span>
                    </div>
                    {getStatusBadge(result)}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {result.statusCode && (
                      <span className="font-semibold">HTTP {result.statusCode}: </span>
                    )}
                    {result.message}
                  </div>

                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-blue-600 hover:text-blue-800">
                        Show Technical Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-lg">💡</span>
              <div>
                <h4 className="font-semibold text-blue-800">Troubleshooting Tips:</h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• <strong>401 Unauthorized</strong> is actually good - it means the server is reachable!</li>
                  <li>• <strong>CORS errors</strong> are expected when testing from browser</li>
                  <li>• <strong>Connection refused</strong> means PI Web API service isn't running</li>
                  <li>• <strong>DNS errors</strong> mean the server name is incorrect</li>
                  <li>• <strong>Timeout</strong> suggests network connectivity issues</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
