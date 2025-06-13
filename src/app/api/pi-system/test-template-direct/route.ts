import { NextRequest, NextResponse } from 'next/server';
import { PIAFService } from '@/services/pi-af-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing template filtering with hardcoded config...');
    
    // Use hardcoded configuration to test template filtering
    const testConfig = {
      piWebApiServerName: "MES-PIAF01CPF",
      afServerName: "MES-PIAF01CPF", 
      afDatabaseName: "Configuration",
      elementPath: "Element1\\Element2",
      templateName: "WellTemplate" // This is the key - template filtering
    };

    console.log('📋 Test Configuration:');
    console.log(`   - AF Server: ${testConfig.afServerName}`);
    console.log(`   - Database: ${testConfig.afDatabaseName}`);
    console.log(`   - Element Path: ${testConfig.elementPath}`);
    console.log(`   - Template Filter: ${testConfig.templateName}`);

    // Create PI AF service instance
    const piafService = new PIAFService(testConfig);
    
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
      templateFilter: testConfig.templateName,
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
