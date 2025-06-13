// PI System Types and Interfaces

export interface PIServerConfig {
  afServerName: string;
  piWebApiServerName: string; // Separate field for PI Web API server
  afDatabaseName: string;
  parentElementPath: string;
  templateName: string;
  username?: string;
  password?: string;
}

export interface PIAttribute {
  name: string;
  value: string | number | boolean | null;
  timestamp: Date;
  quality: string;
  uom?: string; // Unit of Measure
}

export interface PIElement {
  name: string;
  path: string;
  templateName: string;
  attributes: PIAttribute[];
  children?: PIElement[];
}

export interface WellData {
  name: string;
  wellPadName: string;
  oilRate: number;
  liquidRate: number;
  waterCut: number;
  espFrequency: number;
  planTarget: number;
  planDeviation: number;
  status: 'good' | 'warning' | 'alert';
  lastUpdate: Date;
  // Additional dynamic attributes that may be available
  gasRate?: number;
  tubingPressure?: number;
  casingPressure?: number;
  temperature?: number;
  flowlinePressure?: number;
  chokeSize?: number;
  gasLiftRate?: number;
  pumpSpeed?: number;
  motorAmps?: number;
  vibration?: number;
  runtime?: number;
  shutinTime?: number;
  wellheadPressure?: number;
  bottomholePressure?: number;
  flowRate?: number;
  // Custom attributes map for additional PI attributes found
  customAttributes?: { [key: string]: number | string };
}

export interface WellPadData {
  name: string;
  wells: WellData[];
  status: 'good' | 'warning' | 'alert';  // Added status
  totalWells: number;      // Changed from wellCount
  activeWells: number;     // Added active wells count
  avgOilRate: number;      // Changed from totalProduction
  avgWaterCut: number;     // Changed from averageWaterCut
  isConnectedToPI?: boolean; // Optional flag to indicate PI connection status
}

// PI AF Connection Status
export interface PIConnectionStatus {
  connected: boolean;
  serverName?: string;
  databaseName?: string;
  lastConnection?: Date;
  error?: string;
}

// Configuration for attribute mapping
export interface AttributeMapping {
  // Core production attributes
  oilRate: string;
  liquidRate: string;
  waterCut: string;
  espFrequency: string;
  planTarget: string;
  // Extended attributes (optional)
  gasRate?: string;
  tubingPressure?: string;
  casingPressure?: string;
  temperature?: string;
  flowlinePressure?: string;
  chokeSize?: string;
  gasLiftRate?: string;
  pumpSpeed?: string;
  motorAmps?: string;
  vibration?: string;
  runtime?: string;
  shutinTime?: string;
  wellheadPressure?: string;
  bottomholePressure?: string;
  flowRate?: string;
}

export const DEFAULT_ATTRIBUTE_MAPPING: AttributeMapping = {
  oilRate: 'Oil_Rate',
  liquidRate: 'Liquid_Rate',
  waterCut: 'Water_Cut',
  espFrequency: 'ESP_Frequency',
  planTarget: 'Plan_Target',
  // Extended default mappings
  gasRate: 'Gas_Rate',
  tubingPressure: 'Tubing_Pressure',
  casingPressure: 'Casing_Pressure',
  temperature: 'Temperature',
  flowlinePressure: 'Flowline_Pressure',
  chokeSize: 'Choke_Size',
  gasLiftRate: 'Gas_Lift_Rate',
  pumpSpeed: 'Pump_Speed',
  motorAmps: 'Motor_Amps',
  vibration: 'Vibration',
  runtime: 'Runtime',
  shutinTime: 'Shutin_Time',
  wellheadPressure: 'Wellhead_Pressure',
  bottomholePressure: 'Bottomhole_Pressure',
  flowRate: 'Flow_Rate'
};
