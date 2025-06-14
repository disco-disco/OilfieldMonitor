// Test to reproduce the "no attributes mapped" issue
console.log('🔍 Testing "no attributes mapped" scenario...');

// Test case 1: Well with empty attributes object (what we might be getting from PI AF)
const wellWithNoAttributes = {
  id: 'test-well-1',
  name: 'Test Well 1',
  status: 'active',
  oilRate: 150,
  liquidRate: 200,
  waterCut: 25,
  gasRate: 350,
  espFrequency: 50,
  attributes: {} // Empty attributes object - this might be the issue!
};

console.log('📊 Test Case 1: Well with empty attributes object');
console.log('Well data:', wellWithNoAttributes);
console.log('Has attributes?', !!wellWithNoAttributes.attributes);
console.log('Attributes keys:', Object.keys(wellWithNoAttributes.attributes));
console.log('Attributes count:', Object.keys(wellWithNoAttributes.attributes).length);

// Test case 2: Well with null/undefined attributes
const wellWithNullAttributes = {
  id: 'test-well-2',
  name: 'Test Well 2',
  status: 'active',
  oilRate: 150,
  liquidRate: 200,
  waterCut: 25,
  attributes: null
};

console.log('\n📊 Test Case 2: Well with null attributes');
console.log('Well data:', wellWithNullAttributes);
console.log('Has attributes?', !!wellWithNullAttributes.attributes);

// Test case 3: Well with zero values in attributes
const wellWithZeroAttributes = {
  id: 'test-well-3',
  name: 'Test Well 3',
  status: 'active',
  oilRate: 0,
  liquidRate: 0,
  waterCut: 0,
  attributes: {
    'Oil Production Rate': 0,
    'Total Liquid Rate': 0,
    'Water Cut Percentage': 0
  }
};

console.log('\n📊 Test Case 3: Well with zero-value attributes');
console.log('Well data:', wellWithZeroAttributes);
console.log('Has attributes?', !!wellWithZeroAttributes.attributes);
console.log('Attributes keys:', Object.keys(wellWithZeroAttributes.attributes));
console.log('Non-zero attributes:', Object.entries(wellWithZeroAttributes.attributes).filter(([k,v]) => v !== 0));

// Test case 4: Simulate what DynamicWellTile would do with each case
const testTileProcessing = (well, testName) => {
  console.log(`\n🧪 ${testName} - Tile Processing:`);
  
  const processedAttributes = [];
  if (well.attributes) {
    Object.entries(well.attributes).forEach(([attributeName, value]) => {
      console.log(`  Checking attribute: "${attributeName}" = ${value} (type: ${typeof value})`);
      if (typeof value === 'number' && value !== 0) {
        processedAttributes.push({
          key: attributeName,
          value,
          label: attributeName.replace(/_/g, ' ')
        });
        console.log(`    ✅ Added to display`);
      } else {
        console.log(`    ❌ Skipped (not number or zero value)`);
      }
    });
  } else {
    console.log('  ❌ No attributes object found');
  }
  
  console.log(`  Result: ${processedAttributes.length} attributes will be displayed`);
  return processedAttributes;
};

testTileProcessing(wellWithNoAttributes, 'Empty Attributes');
testTileProcessing(wellWithNullAttributes, 'Null Attributes');
testTileProcessing(wellWithZeroAttributes, 'Zero Attributes');

console.log('\n🎯 Conclusion:');
console.log('If the PI AF service is returning wells with empty attributes objects,');
console.log('the tiles will only show well names and no attribute values.');
console.log('This matches the described issue exactly!');
