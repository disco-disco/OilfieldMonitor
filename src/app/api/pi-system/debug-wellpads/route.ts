// Debug API endpoint to show PI AF service URL generation in server console

import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager } from '@/services/config-manager';
import { PIAFService } from '@/services/pi-af-service';

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔧 DEBUG WELLPADS API CALLED');
    
    // Get current configuration
    const configManager = new ConfigManager();
    const config = await configManager.getConfig();
    
    console.log('📋 Current config mode:', config.mode);
    console.log('📋 PI configured:', !!config.piServerConfig);
    
    if (config.mode !== 'production' || !config.piServerConfig) {
      return NextResponse.json({
        success: false,
        error: 'Not in production mode or PI not configured',
        config: {
          mode: config.mode,
          isPIConfigured: !!config.piServerConfig
        }
      });
    }
    
    console.log('🎯 PI Server Config:');
    console.log('   AF Server:', config.piServerConfig.afServerName);
    console.log('   Web API Server:', config.piServerConfig.piWebApiServerName);
    console.log('   Database:', config.piServerConfig.afDatabaseName);
    console.log('   Parent Path:', config.piServerConfig.parentElementPath || 'N/A');
    
    // Create PI AF service and try to load data
    console.log('\n🚀 Creating PI AF Service...');
    const piafService = new PIAFService(config.piServerConfig, config.attributeMapping);
    
    console.log('🔍 Attempting to load wellpad data...');
    const wellpads = await piafService.loadWellPadData();
    
    console.log('\n📊 FINAL RESULT:');
    if (wellpads && wellpads.length > 0) {
      console.log(`✅ Success: Loaded ${wellpads.length} wellpads`);
      return NextResponse.json({
        success: true,
        wellpadCount: wellpads.length,
        wellpads: wellpads.map(wp => ({
          name: wp.name,
          wellCount: wp.wells.length,
          wells: wp.wells.map(w => w.name)
        }))
      });
    } else {
      console.log('❌ Failed: No wellpad data returned');
      return NextResponse.json({
        success: false,
        error: 'No wellpad data found',
        wellpadCount: 0
      });
    }
    
  } catch (error) {
    console.error('❌ DEBUG API ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
