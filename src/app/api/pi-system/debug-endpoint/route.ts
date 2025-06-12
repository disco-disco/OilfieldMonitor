import { NextRequest, NextResponse } from 'next/server';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Debug endpoint test: ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PLINQO-Debug/1.0'
        }
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData = null;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        // Response is not JSON, that's okay
      }

      const result = {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        message: response.ok 
          ? `Successfully connected (${response.status})` 
          : response.status === 401 
            ? 'Authentication required (server is reachable)'
            : `HTTP ${response.status}: ${response.statusText}`,
        details: {
          url,
          headers: Object.fromEntries(response.headers.entries()),
          bodyLength: responseText.length,
          isJson: responseData !== null,
          responsePreview: responseText.substring(0, 500)
        }
      };

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers: ${JSON.stringify(result.details.headers)}`);

      const successResponse = NextResponse.json(result);
      
      // Add CORS headers to allow cross-origin requests
      successResponse.headers.set('Access-Control-Allow-Origin', '*');
      successResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      successResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return successResponse;

    } catch (fetchError: unknown) {
      const error = fetchError as Error;
      
      console.log(`   ❌ Fetch error: ${error.message}`);
      
      let troubleshootingTip = '';
      if (error.name === 'AbortError') {
        troubleshootingTip = 'Request timed out - check network connectivity';
      } else if (error.message.includes('ENOTFOUND')) {
        troubleshootingTip = 'DNS resolution failed - check server name';
      } else if (error.message.includes('ECONNREFUSED')) {
        troubleshootingTip = 'Connection refused - PI Web API service may not be running';
      } else if (error.message.includes('certificate')) {
        troubleshootingTip = 'SSL certificate issue - try HTTP endpoints or fix certificates';
      } else if (error.message.includes('CORS')) {
        troubleshootingTip = 'CORS policy blocking request';
      }

      const errorResponse = NextResponse.json({
        success: false,
        message: `Connection failed: ${error.message}`,
        details: {
          url,
          errorName: error.name,
          errorMessage: error.message,
          troubleshootingTip,
          corsNote: error.message.includes('fetch') ? 
            'This may be a CORS issue. Try the direct browser test or configure PI Web API CORS settings.' : undefined
        }
      });

      // Add CORS headers to allow cross-origin requests
      errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return errorResponse;
    }

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
