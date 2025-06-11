import { Activity, Droplets, Gauge, TrendingUp, AlertTriangle, CheckCircle, Thermometer, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Oil Well Monitor</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Real-time Well Parameters</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Well Information */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Well #A-101</h2>
          <p className="text-slate-600 dark:text-slate-400">Location: East Field Block 7 | Last Updated: {new Date().toLocaleString()}</p>
        </div>

        {/* Main Well Tile */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          {/* Well Status Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Production Status</h3>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-medium">Operational</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500 dark:text-slate-400">Daily Production</div>
              <div className="text-3xl font-bold text-blue-600">2,847</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">barrels/day</div>
            </div>
          </div>

          {/* Parameters Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Pressure */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Gauge className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pressure</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">1,250</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">PSI</div>
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">+2.5%</span>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Temperature</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">185°F</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Downhole</div>
              <div className="mt-2 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">Normal</span>
              </div>
            </div>

            {/* Flow Rate */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Flow Rate</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">425</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">bbl/hr</div>
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">+1.2%</span>
              </div>
            </div>

            {/* Power Usage */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Power</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">89.5</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">kW</div>
              <div className="mt-2 flex items-center gap-1">
                <Activity className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">Efficient</span>
              </div>
            </div>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Water Cut</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">12.5%</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Gas Oil Ratio</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">850</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">scf/bbl</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pump Efficiency</div>
              <div className="text-xl font-bold text-green-600">94.2%</div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">Production Normal</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">All systems operating within parameters</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800 dark:text-blue-300">Equipment Active</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">Pump and monitoring systems online</p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800 dark:text-yellow-300">Maintenance Due</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Scheduled maintenance in 5 days</p>
          </div>
        </div>
      </main>
    </div>
  );
}
