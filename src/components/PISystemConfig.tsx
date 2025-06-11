import { useState } from 'react';
import { PIServerConfig, AttributeMapping, DEFAULT_ATTRIBUTE_MAPPING } from '@/types/pi-system';
import { Settings, Server, Database, TestTube, CheckCircle, AlertCircle } from 'lucide-react';

interface PIConfigProps {
  onConfigured: () => void;
}

export default function PISystemConfig({ onConfigured }: PIConfigProps) {
  const [config, setConfig] = useState<PIServerConfig>({
    afServerName: '',
    afDatabaseName: '',
    parentElementPath: '',
    templateName: '',
    username: '',
    password: ''
  });

  const [attributeMapping, setAttributeMapping] = useState<AttributeMapping>(DEFAULT_ATTRIBUTE_MAPPING);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/pi-system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, attributeMapping })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsConfigured(true);
        setTestResult({ success: true, message: 'PI System configured successfully' });
        onConfigured();
      } else {
        setTestResult({ success: false, message: result.message });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to configure PI System' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.afServerName || !config.afDatabaseName) {
      setTestResult({ success: false, message: 'Please fill in server and database names first' });
      return;
    }

    setIsLoading(true);
    try {
      // First configure, then test
      await fetch('/api/pi-system/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, attributeMapping })
      });

      const response = await fetch('/api/pi-system/test');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">PI System Configuration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure connection to AVEVA PI Asset Framework</p>
        </div>
      </div>

      <form onSubmit={handleConfigSubmit} className="space-y-6">
        {/* Server Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Server className="w-4 h-4 inline mr-2" />
              AF Server Name
            </label>
            <input
              type="text"
              value={config.afServerName}
              onChange={(e) => setConfig({ ...config, afServerName: e.target.value })}
              placeholder="e.g., PISERVER01"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Database className="w-4 h-4 inline mr-2" />
              AF Database Name
            </label>
            <input
              type="text"
              value={config.afDatabaseName}
              onChange={(e) => setConfig({ ...config, afDatabaseName: e.target.value })}
              placeholder="e.g., PLINQO_OILFIELD"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Element Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Parent Element Path
            </label>
            <input
              type="text"
              value={config.parentElementPath}
              onChange={(e) => setConfig({ ...config, parentElementPath: e.target.value })}
              placeholder="e.g., \\PLINQO_OILFIELD\\Production"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              required
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

        {/* Authentication (Optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Username (Optional)
            </label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="Domain\\Username"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password (Optional)
            </label>
            <input
              type="password"
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Attribute Mapping */}
        <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Attribute Mapping</h3>
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

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            testResult.success 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
            }`}>
              {testResult.message}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="w-4 h-4" />
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings className="w-4 h-4" />
            {isLoading ? 'Configuring...' : 'Configure & Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
