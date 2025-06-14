#!/usr/bin/env node

// Debug script to test attribute mapping issue
console.log('🔍 Debugging attribute mapping issue...');

// Test 1: Simulate the attribute mapping from the service
const simulateAttributeMapping = () => {
  console.log('\n🧪 Test 1: Simulating attribute mapping...');
  
  // Mock PI AF attributes (what we might get from the server)
  const mockAttributes = [
    { Name: 'Oil Production Rate', Value: { Value: 150 } },
    { Name: 'Total Liquid Rate', Value: { Value: 200 } },
    { Name: 'Water Cut Percentage', Value: { Value: 25 } },
    { Name: 'ESP Motor Frequency', Value: { Value: 50 } }
  ];
  
  // Mock attribute mapping configuration
  const attributeMapping = {
    oilRate: 'Oil Production Rate',
    liquidRate: 'Total Liquid Rate',
    waterCut: 'Water Cut Percentage',
    espFrequency: 'ESP Motor Frequency'
  };
  
  // Create attribute lookup map
  const attributeMap = {};
  mockAttributes.forEach(attr => {
    attributeMap[attr.Name] = attr;
  });
  
  console.log('Available attributes:', Object.keys(attributeMap));
  console.log('Attribute mapping config:', attributeMapping);
  
  // Extract values
  const oilRate = attributeMap[attributeMapping.oilRate]?.Value?.Value || 0;
  const liquidRate = attributeMap[attributeMapping.liquidRate]?.Value?.Value || 0;
  const waterCut = attributeMap[attributeMapping.waterCut]?.Value?.Value || 0;
  const espFrequency = attributeMap[attributeMapping.espFrequency]?.Value?.Value || 0;
  
  console.log('Extracted values:', { oilRate, liquidRate, waterCut, espFrequency });
  
  // Build display attributes object
  const displayAttributes = {};
  if (attributeMapping.oilRate && oilRate > 0) {
    displayAttributes[attributeMapping.oilRate] = oilRate;
  }
  if (attributeMapping.liquidRate && liquidRate > 0) {
    displayAttributes[attributeMapping.liquidRate] = liquidRate;
  }
  if (attributeMapping.waterCut && waterCut > 0) {
    displayAttributes[attributeMapping.waterCut] = waterCut;
  }
  if (attributeMapping.espFrequency && espFrequency > 0) {
    displayAttributes[attributeMapping.espFrequency] = espFrequency;
  }
  
  console.log('Display attributes object:', displayAttributes);
  console.log('Attributes count:', Object.keys(displayAttributes).length);
  
  // Create the final well data structure
  const wellData = {
    id: 'test-well',
    name: 'Test Well',
    status: oilRate > 0 ? 'active' : 'inactive',
    attributes: displayAttributes,
    oilRate,
    liquidRate,
    waterCut,
    espFrequency
  };
  
  console.log('Final well data:', wellData);
  return wellData;
};

// Test 2: Test the DynamicWellTile processing logic
const testTileProcessing = (wellData) => {
  console.log('\n🧪 Test 2: Testing tile processing logic...');
  
  console.log('Well data received by tile:', wellData);
  console.log('Has attributes?', !!wellData.attributes);
  console.log('Attributes type:', typeof wellData.attributes);
  console.log('Attributes keys:', wellData.attributes ? Object.keys(wellData.attributes) : []);
  
  if (wellData.attributes) {
    const processedAttributes = [];
    Object.entries(wellData.attributes).forEach(([attributeName, value]) => {
      console.log(`Processing attribute: "${attributeName}" = ${value} (type: ${typeof value})`);
      if (typeof value === 'number') {
        processedAttributes.push({
          key: attributeName,
          value,
          label: attributeName.replace(/_/g, ' ')
        });
      }
    });
    console.log('Processed attributes:', processedAttributes);
    return processedAttributes;
  }
  
  return [];
};

// Run tests
const testWellData = simulateAttributeMapping();
const processedAttributes = testTileProcessing(testWellData);

console.log('\n✅ Test Results:');
console.log('- Attribute mapping works:', Object.keys(testWellData.attributes).length > 0);
console.log('- Tile processing works:', processedAttributes.length > 0);
console.log('- Expected attribute count:', processedAttributes.length);
