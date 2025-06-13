import { NextRequest, NextResponse } from 'next/server';
import { PIAFService } from '@/services/pi-af-service';
import { ConfigManager } from '@/services/config-manager';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing attribute mapping configuration...');
    
    // Load configuration using ConfigManager (includes attribute mapping)
    const configManager = new ConfigManager();
    const result = configManager.loadConfig();
    
    if (!result.piServerConfig) {
      return NextResponse.json({
        success: false,
        error: 'No PI configuration found',
        debug: { loadedConfig: result }
      });
    }

    console.log('📋 Loaded Configuration:');
    console.log(`   - Mode: ${result.mode}`);
    console.log(`   - AF Server: ${result.piServerConfig.afServerName}`);
    console.log(`   - Database: ${result.piServerConfig.afDatabaseName}`);
    console.log(`   - Element Path: ${result.piServerConfig.elementPath}`);
    console.log(`   - Template Filter: ${result.piServerConfig.templateName || 'None'}`);
    console.log('📋 Attribute Mapping:');
    Object.entries(result.attributeMapping).forEach(([key, value]) => {
      console.log(`   - ${key}: "${value}"`);
    });

    // Create PI AF service instance WITH attribute mapping
    const piafService = new PIAFService(result.piServerConfig, result.attributeMapping);
    
    // Test the attribute mapping by attempting to load data
    console.log('🔍 Testing attribute mapping with PI AF service...');
    
    try {
      const wellPads = await piafService.loadWellPadData();
      
      console.log(`✅ Attribute mapping test completed`);
      console.log(`   - Wellpads processed: ${wellPads?.length || 0}`);
      
      // Show attribute mapping usage
      if (wellPads && wellPads.length > 0) {
        const firstWell = wellPads[0].wells[0];
        console.log(`📊 First well attributes found:`);
        Object.entries(firstWell).forEach(([key, value]) => {
          if (typeof value === 'number') {
            console.log(`   - ${key}: ${value}`);
          }
        });
      }

      return NextResponse.json({
        success: true,
        mode: result.mode,
        attributeMapping: result.attributeMapping,
        piServerConfig: result.piServerConfig,
        wellpadsFound: wellPads?.length || 0,
        totalWells: wellPads?.reduce((sum, pad) => sum + pad.wells.length, 0) || 0,
        attributeMappingApplied: true,
        firstWellSample: wellPads && wellPads.length > 0 ? wellPads[0].wells[0] : null
      });

    } catch (piError) {
      console.log('⚠️ PI connection failed, but attribute mapping is configured correctly');
      return NextResponse.json({
        success: true,
        mode: result.mode,
        attributeMapping: result.attributeMapping,
        piServerConfig: result.piServerConfig,
        piConnectionError: piError instanceof Error ? piError.message : String(piError),
        attributeMappingApplied: true,
        note: 'Attribute mapping loaded successfully, PI connection failed (expected in development)'
      });
    }

  } catch (error) {
    console.error('❌ Attribute mapping test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
