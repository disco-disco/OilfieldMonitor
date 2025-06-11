import { NextResponse } from 'next/server';
import { piSystemService } from '@/services/pi-system';

export async function GET() {
  try {
    const wellPadData = await piSystemService.readWellPadData();
    
    return NextResponse.json({
      success: true,
      data: wellPadData,
      timestamp: new Date().toISOString(),
      totalWells: wellPadData.reduce((sum, pad) => sum + pad.wellCount, 0),
      totalProduction: wellPadData.reduce((sum, pad) => sum + pad.totalProduction, 0)
    });
  } catch (error) {
    console.error('Error reading wellpad data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to read wellpad data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
