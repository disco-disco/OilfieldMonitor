// Simple debug API that doesn't import heavy services
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('\n🔧 SIMPLE DEBUG STATUS API CALLED');
    
    // Just check if configuration file exists
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'pi-config.json');
    
    let configExists = false;
    let configContent = null;
    
    try {
      configExists = fs.existsSync(configPath);
      if (configExists) {
        const configText = fs.readFileSync(configPath, 'utf8');
        configContent = JSON.parse(configText);
        console.log('📋 Config file found and parsed successfully');
        console.log('   Mode:', configContent.mode);
        console.log('   Has PI Server Config:', !!configContent.piServerConfig);
        if (configContent.piServerConfig) {
          console.log('   AF Server:', configContent.piServerConfig.afServerName);
          console.log('   Web API Server:', configContent.piServerConfig.piWebApiServerName);
          console.log('   Database:', configContent.piServerConfig.afDatabaseName);
          console.log('   Parent Path:', configContent.piServerConfig.parentElementPath);
        }
      } else {
        console.log('📋 No config file found at:', configPath);
      }
    } catch (error) {
      console.log('❌ Error reading config file:', error);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      config: {
        exists: configExists,
        path: configPath,
        content: configContent,
        mode: configContent?.mode || 'unknown',
        isPIConfigured: !!(configContent?.piServerConfig?.afServerName && 
                          configContent?.piServerConfig?.piWebApiServerName && 
                          configContent?.piServerConfig?.afDatabaseName)
      },
      message: configExists ? 'Configuration file found' : 'No configuration file exists',
      nextSteps: configExists && configContent?.mode === 'production' ? 
        'Configuration ready for PI AF testing' : 
        'Need to configure PI system in production mode'
    });
    
  } catch (error) {
    console.error('❌ SIMPLE DEBUG ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
