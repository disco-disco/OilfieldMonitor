// Quick PI Web API endpoint test
const testEndpoints = [
  'https://MES-PIV0801IQ/piwebapi',
  'https://MES-PIV0801IQ:443/piwebapi', 
  'http://MES-PIV0801IQ/piwebapi',
  'http://MES-PIV0801IQ:80/piwebapi',
  'https://MES-PIV0801IQ/PIWebAPI',
  'http://MES-PIV0801IQ/PIWebAPI',
  'https://MES-PIV0801IQ/PI/WebAPI',
  'http://MES-PIV0801IQ/PI/WebAPI'
];

async function testPIEndpoints() {
  console.log('🧪 Testing PI Web API endpoints...');
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(endpoint, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      console.log(`✅ ${endpoint} - Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`Response preview: ${text.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }
}

testPIEndpoints();
