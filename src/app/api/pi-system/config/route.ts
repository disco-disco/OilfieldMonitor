import { NextRequest, NextResponse } from 'next/server';
import { ConfigManager } from '@/services/config-manager';
import { PIServerConfig, AttributeMapping } from '@/types/pi-system';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, attributeMapping, mode }: { 
      config: PIServerConfig; 
      attributeMapping?: AttributeMapping;
      mode?: 'development' | 'production';
    } = body;

    // Validate required fields
    if (!config.afServerName || !config.piWebApiServerName || !config.afDatabaseName || !config.parentElementPath) {
      return NextResponse.json(
        { success: false, message: 'Missing required configuration fields (AF Server, PI Web API Server, Database, Element Path)' },
        { status: 400 }
      );
    }

    // Create ConfigManager instance
    const configManager = new ConfigManager();
    
    // Update configuration
    if (mode) {
      configManager.setMode(mode);
    }
    configManager.setPIServerConfig(config);
    if (attributeMapping) {
      configManager.setAttributeMapping(attributeMapping);
    }

    console.log('✅ PI configuration saved successfully');
    console.log('   Mode:', configManager.getMode());
    console.log('   AF Server:', config.afServerName);
    console.log('   Web API Server:', config.piWebApiServerName);
    console.log('   Database:', config.afDatabaseName);
    
    return NextResponse.json({ 
      success: true, 
      message: 'PI System configured successfully',
      config: configManager.getConfig()
    });
  } catch (error) {
    console.error('PI configuration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const configManager = new ConfigManager();
    const config = configManager.getConfig();
    return NextResponse.json({ 
      success: true,
      config 
    });
  } catch (error) {
    console.error('Error getting PI configuration:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
