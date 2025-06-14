// Test the fix for empty attributes issue
console.log('🔧 Testing the fix for empty attributes issue...');

// Simulate the FIXED mapAttributesToWellData behavior
const simulateFixedMapping = () => {
  console.log('\n✅ Simulating FIXED attribute mapping...');
  
  // Mock PI AF attributes (might be empty or have zero values)
  const mockAttributes = [
    { Name: 'Oil Production Rate', Value: { Value: 0 } }, // Zero value - should still be included
    { Name: 'Total Liquid Rate', Value: { Value: 150 } },
    { Name: 'Water Cut Percentage', Value: { Value: 25 } },
    { Name: 'ESP Motor Frequency', Value: { Value: 0 } } // Zero value - should still be included
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
  
  // Extract values (OLD way - this was working)
  const oilRate = attributeMap[attributeMapping.oilRate]?.Value?.Value || 0;
  const liquidRate = attributeMap[attributeMapping.liquidRate]?.Value?.Value || 0;
  const waterCut = attributeMap[attributeMapping.waterCut]?.Value?.Value || 0;
  const espFrequency = attributeMap[attributeMapping.espFrequency]?.Value?.Value || 0;
  
  console.log('Individual property values:', { oilRate, liquidRate, waterCut, espFrequency });
  
  // Build display attributes object - FIXED VERSION (always include attributes)
  const displayAttributes = {};
  
  // ALWAYS populate core attributes, even if zero
  if (attributeMapping.oilRate) {
    displayAttributes[attributeMapping.oilRate] = oilRate;
  }
  if (attributeMapping.liquidRate) {
    displayAttributes[attributeMapping.liquidRate] = liquidRate;
  }
  if (attributeMapping.waterCut) {
    displayAttributes[attributeMapping.waterCut] = waterCut;
  }
  if (attributeMapping.espFrequency) {
    displayAttributes[attributeMapping.espFrequency] = espFrequency;
  }
  
  console.log('✅ Fixed displayAttributes object:', displayAttributes);
  console.log('✅ Attributes count:', Object.keys(displayAttributes).length);
  
  // Create the final well data structure
  const wellData = {
    id: 'fixed-well',
    name: 'Fixed Test Well',
    status: 'active',
    attributes: displayAttributes, // This should now have data!
    oilRate,
    liquidRate,
    waterCut,
    espFrequency
  };
  
  return wellData;
};

// Test the fixed tile processing
const testFixedTileProcessing = (wellData) => {
  console.log('\n🧪 Testing FIXED tile processing...');
  
  console.log('Well data received by tile:', wellData);
  console.log('Has attributes?', !!wellData.attributes);
  console.log('Attributes keys:', Object.keys(wellData.attributes || {}));
  
  if (wellData.attributes) {
    const processedAttributes = [];
    Object.entries(wellData.attributes).forEach(([attributeName, value]) => {
      console.log(`Processing attribute: "${attributeName}" = ${value} (type: ${typeof value})`);
      if (typeof value === 'number') { // Accept all numeric values, including zero
        processedAttributes.push({
          key: attributeName,
          value,
          label: attributeName.replace(/_/g, ' ')
        });
        console.log(`  ✅ Added to display (value: ${value})`);
      }
    });
    console.log('✅ Processed attributes:', processedAttributes);
    return processedAttributes;
  }
  
  return [];
};

// Run the tests
const fixedWellData = simulateFixedMapping();
const fixedProcessedAttributes = testFixedTileProcessing(fixedWellData);

console.log('\n🎯 FIXED Results:');
console.log('- Well has attributes object:', !!fixedWellData.attributes);
console.log('- Attributes count:', Object.keys(fixedWellData.attributes || {}).length);
console.log('- Tile will display:', fixedProcessedAttributes.length, 'attributes');
console.log('- Attribute names:', fixedProcessedAttributes.map(a => a.label));

console.log('\n✅ SOLUTION SUMMARY:');
console.log('1. Always populate attributes object, even with zero values');
console.log('2. Remove the "greater than zero" condition from attribute mapping');
console.log('3. Accept zero values in tile processing (zero is meaningful data)');
console.log('4. This ensures tiles show actual data instead of being empty');
