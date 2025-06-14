import { NextRequest, NextResponse } from 'next/server';
import { WindowsAuthService } from '@/services/windows-auth-service';
import { configManager } from '@/services/config-manager';

export async function GET() {
  try {
    console.log('🔐 API: Testing Windows Authentication...');
    
    // Load configuration
    const config = configManager.getConfig();
    
    if (!config?.piServerConfig?.piWebApiServerName) {
      return NextResponse.json({
        success: false,
        error: 'No PI Web API server configured',
        details: 'Please configure the PI Web API server name in settings'
      });
    }

    // Test different endpoint formats
    const testEndpoints = [
      `https://${config.piServerConfig.piWebApiServerName}/piwebapi`,
      `https://${config.piServerConfig.piWebApiServerName}:443/piwebapi`,
      `http://${config.piServerConfig.piWebApiServerName}/piwebapi`,
      `https://${config.piServerConfig.piWebApiServerName}/PIWebAPI`,
      `http://${config.piServerConfig.piWebApiServerName}/PIWebAPI`,
      `https://${config.piServerConfig.piWebApiServerName}:5985/piwebapi`,
      `http://${config.piServerConfig.piWebApiServerName}:5985/piwebapi`
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`🧪 Testing endpoint: ${endpoint}`);
        
        const authService = new WindowsAuthService({
          serverUrl: endpoint,
          timeout: 10000,
          debug: true
        });

        const connectionTest = await authService.testConnection();
        
        results.push({
          endpoint,
          success: connectionTest.success,
          status: connectionTest.status,
          message: connectionTest.message,
          isWorkingEndpoint: connectionTest.success || connectionTest.status === 401 || connectionTest.status === 403
        });

        console.log(`   Result: ${connectionTest.status} - ${connectionTest.message}`);

      } catch (error: any) {
        results.push({
          endpoint,
          success: false,
          status: 0,
          message: error.message,
          isWorkingEndpoint: false
        });
        console.log(`   Error: ${error.message}`);
      }
    }

    // Find working endpoints
    const workingEndpoints = results.filter(r => r.isWorkingEndpoint);
    const authRequiredEndpoints = results.filter(r => r.status === 401);

    // Platform information
    const platformInfo = {
      platform: process.platform,
      supportsWindowsAuth: WindowsAuthService.isWindowsAuthSupported(),
      deploymentInstructions: WindowsAuthService.getDeploymentInstructions()
    };

    return NextResponse.json({
      success: workingEndpoints.length > 0,
      summary: {
        totalEndpointsTested: testEndpoints.length,
        workingEndpoints: workingEndpoints.length,
        authRequiredEndpoints: authRequiredEndpoints.length,
        bestEndpoint: workingEndpoints[0]?.endpoint || null
      },
      platformInfo,
      results,
      recommendations: getRecommendations(results, platformInfo)
    });

  } catch (error: any) {
    console.error('❌ Windows Authentication test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Windows Authentication test failed',
      details: error.message,
      stack: error.stack
    });
  }
}

function getRecommendations(results: any[], platformInfo: any): string[] {
  const recommendations = [];
  
  const workingEndpoints = results.filter(r => r.isWorkingEndpoint);
  const authRequiredEndpoints = results.filter(r => r.status === 401);
  
  if (workingEndpoints.length === 0) {
    recommendations.push('❌ No PI Web API endpoints are reachable');
    recommendations.push('🔍 Verify PI Web API server name and network connectivity');
    recommendations.push('✅ Check if PI Web API service is running on the server');
  } else {
    recommendations.push(`✅ Found ${workingEndpoints.length} working PI Web API endpoint(s)`);
    
    if (authRequiredEndpoints.length > 0) {
      recommendations.push(`🔐 ${authRequiredEndpoints.length} endpoint(s) require Windows Authentication`);
      
      if (platformInfo.supportsWindowsAuth) {
        recommendations.push('✅ Current platform supports Windows Authentication');
        recommendations.push('👤 Ensure you are logged in with a domain account');
        recommendations.push('🏢 Verify your account has access to PI AF databases');
      } else {
        recommendations.push('🚫 Current platform does not support Windows Authentication');
        recommendations.push('💻 Deploy the application to a Windows machine joined to your corporate domain');
        recommendations.push('🔄 Copy the application to Windows and run it there');
      }
    }
  }
  
  return recommendations;
}
