'use client';

import { useState } from 'react';

export default function PITestDirectPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testDirectConnection = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      console.log('🧪 DIRECT TEST: Starting direct PI Web API connection test...');
      
      // Use same fetch options as pi-explorer (direct browser fetch)
      const getFetchOptions = (): RequestInit => ({
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include' // This is the key for Windows authentication
      });
      
      // Test endpoints (same as pi-explorer)
      const testEndpoints = [
        `https://MES-PIV0801IQ/piwebapi`,
        `https://MES-PIV0801IQ:443/piwebapi`,
        `http://MES-PIV0801IQ/piwebapi`
      ];

      let workingEndpoint: string | null = null;

      console.log('🔍 DIRECT TEST: Testing PI Web API endpoints...');
      for (const endpoint of testEndpoints) {
        try {
          console.log(`🧪 DIRECT TEST: Testing ${endpoint}`);
          
          const response = await fetch(endpoint, getFetchOptions());
          
          console.log(`   DIRECT TEST: Status: ${response.status} ${response.statusText}`);

          // HTTP 200 (success) or HTTP 401 (auth required) both mean server is reachable
          if (response.ok || response.status === 401) {
            workingEndpoint = endpoint;
            console.log(`✅ DIRECT TEST: Working endpoint found: ${endpoint}`);
            break;
          }
        } catch (error) {
          console.log(`❌ DIRECT TEST: Failed to connect to: ${endpoint} - ${error}`);
          continue;
        }
      }

      if (workingEndpoint) {
        setTestResult(`✅ SUCCESS: Direct browser connection to PI Web API successful!\nWorking endpoint: ${workingEndpoint}\nThis proves the browser can reach PI Web API directly.`);
        
        // Try to load asset servers
        try {
          console.log('🔍 DIRECT TEST: Loading asset servers...');
          const serversResponse = await fetch(`${workingEndpoint}/assetservers`, getFetchOptions());
          
          if (serversResponse.ok || serversResponse.status === 401) {
            console.log('✅ DIRECT TEST: Asset servers endpoint accessible');
            setTestResult(prev => prev + '\n✅ Asset servers endpoint accessible');
            
            if (serversResponse.ok) {
              const serversData = await serversResponse.json();
              console.log('📋 DIRECT TEST: Asset servers response:', serversData);
              setTestResult(prev => prev + `\n✅ Asset servers loaded: ${serversData.Items?.length || 0} servers found`);
            }
          } else {
            console.log(`⚠️ DIRECT TEST: Asset servers failed: ${serversResponse.status}`);
            setTestResult(prev => prev + `\n⚠️ Asset servers failed: ${serversResponse.status}`);
          }
        } catch (error) {
          console.log('❌ DIRECT TEST: Asset servers error:', error);
          setTestResult(prev => prev + `\n❌ Asset servers error: ${error}`);
        }
      } else {
        setTestResult('❌ FAILED: No working PI Web API endpoint found via direct browser connection');
      }
      
    } catch (error) {
      console.error('❌ DIRECT TEST: Test failed:', error);
      setTestResult(`❌ Test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PI Web API Direct Connection Test
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Direct Browser Fetch Test</h2>
          <p className="text-gray-600 mb-4">
            This test uses the exact same approach as pi-explorer: direct browser fetch calls with credentials: 'include'
          </p>
          
          <button 
            onClick={testDirectConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Direct Connection'}
          </button>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
