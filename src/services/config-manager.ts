import fs from 'fs';
import path from 'path';
import { PIServerConfig, AttributeMapping, DEFAULT_ATTRIBUTE_MAPPING } from '@/types/pi-system';

export interface AppConfig {
  mode: 'development' | 'production';
  piServerConfig?: PIServerConfig;
  attributeMapping: AttributeMapping;
  lastUpdated: string;
}

export class ConfigManager {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    // Store config in the project root
    this.configPath = path.join(process.cwd(), 'pi-config.json');
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  private loadConfig(): AppConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf8');
        const parsedConfig = JSON.parse(configData) as AppConfig;
        
        // Ensure all required fields exist
        return {
          mode: parsedConfig.mode || 'development',
          piServerConfig: parsedConfig.piServerConfig,
          // If pi-config.json has attributeMapping and it's not empty, use it exclusively. Otherwise, use DEFAULT_ATTRIBUTE_MAPPING.
          attributeMapping: (parsedConfig.attributeMapping && Object.keys(parsedConfig.attributeMapping).length > 0) 
                            ? parsedConfig.attributeMapping 
                            : DEFAULT_ATTRIBUTE_MAPPING,
          lastUpdated: parsedConfig.lastUpdated || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }

    // Return default config if file doesn't exist or has errors
    return {
      mode: 'development',
      attributeMapping: DEFAULT_ATTRIBUTE_MAPPING,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save configuration to file
   */
  private saveConfig(): void {
    try {
      this.config.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update application mode
   */
  setMode(mode: 'development' | 'production'): void {
    this.config.mode = mode;
    this.saveConfig();
  }

  /**
   * Get current mode
   */
  getMode(): 'development' | 'production' {
    return this.config.mode;
  }

  /**
   * Update PI Server configuration
   */
  setPIServerConfig(config: PIServerConfig): void {
    this.config.piServerConfig = config;
    this.saveConfig();
  }

  /**
   * Get PI Server configuration
   */
  getPIServerConfig(): PIServerConfig | undefined {
    return this.config.piServerConfig;
  }

  /**
   * Update attribute mapping
   */
  setAttributeMapping(mapping: AttributeMapping): void {
    this.config.attributeMapping = { ...DEFAULT_ATTRIBUTE_MAPPING, ...mapping };
    this.saveConfig();
  }

  /**
   * Get attribute mapping
   */
  getAttributeMapping(): AttributeMapping {
    return this.config.attributeMapping;
  }

  /**
   * Clear all configuration
   */
  clearConfig(): void {
    this.config = {
      mode: 'development',
      attributeMapping: DEFAULT_ATTRIBUTE_MAPPING,
      lastUpdated: new Date().toISOString()
    };
    this.saveConfig();
  }

  /**
   * Check if PI System is configured
   */
  isPIConfigured(): boolean {
    return !!(this.config.piServerConfig?.afServerName && 
              this.config.piServerConfig?.afDatabaseName && 
              this.config.piServerConfig?.parentElementPath);
  }
}

// Export singleton instance
export const configManager = new ConfigManager();