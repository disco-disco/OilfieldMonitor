import { NextResponse } from 'next/server';
import { piSystemService } from '@/services/pi-system';

export async function GET() {
  try {
    const testResult = await piSystemService.testConnection();
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('PI connection test error:', error);
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
