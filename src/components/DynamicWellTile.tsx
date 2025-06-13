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
  // Get all available attributes from the well data
  const getAvailableAttributes = () => {
    const attributes: Array<{ key: string; value: number; config: any }> = [];
    
    Object.entries(well).forEach(([key, value]) => {
      if (key in ATTRIBUTE_CONFIG && typeof value === 'number') {
        attributes.push({ 
          key, 
          value, 
          config: ATTRIBUTE_CONFIG[key as keyof typeof ATTRIBUTE_CONFIG] 
        });
      }
    });

    // Add custom attributes if they exist
    if (well.customAttributes) {
      Object.entries(well.customAttributes).forEach(([key, value]) => {
        if (typeof value === 'number') {
          attributes.push({
            key: `custom_${key}`,
            value,
            config: {
              label: key.replace(/_/g, ' '),
              unit: '',
              icon: Settings,
              priority: 100,
              colorClass: 'text-slate-600',
              format: (v: number) => v.toString()
            }
          });
        }
      });
    }
    
    // Sort by priority
    return attributes.sort((a, b) => a.config.priority - b.config.priority);
  };

  const availableAttrs = getAvailableAttributes();
  const maxAttributes = compact ? 4 : 8;
  const displayAttributes = availableAttrs.slice(0, maxAttributes);

  return (
    <div
      className={`rounded-lg p-3 border transition-all hover:shadow-md cursor-pointer ${
        well.status === 'good'
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : well.status === 'warning'
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}
    >
      {/* Well Name and Status */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{well.name}</h4>
        <div className={`w-2 h-2 rounded-full ${
          well.status === 'good' ? 'bg-green-500' :
          well.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        }`}></div>
      </div>

      {/* Dynamic Attributes */}
      <div className="space-y-1">
        {displayAttributes.map(({ key, value, config }) => {
          const Icon = typeof config.icon === 'function' ? config.icon(value) : config.icon;
          const colorClass = typeof config.colorClass === 'function' ? config.colorClass(value) : config.colorClass;
          
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
        Updated: {well.lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}
