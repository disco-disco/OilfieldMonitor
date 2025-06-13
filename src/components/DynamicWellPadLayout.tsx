import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { WellPadData } from '@/types/pi-system';
import DynamicWellTile from './DynamicWellTile';

interface DynamicWellPadLayoutProps {
  wellPad: WellPadData;
  index: number;
}

// Calculate optimal grid layout based on number of wells
const getGridLayout = (wellCount: number) => {
  if (wellCount <= 3) {
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
  } else if (wellCount <= 8) {
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
  } else if (wellCount <= 15) {
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';
  } else if (wellCount <= 24) {
    return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';
  } else {
    return 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8';
  }
};

// Get status icon and color based on wellpad status
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'good':
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        label: 'Operational'
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        label: 'Warning'
      };
    case 'alert':
      return {
        icon: XCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        label: 'Alert'
      };
    default:
      return {
        icon: CheckCircle,
        color: 'text-gray-500',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800',
        label: 'Unknown'
      };
  }
};

// Calculate summary statistics
const calculateStats = (wellPad: WellPadData) => {
  const totalOilProduction = Math.round(wellPad.avgOilRate * wellPad.totalWells);
  const totalLiquidProduction = wellPad.wells.reduce((sum, well) => sum + well.liquidRate, 0);
  const avgGasRate = wellPad.wells
    .filter(well => well.gasRate !== undefined)
    .reduce((sum, well) => sum + (well.gasRate || 0), 0) / wellPad.wells.length;
  
  const avgTubingPressure = wellPad.wells
    .filter(well => well.tubingPressure !== undefined)
    .reduce((sum, well) => sum + (well.tubingPressure || 0), 0) / 
    wellPad.wells.filter(well => well.tubingPressure !== undefined).length;

  return {
    totalOilProduction,
    totalLiquidProduction: Math.round(totalLiquidProduction),
    avgGasRate: avgGasRate ? Math.round(avgGasRate) : undefined,
    avgTubingPressure: avgTubingPressure ? Math.round(avgTubingPressure) : undefined,
    alertWells: wellPad.wells.filter(w => w.status === 'alert').length,
    warningWells: wellPad.wells.filter(w => w.status === 'warning').length,
    goodWells: wellPad.wells.filter(w => w.status === 'good').length
  };
};

export default function DynamicWellPadLayout({ wellPad, index }: DynamicWellPadLayoutProps) {
  const gridLayout = getGridLayout(wellPad.wells.length);
  const statusDisplay = getStatusDisplay(wellPad.status);
  const stats = calculateStats(wellPad);
  const StatusIcon = statusDisplay.icon;

  // Determine if we should use compact view for wells
  const useCompactView = wellPad.wells.length > 20;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border p-6 ${statusDisplay.borderColor}`}>
      {/* WellPad Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{wellPad.name}</h3>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {wellPad.wells.length} wells
            </span>
            <span className="text-sm text-blue-600 font-medium">
              {stats.totalOilProduction.toLocaleString()} bbl/day oil
            </span>
            <span className="text-sm text-cyan-600 font-medium">
              {stats.totalLiquidProduction.toLocaleString()} bbl/day liquid
            </span>
            {stats.avgGasRate && (
              <span className="text-sm text-purple-600 font-medium">
                {stats.avgGasRate.toLocaleString()} Mcf/day gas
              </span>
            )}
            <span className="text-sm text-orange-600">
              {Math.round(wellPad.avgWaterCut)}% water cut
            </span>
            {stats.avgTubingPressure && (
              <span className="text-sm text-orange-500">
                {stats.avgTubingPressure} psi avg tubing
              </span>
            )}
          </div>
          
          {/* Well Status Summary */}
          {(stats.alertWells > 0 || stats.warningWells > 0) && (
            <div className="flex items-center gap-4 mt-2">
              {stats.alertWells > 0 && (
                <span className="text-sm text-red-600 font-medium">
                  {stats.alertWells} alert wells
                </span>
              )}
              {stats.warningWells > 0 && (
                <span className="text-sm text-yellow-600 font-medium">
                  {stats.warningWells} warning wells
                </span>
              )}
              <span className="text-sm text-green-600 font-medium">
                {stats.goodWells} good wells
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
          <span className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>
      </div>

      {/* Wells Grid - Dynamic Layout */}
      <div className={`grid gap-4 ${gridLayout}`}>
        {wellPad.wells.map((well, wellIndex) => (
          <DynamicWellTile
            key={wellIndex}
            well={well}
            compact={useCompactView}
          />
        ))}
      </div>

      {/* Wellpad Footer with Additional Info */}
      {wellPad.wells.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              Layout: {gridLayout.split(' ').pop()?.replace('grid-cols-', '')} columns on large screens
            </span>
            <span>
              Last Updated: {wellPad.wells[0]?.lastUpdated ? new Date(wellPad.wells[0].lastUpdated).toLocaleTimeString() : 'Unknown'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
