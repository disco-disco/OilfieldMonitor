#!/usr/bin/env node

/**
 * Standalone PI System Connection Debugger
 * 
 * This script helps debug PI Web API connection issues step by step
 * Run with: node debug-pi-connection.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration - Update these with your actual server details
const CONFIG = {
  piWebApiServerName: 'SRV-PIV0101',  // Your PI Vision server
  afServerName: 'your-af-server',      // Your PI AF server name
  afDatabaseName: 'your-database',     // Your PI AF database name
  parentElementPath: 'YourWellPads'    // Your element path
};

console.log('🔍 PI System Connection Debugger');
console.log('================================');
console.log(`Configuration:`);
console.log(`  PI Web API Server: ${CONFIG.piWebApiServerName}`);
console.log(`  PI AF Server: ${CONFIG.afServerName}`);
console.log(`  Database: ${CONFIG.afDatabaseName}`);
console.log(`  Element Path: ${CONFIG.parentElementPath}`);
console.log('');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PLINQO-Debug/1.0',
        ...options.headers
      },
      // Allow self-signed certificates for testing
      rejectUnauthorized: false
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        code: error.code,
        url: url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        code: 'TIMEOUT',
        url: url
      });
    });

    req.end();
  });
}

async function testEndpoint(description, url) {
  console.log(`\n📡 Testing: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const result = await makeRequest(url);
    
    console.log(`   ✅ Status: ${result.statusCode}`);
    console.log(`   📊 Content-Type: ${result.headers['content-type'] || 'Not specified'}`);
    console.log(`   📏 Content-Length: ${result.data.length} bytes`);
    
    if (result.statusCode === 200) {
      try {
        const json = JSON.parse(result.data);
        console.log(`   📋 JSON Response: Valid (${Object.keys(json).length} properties)`);
        if (json.Items) {
          console.log(`   📝 Items Count: ${json.Items.length}`);
        }
        return { success: true, data: json, status: result.statusCode };
      } catch (parseError) {
        console.log(`   ⚠️  JSON Parse Error: ${parseError.message}`);
        console.log(`   📄 Raw Response: ${result.data.substring(0, 200)}...`);
        return { success: false, error: 'Invalid JSON', status: result.statusCode };
      }
    } else if (result.statusCode === 401) {
      console.log(`   🔐 Authentication Required`);
      return { success: true, requiresAuth: true, status: result.statusCode };
    } else if (result.statusCode === 404) {
      console.log(`   ❌ Not Found`);
      return { success: false, error: 'Not Found', status: result.statusCode };
    } else {
      console.log(`   ❌ Unexpected Status`);
      console.log(`   📄 Response: ${result.data.substring(0, 200)}`);
      return { success: false, error: `HTTP ${result.statusCode}`, status: result.statusCode };
    }
    
  } catch (error) {
    console.log(`   ❌ Connection Failed`);
    console.log(`   🚫 Error: ${error.error}`);
    console.log(`   🔧 Code: ${error.code}`);
    
    // Provide specific troubleshooting advice
    if (error.code === 'ENOTFOUND') {
      console.log(`   💡 Tip: DNS resolution failed. Check server name spelling.`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`   💡 Tip: Connection refused. Check if PI Web API service is running.`);
    } else if (error.code === 'TIMEOUT') {
      console.log(`   💡 Tip: Request timed out. Check network connectivity.`);
    } else if (error.code === 'CERT_HAS_EXPIRED') {
      console.log(`   💡 Tip: SSL certificate expired. Contact your PI administrator.`);
    }
    
    return { success: false, error: error.error, code: error.code };
  }
}

async function runDiagnostics() {
  console.log('\n🔍 Starting PI Web API Diagnostics...\n');
  
  // Test different endpoint variations
  const endpoints = [
    { desc: 'HTTPS Default Port', url: `https://${CONFIG.piWebApiServerName}/piwebapi` },
    { desc: 'HTTPS Port 443', url: `https://${CONFIG.piWebApiServerName}:443/piwebapi` },
    { desc: 'HTTP Default Port', url: `http://${CONFIG.piWebApiServerName}/piwebapi` },
    { desc: 'HTTP Port 5985', url: `http://${CONFIG.piWebApiServerName}:5985/piwebapi` },
    { desc: 'HTTP Port 80', url: `http://${CONFIG.piWebApiServerName}:80/piwebapi` }
  ];
  
  let workingEndpoint = null;
  
  // Test basic connectivity
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.desc, endpoint.url);
    if (result.success || result.requiresAuth) {
      workingEndpoint = endpoint.url;
      break;
    }
  }
  
  if (!workingEndpoint) {
    console.log('\n❌ No working PI Web API endpoint found!');
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Verify PI Web API service is running on the server');
    console.log('2. Check Windows firewall settings');
    console.log('3. Verify the server name is correct');
    console.log('4. Check network connectivity from this machine');
    return;
  }
  
  console.log(`\n✅ Found working endpoint: ${workingEndpoint}`);
  
  // Test asset servers
  await testEndpoint('Asset Servers', `${workingEndpoint}/assetservers`);
  
  // Test system info
  await testEndpoint('System Info', `${workingEndpoint}/system`);
  
  // Test home page
  await testEndpoint('Home Page', `${workingEndpoint}/`);
  
  console.log('\n📋 Diagnostic Summary:');
  console.log('========================');
  console.log('If you see authentication errors (401), that\'s actually good!');
  console.log('It means the server is reachable and PI Web API is responding.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Use the working endpoint URL in your application');
  console.log('2. Configure authentication if required');
  console.log('3. Verify your AF server name and database name');
  console.log('4. Test your element paths');
}

// Run the diagnostics
runDiagnostics().catch(console.error);
