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
  liquidRate: number;      // Added liquid rate
  waterCut: number;
  espFrequency: number;
  planDeviation: number;
  status: 'good' | 'warning' | 'alert';
  lastUpdated: Date;
}

export interface WellPadData {
  name: string;
  wells: WellData[];
  totalProduction: number;
  averageWaterCut: number;
  wellCount: number;
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
  oilRate: string;        // PI Attribute name for oil rate
  liquidRate: string;     // PI Attribute name for liquid rate
  waterCut: string;       // PI Attribute name for water cut
  espFrequency: string;   // PI Attribute name for ESP frequency
  planTarget: string;     // PI Attribute name for plan target
}

export const DEFAULT_ATTRIBUTE_MAPPING: AttributeMapping = {
  oilRate: 'Oil_Rate',
  liquidRate: 'Liquid_Rate',
  waterCut: 'Water_Cut',
  espFrequency: 'ESP_Frequency',
  planTarget: 'Plan_Target'
};
