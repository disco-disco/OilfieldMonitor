// Simple debug API endpoint that won't hang

import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager } from '@/services/config-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔧 SIMPLE DEBUG API CALLED');
    
    // Get current configuration
    const configManager = new ConfigManager();
    const config = configManager.getConfig();
    
    console.log('📋 Current config mode:', config.mode);
    console.log('📋 PI configured:', !!config.piServerConfig);
    
    if (config.mode !== 'production' || !config.piServerConfig) {
      console.log('⚠️ Not in production mode or PI not configured - returning config info');
      return NextResponse.json({
        success: false,
        error: 'Not in production mode or PI not configured',
        config: {
          mode: config.mode,
          isPIConfigured: !!config.piServerConfig,
          piServerConfig: config.piServerConfig ? {
            afServerName: config.piServerConfig.afServerName,
            piWebApiServerName: config.piServerConfig.piWebApiServerName,
            afDatabaseName: config.piServerConfig.afDatabaseName,
            parentElementPath: config.piServerConfig.parentElementPath,
          } : null
        }
      });
    }
    
    console.log('🎯 PI Server Config Found:');
    console.log('   AF Server:', config.piServerConfig.afServerName);
    console.log('   Web API Server:', config.piServerConfig.piWebApiServerName);
    console.log('   Database:', config.piServerConfig.afDatabaseName);
    console.log('   Parent Path:', config.piServerConfig.parentElementPath || 'N/A');
    
    return NextResponse.json({
      success: true,
      message: 'PI System is configured in production mode',
      config: {
        mode: config.mode,
        afServerName: config.piServerConfig.afServerName,
        piWebApiServerName: config.piServerConfig.piWebApiServerName,
        afDatabaseName: config.piServerConfig.afDatabaseName,
        parentElementPath: config.piServerConfig.parentElementPath,
        attributeMapping: config.attributeMapping
      }
    });
    
  } catch (error) {
    console.error('❌ SIMPLE DEBUG API ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
