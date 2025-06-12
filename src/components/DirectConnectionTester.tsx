'use client';

import { useState } from 'react';

interface DirectTestResult {
  endpoint: string;
  status: 'success' | 'error' | 'warning' | 'testing';
  statusCode?: number;
  message: string;
  details?: any;
}

export default function DirectConnectionTester() {
  const [serverName, setServerName] = useState('SRV-PIV0101');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DirectTestResult[]>([]);

  const testEndpoints = [
    { name: 'HTTPS Default', url: (server: string) => `https://${server}/piwebapi` },
    { name: 'HTTPS 443', url: (server: string) => `https://${server}:443/piwebapi` },
    { name: 'HTTP Default', url: (server: string) => `http://${server}/piwebapi` },
    { name: 'HTTP 5985', url: (server: string) => `http://${server}:5985/piwebapi` },
    { name: 'HTTP 80', url: (server: string) => `http://${server}:80/piwebapi` }
  ];

  const runDirectTests = async () => {
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
        message: 'Testing direct connection...'
      }]);

      try {
        // Direct fetch from browser (client-side)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          mode: 'no-cors', // This allows the request but limits response access
          headers: {
            'Accept': 'application/json',
          }
        });

        clearTimeout(timeoutId);

        // Update the result
        setResults(prev => prev.map((r, idx) => 
          idx === prev.length - 1 ? {
            endpoint: `${endpoint.name}: ${url}`,
            status: response.type === 'opaque' ? 'warning' : response.ok ? 'success' : 'error',
            statusCode: response.status || undefined,
            message: response.type === 'opaque' 
              ? 'Server reachable (CORS blocked response - this is good!)'
              : response.ok 
                ? `Connected successfully (${response.status})`
                : `HTTP ${response.status}: ${response.statusText}`,
            details: {
              type: response.type,
              url: response.url,
              redirected: response.redirected
            }
          } : r
        ));

        // If we got any response (even CORS blocked), the server is reachable
        if (response.type === 'opaque' || response.ok) {
          break;
        }

      } catch (error) {
        const err = error as Error;
        let message = '';
        let status: DirectTestResult['status'] = 'error';

        if (err.name === 'AbortError') {
          message = 'Connection timeout - server may be unreachable';
        } else if (err.message.includes('Failed to fetch')) {
          message = 'Network error - check server name and connectivity';
        } else {
          message = `Error: ${err.message}`;
        }

        // Update with error
        setResults(prev => prev.map((r, idx) => 
          idx === prev.length - 1 ? {
            endpoint: `${endpoint.name}: ${url}`,
            status,
            message,
            details: {
              errorName: err.name,
              errorMessage: err.message
            }
          } : r
        ));
      }
    }

    setIsRunning(false);
  };

  const openInNewTab = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusIcon = (status: DirectTestResult['status']) => {
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

  const getStatusBadge = (result: DirectTestResult) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded";
    if (result.status === 'success') return <span className={`${baseClasses} bg-green-100 text-green-800`}>Connected</span>;
    if (result.status === 'warning') return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Reachable</span>;
    if (result.status === 'testing') return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Testing...</span>;
    return <span className={`${baseClasses} bg-red-100 text-red-800`}>Failed</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-md mt-6">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🌐 Direct Browser Connection Tester
        </h2>
        <p className="text-gray-600 mt-2">
          Test PI Web API connectivity directly from your browser (works best on Windows PC)
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
            onClick={runDirectTests}
            disabled={isRunning || !serverName.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Testing...' : 'Test Direct'}
          </button>
        </div>

        {/* Quick Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Quick test:</span>
          {testEndpoints.map((endpoint, idx) => (
            <button
              key={idx}
              onClick={() => openInNewTab(endpoint.url(serverName))}
              disabled={!serverName.trim()}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {endpoint.name}
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Direct Connection Results</h3>
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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-lg">🌐</span>
            <div>
              <h4 className="font-semibold text-yellow-800">Direct Browser Testing:</h4>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                <li>• This tests connectivity directly from your browser</li>
                <li>• CORS blocking is normal and actually indicates the server is reachable</li>
                <li>• Use "Quick test" buttons to open PI Web API directly in new tabs</li>
                <li>• Best results when running on your Windows PC with PI server access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
