import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager } from '@/services/config-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking current configuration for template filtering...');
    
    // Load configuration
    const configManager = new ConfigManager();
    const result = configManager.loadConfig();
    
    console.log('📋 Configuration result:', result);
    
    if (!result.success) {
      console.log('❌ Configuration load failed:', result.error);
      return NextResponse.json({
        success: false,
        error: 'Configuration load failed: ' + result.error,
        hasConfig: false
      });
    }

    if (!result.config) {
      console.log('❌ No configuration found');
      return NextResponse.json({
        success: false,
        error: 'No configuration found',
        hasConfig: false
      });
    }

    console.log('✅ Configuration loaded successfully');
    console.log('   - Mode:', result.config.mode);
    console.log('   - Is PI Configured:', result.config.isPIConfigured);
    
    if (result.config.piServerConfig) {
      console.log('   - AF Server:', result.config.piServerConfig.afServerName);
      console.log('   - PI Web API Server:', result.config.piServerConfig.piWebApiServerName);
      console.log('   - Database:', result.config.piServerConfig.afDatabaseName);
      console.log('   - Element Path:', result.config.piServerConfig.elementPath);
      console.log('   - Template Name:', result.config.piServerConfig.templateName || 'Not set');
    } else {
      console.log('   - No PI Server Config found');
    }

    return NextResponse.json({
      success: true,
      hasConfig: true,
      mode: result.config.mode,
      isPIConfigured: result.config.isPIConfigured,
      piServerConfig: result.config.piServerConfig ? {
        afServerName: result.config.piServerConfig.afServerName,
        piWebApiServerName: result.config.piServerConfig.piWebApiServerName,
        afDatabaseName: result.config.piServerConfig.afDatabaseName,
        elementPath: result.config.piServerConfig.elementPath,
        templateName: result.config.piServerConfig.templateName || null
      } : null
    });

  } catch (error) {
    console.error('❌ Configuration check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      hasConfig: false
    });
  }
}
