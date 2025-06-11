import { NextRequest, NextResponse } from 'next/server';
import { piSystemService } from '@/services/pi-system';
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
    if (!config.afServerName || !config.afDatabaseName || !config.parentElementPath) {
      return NextResponse.json(
        { success: false, message: 'Missing required configuration fields' },
        { status: 400 }
      );
    }

    // Set mode if provided
    if (mode) {
      piSystemService.setMode(mode);
    }

    const success = await piSystemService.configure(config, attributeMapping);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'PI System configured successfully',
        config: piSystemService.getConfiguration()
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to configure PI System' },
        { status: 500 }
      );
    }
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
    const config = piSystemService.getConfiguration();
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
