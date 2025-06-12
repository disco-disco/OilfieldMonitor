import { NextRequest, NextResponse } from 'next/server';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}

// Handle all HTTP methods through proxy
export async function GET(request: NextRequest) {
  return handleProxyRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleProxyRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleProxyRequest(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return handleProxyRequest(request, 'DELETE');
}

async function handleProxyRequest(request: NextRequest, method: string) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Missing target URL parameter' },
        { 
          status: 400,
          headers: getCorsHeaders()
        }
      );
    }

    console.log(`🔄 CORS Proxy: ${method} ${targetUrl}`);

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PLINQO-OilField-Monitor/1.0',
        'Content-Type': 'application/json',
      },
    };

    // Add body for POST/PUT requests
    if ((method === 'POST' || method === 'PUT') && request.body) {
      requestOptions.body = request.body;
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    requestOptions.signal = controller.signal;

    try {
      const response = await fetch(targetUrl, requestOptions);
      clearTimeout(timeoutId);

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { rawResponse: responseText };
      }

      const proxyResponse = NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        url: targetUrl
      }, {
        status: response.status,
        headers: getCorsHeaders()
      });

      console.log(`✅ CORS Proxy Success: ${response.status} ${response.statusText}`);
      return proxyResponse;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      const error = fetchError as Error;
      
      console.log(`❌ CORS Proxy Error: ${error.message}`);
      
      return NextResponse.json({
        success: false,
        error: error.message,
        errorType: error.name,
        url: targetUrl
      }, {
        status: 500,
        headers: getCorsHeaders()
      });
    }

  } catch (error) {
    console.error('CORS Proxy internal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal proxy error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: getCorsHeaders()
      }
    );
  }
}

function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
}
