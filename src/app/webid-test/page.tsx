'use client';

import React, { useState, useEffect } from 'react';

interface WebIDTestResult {
  success: boolean;
  message: string;
  steps: {
    endpointFound: boolean;
    assetServersLoaded: boolean;
    targetServerFound: boolean;
    databasesLoaded: boolean;
    targetDatabaseFound: boolean;
    elementsLoaded: boolean;
  };
  details: {
    workingEndpoint: string | null;
    assetServers: string[];
    targetServerWebId: string | null;
    databases: string[];
    targetDatabaseWebId: string | null;
    elementCount: number;
    sampleElements: string[];
  };
}

interface PIConfig {
  afServerName: string;
  piWebApiServerName: string;
  afDatabaseName: string;
  parentElementPath: string;
}

export default function WebIDTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<WebIDTestResult | null>(null);
  const [config, setConfig] = useState<PIConfig>({
    afServerName: 'SRV-PIAF0101',
    piWebApiServerName: 'srv-piwebapi01',
    afDatabaseName: 'PLINQO',
    parentElementPath: 'PLINQO\\Operations\\Wellpads'
  });

  const runWebIDTest = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      // Test the WebID-based implementation
      const response = await fetch('/api/pi-system/webid-test', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        steps: {
          endpointFound: false,
          assetServersLoaded: false,
          targetServerFound: false,
          databasesLoaded: false,
          targetDatabaseFound: false,
          elementsLoaded: false
        },
        details: {
          workingEndpoint: null,
          assetServers: [],
          targetServerWebId: null,
          databases: [],
          targetDatabaseWebId: null,
          elementCount: 0,
          sampleElements: []
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stepNames = {
    endpointFound: 'PI Web API Endpoint Discovery',
    assetServersLoaded: 'Asset Servers Loaded',
    targetServerFound: 'Target AF Server Found',
    databasesLoaded: 'Databases Loaded (WebID-based)',
    targetDatabaseFound: 'Target Database Found',
    elementsLoaded: 'Elements Loaded Successfully'
  };

  const getStepIcon = (success: boolean) => success ? '✅' : '❌';
  const getStepColor = (success: boolean) => success ? 'text-green-600' : 'text-red-600';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          WebID-Based PI Web API Tester
        </h1>
        <p className="text-gray-600">
          Test the complete WebID-based navigation implementation for PI Web API
        </p>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              WebID Implementation Complete
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                This test validates the corrected WebID-based PI Web API navigation. 
                The system now properly calls <code>/assetservers</code> first, 
                extracts WebIDs, then uses <code>/assetservers/&#123;WEBID&#125;/assetdatabases</code> 
                instead of the problematic direct server name format.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={runWebIDTest}
          disabled={isLoading}
          className={`
            px-6 py-3 rounded-md text-white font-medium transition-colors
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Testing WebID Implementation...
            </div>
          ) : (
            'Run WebID Test'
          )}
        </button>
      </div>

      {testResult && (
        <div className="space-y-6">
          {/* Overall Result */}
          <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">
                  {testResult.success ? '✅' : '❌'}
                </span>
              </div>
              <div className="ml-3">
                <h3 className={`text-lg font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'WebID Test Passed' : 'WebID Test Failed'}
                </h3>
                <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Results */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-lg font-medium text-gray-900 mb-4">WebID Navigation Steps</h4>
            <div className="space-y-3">
              {Object.entries(testResult.steps).map(([stepKey, success]) => (
                <div key={stepKey} className="flex items-center">
                  <span className="text-xl mr-3">
                    {getStepIcon(success)}
                  </span>
                  <span className={`font-medium ${getStepColor(success)}`}>
                    {stepNames[stepKey as keyof typeof stepNames]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          {testResult.details && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Test Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Working Endpoint:</strong>
                  <div className="font-mono text-blue-600">
                    {testResult.details.workingEndpoint || 'Not found'}
                  </div>
                </div>
                <div>
                  <strong>Target Server WebID:</strong>
                  <div className="font-mono text-green-600">
                    {testResult.details.targetServerWebId || 'Not found'}
                  </div>
                </div>
                <div>
                  <strong>Asset Servers Found:</strong>
                  <div className="text-gray-700">
                    {testResult.details.assetServers.length > 0 
                      ? testResult.details.assetServers.join(', ')
                      : 'None'
                    }
                  </div>
                </div>
                <div>
                  <strong>Target Database WebID:</strong>
                  <div className="font-mono text-green-600">
                    {testResult.details.targetDatabaseWebId || 'Not found'}
                  </div>
                </div>
                <div>
                  <strong>Databases Found:</strong>
                  <div className="text-gray-700">
                    {testResult.details.databases.length > 0 
                      ? testResult.details.databases.join(', ')
                      : 'None'
                    }
                  </div>
                </div>
                <div>
                  <strong>Elements Loaded:</strong>
                  <div className="text-gray-700">
                    {testResult.details.elementCount} elements
                  </div>
                </div>
              </div>
              
              {testResult.details.sampleElements.length > 0 && (
                <div className="mt-4">
                  <strong>Sample Elements:</strong>
                  <div className="text-gray-700 mt-1">
                    {testResult.details.sampleElements.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WebID vs Direct URL Comparison */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
            <h4 className="text-lg font-medium text-yellow-800 mb-3">URL Format Comparison</h4>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-red-700">❌ OLD (Problematic):</div>
                <div className="font-mono text-red-600 bg-red-100 p-2 rounded">
                  /assetservers/SRV-PIAF0101/assetdatabases
                </div>
                <div className="text-red-700 mt-1">
                  → Results in "Unknown or invalid WebID format" error
                </div>
              </div>
              <div>
                <div className="font-medium text-green-700">✅ NEW (WebID-based):</div>
                <div className="font-mono text-green-600 bg-green-100 p-2 rounded">
                  /assetservers → find server → /assetservers/&#123;WEBID&#125;/assetdatabases
                </div>
                <div className="text-green-700 mt-1">
                  → Proper PI Web API navigation using WebIDs
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
