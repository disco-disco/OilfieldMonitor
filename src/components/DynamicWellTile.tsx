import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Droplets, 
  Thermometer, 
  Gauge, 
  Activity,
  Clock,
  Settings
} from 'lucide-react';
import { WellData } from '@/types/pi-system';

interface DynamicWellTileProps {
  well: WellData;
  availableAttributes?: string[];
  compact?: boolean;
}

// Configuration for attribute display
const ATTRIBUTE_CONFIG = {
  oilRate: { 
    label: 'Oil Rate', 
    unit: 'bbl/day', 
    icon: Droplets, 
    priority: 1,
    colorClass: 'text-blue-600',
    format: (value: number) => value.toLocaleString()
  },
  liquidRate: { 
    label: 'Liquid Rate', 
    unit: 'bbl/day', 
    icon: Droplets, 
    priority: 2,
    colorClass: 'text-cyan-600',
    format: (value: number) => value.toLocaleString()
  },
  waterCut: { 
    label: 'Water Cut', 
    unit: '%', 
    icon: Droplets, 
    priority: 3,
    colorClass: (value: number) => value > 25 ? 'text-red-600' : value > 20 ? 'text-yellow-600' : 'text-green-600',
    format: (value: number) => value.toString()
  },
  espFrequency: { 
    label: 'ESP Freq', 
    unit: 'Hz', 
    icon: Zap, 
    priority: 4,
    colorClass: 'text-yellow-600',
    format: (value: number) => value.toString()
  },
  planDeviation: { 
    label: 'Plan Dev', 
    unit: '%', 
    icon: (value: number) => value >= 0 ? TrendingUp : TrendingDown, 
    priority: 5,
    colorClass: (value: number) => value >= 0 ? 'text-green-600' : 'text-red-600',
    format: (value: number) => `${value > 0 ? '+' : ''}${value}`
  },
  gasRate: { 
    label: 'Gas Rate', 
    unit: 'Mcf/day', 
    icon: Activity, 
    priority: 6,
    colorClass: 'text-purple-600',
    format: (value: number) => value.toLocaleString()
  },
  tubingPressure: { 
    label: 'Tubing P', 
    unit: 'psi', 
    icon: Gauge, 
    priority: 7,
    colorClass: 'text-orange-600',
    format: (value: number) => value.toLocaleString()
  },
  casingPressure: { 
    label: 'Casing P', 
    unit: 'psi', 
    icon: Gauge, 
    priority: 8,
    colorClass: 'text-red-600',
    format: (value: number) => value.toLocaleString()
  },
  temperature: { 
    label: 'Temp', 
    unit: '°F', 
    icon: Thermometer, 
    priority: 9,
    colorClass: 'text-red-500',
    format: (value: number) => value.toString()
  },
  flowlinePressure: { 
    label: 'Flowline P', 
    unit: 'psi', 
    icon: Gauge, 
    priority: 10,
    colorClass: 'text-indigo-600',
    format: (value: number) => value.toLocaleString()
  },
  chokeSize: { 
    label: 'Choke Size', 
    unit: 'in', 
    icon: Settings, 
    priority: 11,
    colorClass: 'text-gray-600',
    format: (value: number) => value.toString()
  },
  gasLiftRate: { 
    label: 'Gas Lift', 
    unit: 'Mcf/day', 
    icon: Activity, 
    priority: 12,
    colorClass: 'text-pink-600',
    format: (value: number) => value.toLocaleString()
  },
  pumpSpeed: { 
    label: 'Pump Speed', 
    unit: 'rpm', 
    icon: Settings, 
    priority: 13,
    colorClass: 'text-teal-600',
    format: (value: number) => value.toLocaleString()
  },
  motorAmps: { 
    label: 'Motor Amps', 
    unit: 'A', 
    icon: Zap, 
    priority: 14,
    colorClass: 'text-yellow-500',
    format: (value: number) => value.toString()
  },
  vibration: { 
    label: 'Vibration', 
    unit: 'in/sec', 
    icon: Activity, 
    priority: 15,
    colorClass: 'text-red-400',
    format: (value: number) => value.toString()
  },
  runtime: { 
    label: 'Runtime', 
    unit: 'hrs', 
    icon: Clock, 
    priority: 16,
    colorClass: 'text-green-500',
    format: (value: number) => value.toString()
  },
  shutinTime: { 
    label: 'Shutin Time', 
    unit: 'hrs', 
    icon: Clock, 
    priority: 17,
    colorClass: 'text-gray-500',
    format: (value: number) => value.toString()
  },
  wellheadPressure: { 
    label: 'WH Pressure', 
    unit: 'psi', 
    icon: Gauge, 
    priority: 18,
    colorClass: 'text-blue-500',
    format: (value: number) => value.toLocaleString()
  },
  bottomholePressure: { 
    label: 'BH Pressure', 
    unit: 'psi', 
    icon: Gauge, 
    priority: 19,
    colorClass: 'text-indigo-500',
    format: (value: number) => value.toLocaleString()
  },
  flowRate: { 
    label: 'Flow Rate', 
    unit: 'bbl/day', 
    icon: Droplets, 
    priority: 20,
    colorClass: 'text-cyan-500',
    format: (value: number) => value.toLocaleString()
  }
};

export default function DynamicWellTile({ well, availableAttributes, compact = false }: DynamicWellTileProps) {
  // Get all available attributes from the well data, configured by ATTRIBUTE_CONFIG
  const getAvailableAttributes = () => {
    const attributes: Array<{ key: string; value: number; config: any }> = [];
    
    if (well.attributes) { // Expects well.attributes to be { oilRate: value, waterCut: value, ... }
      Object.entries(well.attributes).forEach(([settingsKey, value]) => {
        // settingsKey is "oilRate", "waterCut", etc.
        // value is the numeric value
        const configEntry = ATTRIBUTE_CONFIG[settingsKey as keyof typeof ATTRIBUTE_CONFIG];

        if (typeof value === 'number' && configEntry) {
          // Resolve icon if it's a function
          const resolvedIcon = typeof configEntry.icon === 'function' 
                               ? configEntry.icon(value) 
                               : configEntry.icon;
          
          // Resolve colorClass if it's a function
          const resolvedColorClass = typeof configEntry.colorClass === 'function'
                                     ? configEntry.colorClass(value)
                                     : configEntry.colorClass;

          attributes.push({
            key: settingsKey, // Use settingsKey as the key
            value,
            config: { // Use the predefined config from ATTRIBUTE_CONFIG
              ...configEntry,
              icon: resolvedIcon,
              colorClass: resolvedColorClass,
            }
          });
        }
      });
    }
    
    // Sort by priority defined in ATTRIBUTE_CONFIG
    attributes.sort((a, b) => (a.config.priority || 99) - (b.config.priority || 99));
    return attributes;
  };

  // Helper function to get appropriate unit for attribute (fallback, ideally from ATTRIBUTE_CONFIG)
  const getUnitForAttribute = (attributeName: string): string => {
    const lowerName = attributeName.toLowerCase();
    if (lowerName.includes('rate') && lowerName.includes('oil')) return 'bbl/day';
    if (lowerName.includes('rate') && lowerName.includes('liquid')) return 'bbl/day';
    if (lowerName.includes('rate') && lowerName.includes('gas')) return 'Mcf/day';
    if (lowerName.includes('pressure')) return 'psi';
    if (lowerName.includes('frequency')) return 'Hz';
    if (lowerName.includes('temperature')) return '°F';
    if (lowerName.includes('cut') || lowerName.includes('%')) return '%';
    if (lowerName.includes('choke')) return 'in';
    if (lowerName.includes('speed')) return 'rpm';
    if (lowerName.includes('amp')) return 'A';
    if (lowerName.includes('vibration')) return 'in/sec';
    if (lowerName.includes('time')) return 'hrs';
    return '';
  };

  // Helper function to get appropriate icon for attribute (fallback, ideally from ATTRIBUTE_CONFIG)
  const getIconForAttribute = (attributeName: string) => {
    const lowerName = attributeName.toLowerCase();
    if (lowerName.includes('oil') || lowerName.includes('liquid') || lowerName.includes('flow')) return Droplets;
    if (lowerName.includes('pressure')) return Gauge;
    if (lowerName.includes('gas')) return Activity;
    if (lowerName.includes('frequency') || lowerName.includes('amp')) return Zap;
    if (lowerName.includes('temperature')) return Thermometer;
    if (lowerName.includes('time')) return Clock;
    return Settings;
  };

  const availableAttrs = getAvailableAttributes();
  const maxAttributes = compact ? 4 : 8;
  const displayAttributes = availableAttrs.slice(0, maxAttributes);

  return (
    <div
      className={`rounded-lg p-3 border transition-all hover:shadow-md cursor-pointer ${
        well.status === 'active'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
      }`}
    >
      {/* Well Name and Status */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{well.name}</h4>
        <div className={`w-2 h-2 rounded-full ${
          well.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
        }`}></div>
      </div>

      {/* Dynamic Attributes */}
      <div className="space-y-1">
        {displayAttributes.map(({ key, value, config }) => {
          const Icon = config.icon;
          const colorClass = config.colorClass;
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Icon className="w-3 h-3" />
                {config.label}
              </div>
              <div className={`font-semibold text-sm ${colorClass}`}>
                {config.format(value)}{config.unit && ` ${config.unit}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show indicator if there are more attributes */}
      {availableAttrs.length > maxAttributes && (
        <div className="mt-2 text-xs text-slate-400 text-center">
          +{availableAttrs.length - maxAttributes} more attributes
        </div>
      )}

      {/* Last Update */}
      <div className="mt-2 text-xs text-slate-400">
        Updated: {well.lastUpdated ? new Date(well.lastUpdated).toLocaleTimeString() : 'N/A'}
      </div>
    </div>
  );
}
