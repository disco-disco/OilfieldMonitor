// Test script to demonstrate false positive fix
// Run this in browser console to test with fake data

console.log('🧪 Testing False Positive Fix...');

// Test with completely fake configuration
const fakeConfig = {
  afServerName: 'FAKE-SERVER-12345',
  piWebApiServerName: 'fake-web-api-server.com',
  afDatabaseName: 'NonExistentDatabase',
  parentElementPath: 'FakePath\\FakeElement',
  templateName: 'FakeTemplate'
};

console.log('Testing with fake configuration:', fakeConfig);
console.log('This should FAIL with strict validation and detailed error messages');
console.log('Previous version would have succeeded with just PI Web API connectivity test');
