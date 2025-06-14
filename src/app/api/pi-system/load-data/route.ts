import { NextRequest, NextResponse } from 'next/server';
import { PIAFService } from '@/services/pi-af-service-enhanced';
import { configManager } from '@/services/config-manager';

export async function GET() {
  try {
    console.log('🔍 API: Loading PI AF data...');
    
    // Load configuration
    const config = configManager.getConfig();
    
    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'No PI configuration found'
      });
    }

    // Check if we should load real PI data
    if (config.mode === 'production' && config.piServerConfig?.piWebApiServerName) {
      
      // Validate required configuration
      if (!config.piServerConfig || !config.piServerConfig.afServerName || 
          !config.piServerConfig.piWebApiServerName || !config.piServerConfig.afDatabaseName ||
          !config.piServerConfig.parentElementPath) {
        
        console.log('❌ Incomplete PI configuration for real data loading');
        console.log('Missing fields:', {
          afServerName: !config.piServerConfig?.afServerName,
          piWebApiServerName: !config.piServerConfig?.piWebApiServerName,
          afDatabaseName: !config.piServerConfig?.afDatabaseName,
          parentElementPath: !config.piServerConfig?.parentElementPath
        });
        
        return NextResponse.json({
          success: false,
          error: 'Incomplete PI configuration',
          useSimulated: true
        });
      }

      try {
        // Create PI AF service instance with custom attribute mapping
        const piafService = new PIAFService(config.piServerConfig, config.attributeMapping);
        
        // Load wellpad data from PI AF
        const wellPads = await piafService.loadWellPadData();
        
        if (wellPads && wellPads.length > 0) {
          console.log(`🎉 Successfully loaded ${wellPads.length} wellpads from PI AF`);
          return NextResponse.json({
            success: true,
            data: wellPads,
            source: 'pi-af',
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('⚠️ No wellpad data found in PI AF');
          return NextResponse.json({
            success: false,
            error: 'No wellpad data found in PI AF',
            useSimulated: true
          });
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Error loading real PI AF data:', errorMessage);
        return NextResponse.json({
          success: false,
          error: errorMessage,
          useSimulated: true
        });
      }
    } else {
      console.log('ℹ️ Not loading PI data - development mode or no server configured');
      return NextResponse.json({
        success: false,
        error: 'Development mode or no PI server configured',
        useSimulated: true
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error loading PI data:', errorMessage);
    return NextResponse.json({
      success: false,
      error: errorMessage,
      useSimulated: true
    });
  }
}
