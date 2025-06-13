import { NextRequest, NextResponse } from 'next/server';
import { PIAFService } from '@/services/pi-af-service';
import { ConfigManager } from '@/services/config-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing template filtering functionality...');
    
    // Load configuration
    const configManager = new ConfigManager();
    const result = configManager.loadConfig();
    
    if (!result.success || !result.config?.piServerConfig) {
      return NextResponse.json({
        success: false,
        error: 'No PI configuration found'
      });
    }

    console.log('📋 Current PI Configuration:');
    console.log(`   - AF Server: ${result.config.piServerConfig.afServerName}`);
    console.log(`   - Database: ${result.config.piServerConfig.afDatabaseName}`);
    console.log(`   - Element Path: ${result.config.piServerConfig.elementPath}`);
    console.log(`   - Template Filter: ${result.config.piServerConfig.templateName || 'None'}`);

    // Create PI AF service instance
    const piafService = new PIAFService(result.config.piServerConfig);
    
    // Test the template filtering by loading a small amount of data
    console.log('🔍 Testing template filtering with PI AF service...');
    const wellPads = await piafService.loadWellPadData();
    
    console.log(`✅ Template filtering test completed`);
    console.log(`   - Wellpads processed: ${wellPads?.length || 0}`);
    
    if (wellPads && wellPads.length > 0) {
      wellPads.forEach((pad, index) => {
        console.log(`   - ${index + 1}. ${pad.name}: ${pad.wells.length} wells`);
        pad.wells.forEach((well, wellIndex) => {
          console.log(`      ${wellIndex + 1}. ${well.name}`);
        });
      });
    }

    return NextResponse.json({
      success: true,
      templateFilter: result.config.piServerConfig.templateName || 'None',
      wellpadsFound: wellPads?.length || 0,
      totalWells: wellPads?.reduce((sum, pad) => sum + pad.wells.length, 0) || 0,
      wellpads: wellPads?.map(pad => ({
        name: pad.name,
        wellCount: pad.wells.length,
        wells: pad.wells.map(well => well.name)
      }))
    });

  } catch (error) {
    console.error('❌ Template filtering test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
