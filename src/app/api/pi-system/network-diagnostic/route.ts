import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const server = searchParams.get('server') || 'MES-PIV0801IQ';
    
    console.log(`🔍 Network diagnostic for server: ${server}`);

    const results = {
      server,
      networkTests: [],
      recommendations: []
    };

    // Test 1: Basic DNS resolution (try a simple HTTP request)
    console.log(`🧪 Testing basic connectivity to ${server}...`);
    
    const basicTests = [
      `http://${server}`,
      `https://${server}`,
      `http://${server}:80`,
      `https://${server}:443`,
      `http://${server}:5985`,
      `https://${server}:5985`
    ];

    for (const testUrl of basicTests) {
      try {
        console.log(`🔍 Testing: ${testUrl}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch(testUrl, {
          method: 'HEAD', // Use HEAD to minimize data transfer
          signal: controller.signal,
          headers: {
            'User-Agent': 'PI-System-Diagnostic/1.0'
          }
        });
        
        clearTimeout(timeoutId);
        
        results.networkTests.push({
          url: testUrl,
          status: response.status,
          statusText: response.statusText,
          success: true,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        console.log(`✅ ${testUrl} - ${response.status} ${response.statusText}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.networkTests.push({
          url: testUrl,
          error: errorMessage,
          success: false
        });
        
        console.log(`❌ ${testUrl} - ${errorMessage}`);
      }
    }

    // Generate recommendations based on results
    const successfulTests = results.networkTests.filter(test => test.success);
    const failedTests = results.networkTests.filter(test => !test.success);

    if (successfulTests.length === 0) {
      results.recommendations.push(
        "❌ No successful network connections - Check if server name is correct",
        "❌ Verify network connectivity from this machine to the PI server",
        "❌ Check if there are firewall rules blocking the connection",
        "💡 Try accessing the server from a browser to verify it's reachable"
      );
    } else {
      results.recommendations.push(
        `✅ Server is reachable on ${successfulTests.length} endpoint(s)`,
        "💡 Try adding PI Web API paths to the successful endpoints:",
        ...successfulTests.map(test => `   ${test.url}/piwebapi`)
      );
    }

    // Check specific error patterns
    const dnsErrors = failedTests.filter(test => 
      test.error?.includes('getaddrinfo ENOTFOUND') || 
      test.error?.includes('ENOTFOUND')
    );
    
    const timeoutErrors = failedTests.filter(test =>
      test.error?.includes('timeout') ||
      test.error?.includes('ETIMEDOUT')
    );

    const connectionErrors = failedTests.filter(test =>
      test.error?.includes('ECONNREFUSED') ||
      test.error?.includes('fetch failed')
    );

    if (dnsErrors.length > 0) {
      results.recommendations.push("🔍 DNS Resolution Issue: Server name cannot be resolved");
    }

    if (timeoutErrors.length > 0) {
      results.recommendations.push("⏱️ Timeout Issue: Server is not responding (may be down or firewalled)");
    }

    if (connectionErrors.length > 0) {
      results.recommendations.push("🚫 Connection Refused: Server is rejecting connections");
    }

    return NextResponse.json({
      success: true,
      ...results,
      summary: {
        totalTests: results.networkTests.length,
        successful: successfulTests.length,
        failed: failedTests.length,
        serverReachable: successfulTests.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Network diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
