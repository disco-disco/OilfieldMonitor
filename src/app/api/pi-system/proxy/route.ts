import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, method = 'GET', headers: customHeaders = {}, body } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`🔗 PI Web API Proxy: ${method} ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      // Prepare headers for PI Web API
      const headers = {
        'Accept': 'application/json',
        'User-Agent': 'PLINQO-OilField-Monitor/1.0',
        'Cache-Control': 'no-cache',
        ...customHeaders
      };

      // Make the request to PI Web API
      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        // Note: In Node.js, we can't easily disable SSL verification
        // If you have SSL issues, configure certificates properly
      });

      clearTimeout(timeoutId);

      // Read the response
      const responseText = await response.text();
      let responseData = null;
      
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        // Response is not JSON, that's okay for some endpoints
        console.log(`   ℹ️  Non-JSON response from PI Web API (${responseText.length} bytes)`);
      }

      // Create a comprehensive result
      const result = {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        message: response.ok 
          ? `Successfully connected to PI Web API (${response.status})` 
          : response.status === 401 
            ? 'Authentication required - but PI Web API is reachable!'
            : response.status === 404
              ? 'PI Web API endpoint not found - check URL path'
              : `PI Web API returned HTTP ${response.status}: ${response.statusText}`,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        details: {
          url,
          method,
          requestHeaders: headers,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          bodyLength: responseText.length,
          isJson: responseData !== null,
          responsePreview: responseText.substring(0, 500),
          timestamp: new Date().toISOString()
        }
      };

      // Log the result
      if (response.ok) {
        console.log(`   ✅ PI Web API Success: ${response.status} ${response.statusText}`);
        if (responseData && responseData.Items) {
          console.log(`   📊 Response contains ${responseData.Items.length} items`);
        }
      } else if (response.status === 401) {
        console.log(`   🔐 PI Web API Auth Required: ${response.status} (server is reachable)`);
      } else {
        console.log(`   ⚠️  PI Web API Response: ${response.status} ${response.statusText}`);
      }

      // Return with CORS headers for browser
      return new NextResponse(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });

    } catch (fetchError: unknown) {
      const error = fetchError as Error;
      
      console.log(`   ❌ PI Web API Fetch Error: ${error.message}`);
      
      let troubleshootingTip = '';
      let errorCategory = 'network';
      
      if (error.name === 'AbortError') {
        troubleshootingTip = 'Request timed out - check network connectivity to PI Web API server';
        errorCategory = 'timeout';
      } else if (error.message.includes('ENOTFOUND')) {
        troubleshootingTip = 'DNS resolution failed - check PI Web API server name';
        errorCategory = 'dns';
      } else if (error.message.includes('ECONNREFUSED')) {
        troubleshootingTip = 'Connection refused - PI Web API service may not be running';
        errorCategory = 'connection';
      } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
        troubleshootingTip = 'SSL certificate issue - check PI Web API SSL configuration';
        errorCategory = 'ssl';
      } else if (error.message.includes('CORS')) {
        troubleshootingTip = 'CORS policy blocking request - configure PI Web API CORS headers';
        errorCategory = 'cors';
      }

      return NextResponse.json({
        success: false,
        statusCode: 0,
        message: `Failed to connect to PI Web API: ${error.message}`,
        errorCategory,
        troubleshootingTip,
        details: {
          url,
          errorName: error.name,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('❌ PI Web API Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Internal proxy error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

// Handle preflight OPTIONS requests for CORS
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
