import { NextRequest, NextResponse } from 'next/server';
import { configManager } from '@/services/config-manager';
import { WellPadData, WellData, AttributeMapping, DEFAULT_ATTRIBUTE_MAPPING } from '@/types/pi-system';

// Generate simulated data that respects custom attribute mappings
function generateSimulatedDataWithAttributeMapping(attributeMapping: AttributeMapping): WellPadData[] {
  console.log('🎯 Generating simulated data with custom attribute mapping:', attributeMapping);

  // Generate sample wells with realistic data
  const generateWell = (name: string, padId: string): WellData => {
    const baseProduction = 100 + Math.random() * 200; // 100-300 bbl/day
    const waterCut = 0.2 + Math.random() * 0.4; // 20-60% water cut
    const gasRate = baseProduction * (2 + Math.random() * 3); // Gas-to-oil ratio
    
    return {
      id: `${padId}-${name}`,
      name: name,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      attributes: {
        // Use custom attribute mapping names instead of defaults
        [attributeMapping.oilRate || 'Oil_Rate']: Math.round(baseProduction * (1 - waterCut)),
        [attributeMapping.liquidRate || 'Liquid_Rate']: Math.round(baseProduction),
        [attributeMapping.waterCut || 'Water_Cut']: Math.round(waterCut * 100), // Convert to percentage
        [attributeMapping.gasRate || 'Gas_Rate']: Math.round(gasRate),
        [attributeMapping.tubingPressure || 'Tubing_Pressure']: Math.round(50 + Math.random() * 200),
        [attributeMapping.casingPressure || 'Casing_Pressure']: Math.round(100 + Math.random() * 300),
        [attributeMapping.chokeSize || 'Choke_Size']: Math.round(8 + Math.random() * 56),
        [attributeMapping.pumpSpeed || 'Pump_Speed']: Math.round(20 + Math.random() * 80)
      },
      lastUpdated: new Date().toISOString()
    };
  };

  // Create multiple wellpads with wells
  const wellPads: WellPadData[] = [
    {
      id: 'wellpad-1',
      name: 'North Ridge Pad',
      location: 'North Ridge Field',
      wells: [
        generateWell('NR-001', 'wellpad-1'),
        generateWell('NR-002', 'wellpad-1'),
        generateWell('NR-003', 'wellpad-1'),
        generateWell('NR-004', 'wellpad-1')
      ],
      totalOilRate: 0,
      totalGasRate: 0,
      totalWaterRate: 0,
      averagePressure: 0,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'wellpad-2', 
      name: 'Eagle Creek Pad',
      location: 'Eagle Creek Field',
      wells: [
        generateWell('EC-001', 'wellpad-2'),
        generateWell('EC-002', 'wellpad-2'),
        generateWell('EC-003', 'wellpad-2')
      ],
      totalOilRate: 0,
      totalGasRate: 0, 
      totalWaterRate: 0,
      averagePressure: 0,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'wellpad-3',
      name: 'Sunset Valley Pad', 
      location: 'Sunset Valley Field',
      wells: [
        generateWell('SV-001', 'wellpad-3'),
        generateWell('SV-002', 'wellpad-3'),
        generateWell('SV-003', 'wellpad-3'),
        generateWell('SV-004', 'wellpad-3'),
        generateWell('SV-005', 'wellpad-3')
      ],
      totalOilRate: 0,
      totalGasRate: 0,
      totalWaterRate: 0, 
      averagePressure: 0,
      lastUpdated: new Date().toISOString()
    }
  ];

  // Calculate wellpad totals using the correct attribute names
  wellPads.forEach(pad => {
    const activeWells = pad.wells.filter(well => well.status === 'active');
    
    pad.totalOilRate = activeWells.reduce((sum, well) => 
      sum + (well.attributes[attributeMapping.oilRate || 'Oil_Rate'] || 0), 0);
    pad.totalGasRate = activeWells.reduce((sum, well) => 
      sum + (well.attributes[attributeMapping.gasRate || 'Gas_Rate'] || 0), 0);
    pad.totalWaterRate = activeWells.reduce((sum, well) => 
      sum + (well.attributes[attributeMapping.liquidRate || 'Liquid_Rate'] - well.attributes[attributeMapping.oilRate || 'Oil_Rate'] || 0), 0);
    pad.averagePressure = activeWells.length > 0 ? 
      activeWells.reduce((sum, well) => 
        sum + (well.attributes[attributeMapping.tubingPressure || 'Tubing_Pressure'] || 0), 0) / activeWells.length : 0;
  });

  console.log('✅ Generated simulated data with custom attribute names:', {
    wellPadCount: wellPads.length,
    totalWells: wellPads.reduce((sum, pad) => sum + pad.wells.length, 0),
    sampleAttributes: wellPads[0]?.wells[0]?.attributes
  });

  return wellPads;
}

// Default simulated data generator (fallback)
function generateDefaultSimulatedData(): WellPadData[] {
  console.log('📊 Generating default simulated data...');
  
  return generateSimulatedDataWithAttributeMapping(DEFAULT_ATTRIBUTE_MAPPING);
}

export async function GET() {
  try {
    console.log('🔧 API: Generating simulated data with attribute mapping...');
    
    // Get configuration (including attribute mapping)
    const config = configManager.getConfig();
    
    if (config && config.attributeMapping) {
      console.log('🎯 Using custom attribute mapping for simulated data:', config.attributeMapping);
      const data = generateSimulatedDataWithAttributeMapping(config.attributeMapping);
      
      return NextResponse.json({
        success: true,
        data: data,
        source: 'simulated-with-mapping',
        attributeMapping: config.attributeMapping,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ No attribute mapping found, using default simulated data');
      const data = generateDefaultSimulatedData();
      
      return NextResponse.json({
        success: true,
        data: data,
        source: 'simulated-default',
        attributeMapping: DEFAULT_ATTRIBUTE_MAPPING,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ API Error generating simulated data:', errorMessage);
    
    // Fallback to default data even if there's an error
    const data = generateDefaultSimulatedData();
    
    return NextResponse.json({
      success: true,
      data: data,
      source: 'simulated-fallback',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}
