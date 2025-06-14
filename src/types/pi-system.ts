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
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'alert' | 'warning' | 'good';
  wellPadName?: string;
  attributes: { [key: string]: number | string };
  lastUpdated: string;
  // Production data properties
  oilRate: number;
  gasRate: number;
  waterCut: number;
  waterRate: number;
  liquidRate: number;
  espFrequency?: number;
  tubingPressure?: number;
  casingPressure?: number;
  temperature?: number;
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
  flowlinePressure?: number;
  planTarget?: number;
}

export interface WellPadData {
  id: string;
  name: string;
  location: string;
  wells: WellData[];
  totalOilRate: number;
  totalGasRate: number;
  totalWaterRate: number;
  averagePressure: number;
  lastUpdated: string;
  status: 'active' | 'inactive' | 'alert' | 'warning' | 'good';
  totalWells: number;
  avgOilRate: number;
  avgWaterCut: number;
  activeWells?: number;
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
  oilRate: 'Oil Production Rate',
  liquidRate: 'Total Liquid Rate',
  waterCut: 'Water Cut Percentage',
  espFrequency: 'ESP Motor Frequency',
  planTarget: 'Daily Production Target',
  // Extended default mappings
  gasRate: 'Gas Production Rate',
  tubingPressure: 'Tubing Head Pressure',
  casingPressure: 'Casing Pressure',
  temperature: 'Temperature',
  flowlinePressure: 'Flowline Pressure',
  chokeSize: 'Choke Size',
  gasLiftRate: 'Gas Lift Rate',
  pumpSpeed: 'Pump Speed',
  motorAmps: 'Motor Amps',
  vibration: 'Vibration',
  runtime: 'Runtime',
  shutinTime: 'Shutin Time',
  wellheadPressure: 'Wellhead Pressure',
  bottomholePressure: 'Bottomhole Pressure',
  flowRate: 'Flow Rate'
};
