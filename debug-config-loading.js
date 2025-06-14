#!/usr/bin/env node

/**
 * Debug Configuration Loading
 * This script tests what configuration is actually being loaded
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEBUG: Configuration Loading Test\n');

// Test 1: Check what's in the config file
const configPath = path.join(process.cwd(), 'pi-config.json');
console.log('📁 Reading config file:', configPath);

if (fs.existsSync(configPath)) {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    console.log('✅ Config file found and loaded:');
    console.log('   Mode:', config.mode);
    console.log('   AF Server:', config.piServerConfig?.afServerName);
    console.log('   Database:', config.piServerConfig?.afDatabaseName);
    console.log('   Element Path:', config.piServerConfig?.parentElementPath);
    console.log('   Template:', config.piServerConfig?.templateName);
    console.log('   Oil Rate Mapping:', config.attributeMapping?.oilRate);
    console.log('   Liquid Rate Mapping:', config.attributeMapping?.liquidRate);
    console.log('   ESP Frequency Mapping:', config.attributeMapping?.espFrequency);
} else {
    console.log('❌ Config file not found!');
}

// Test 2: Check for other config files
console.log('\n🔍 Checking for other config files...');
const files = fs.readdirSync('.');
const configFiles = files.filter(f => f.includes('config') && f.endsWith('.json'));
console.log('Found config files:', configFiles);

configFiles.forEach(file => {
    if (file !== 'pi-config.json') {
        console.log(`\n📄 Checking ${file}:`);
        try {
            const data = fs.readFileSync(file, 'utf8');
            const config = JSON.parse(data);
            if (config.attributeMapping?.oilRate) {
                console.log(`   Oil Rate: ${config.attributeMapping.oilRate}`);
                console.log(`   Element Path: ${config.piServerConfig?.parentElementPath}`);
                console.log(`   Template: ${config.piServerConfig?.templateName}`);
            }
        } catch (e) {
            console.log(`   ❌ Error reading ${file}:`, e.message);
        }
    }
});

console.log('\n✅ Configuration debug complete.');
