import { NextResponse } from 'next/server';
import { piSystemService } from '@/services/pi-system';

export async function GET() {
  try {
    const result = await piSystemService.testConnection();
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
      mode: piSystemService.getMode(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
