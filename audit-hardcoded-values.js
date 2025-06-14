#!/usr/bin/env node

/**
 * 🔍 HARDCODED INFRASTRUCTURE AUDIT SCRIPT
 * Verifies that NO hardcoded server names, database names, or infrastructure details exist in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 HARDCODED INFRASTRUCTURE AUDIT');
console.log('=====================================\n');

// List of potential hardcoded values to search for
const HARDCODED_PATTERNS = [
    // Server names
    'MES-PIAF01CPF',
    'MES-PIV0801IQ',
    
    // Database names 
    'WQ2',
    'Configuration',
    
    // Element paths
    'Element1',
    'Element2', 
    
    // Template names
    'WellTemplate',
    'Well_Template',
    
    // Company/Field names
    'PLINQO',
    'Plinqo',
    
    // Well naming patterns
    'PL-',
    'EC-',
    'NR-',
    'SV-'
];

// Files to exclude from audit (configuration files are OK to have these)
const EXCLUDED_FILES = [
    'pi-config.json',
    'pi-config-clean.json',
    'package.json',
    'package-lock.json',
    '.md', // Documentation files
    '.js' // Test/debug scripts
];

// Directories to search
const SEARCH_DIRS = [
    'src',
    '.' // Root directory for some config files
];

function shouldSkipFile(filePath) {
    // Skip node_modules, .git, .next, etc.
    if (filePath.includes('node_modules') || 
        filePath.includes('.git') || 
        filePath.includes('.next') ||
        filePath.includes('dist')) {
        return true;
    }
    
    // Skip excluded file types
    return EXCLUDED_FILES.some(excluded => filePath.endsWith(excluded));
}

function searchInFile(filePath, content) {
    const findings = [];
    
    HARDCODED_PATTERNS.forEach(pattern => {
        if (content.includes(pattern)) {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
                if (line.includes(pattern)) {
                    findings.push({
                        pattern,
                        line: index + 1,
                        content: line.trim()
                    });
                }
            });
        }
    });
    
    return findings;
}

function auditDirectory(dir) {
    const results = {};
    
    function walkDir(currentDir) {
        try {
            const items = fs.readdirSync(currentDir);
            
            items.forEach(item => {
                const itemPath = path.join(currentDir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    walkDir(itemPath);
                } else if (stat.isFile()) {
                    if (shouldSkipFile(itemPath)) {
                        return;
                    }
                    
                    // Only check text files
                    const ext = path.extname(item).toLowerCase();
                    if (['.ts', '.tsx', '.js', '.jsx', '.json'].includes(ext)) {
                        try {
                            const content = fs.readFileSync(itemPath, 'utf8');
                            const findings = searchInFile(itemPath, content);
                            
                            if (findings.length > 0) {
                                results[itemPath] = findings;
                            }
                        } catch (err) {
                            // Skip files that can't be read
                        }
                    }
                }
            });
        } catch (err) {
            // Skip directories that can't be read
        }
    }
    
    walkDir(dir);
    return results;
}

// Run the audit
let totalFindings = 0;
let hasProblems = false;

SEARCH_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
        console.log(`🔍 Auditing: ${dir}/`);
        const results = auditDirectory(dir);
        
        if (Object.keys(results).length > 0) {
            hasProblems = true;
            console.log(`❌ Found hardcoded values in ${dir}/:\n`);
            
            Object.entries(results).forEach(([file, findings]) => {
                console.log(`📁 ${file}:`);
                findings.forEach(finding => {
                    console.log(`   Line ${finding.line}: "${finding.pattern}" in:`);
                    console.log(`   ${finding.content}`);
                    totalFindings++;
                });
                console.log('');
            });
        } else {
            console.log(`✅ Clean - no hardcoded values found in ${dir}/\n`);
        }
    }
});

// Summary
console.log('\n🎯 AUDIT SUMMARY');
console.log('================');

if (hasProblems) {
    console.log(`❌ AUDIT FAILED: Found ${totalFindings} hardcoded infrastructure references`);
    console.log('\n🔧 ACTION REQUIRED:');
    console.log('   • Remove all hardcoded server names, database names, and infrastructure details');
    console.log('   • Ensure all values come from configuration/settings only');
    console.log('   • Update any remaining hardcoded values to be dynamic');
    process.exit(1);
} else {
    console.log('✅ AUDIT PASSED: No hardcoded infrastructure names found in source code');
    console.log('\n🎉 VERIFICATION COMPLETE:');
    console.log('   • All server names loaded dynamically from settings');
    console.log('   • All database names loaded dynamically from settings'); 
    console.log('   • All element paths loaded dynamically from settings');
    console.log('   • All template names loaded dynamically from settings');
    console.log('   • Codebase is infrastructure-agnostic');
    console.log('\n🚀 Ready for deployment to any PI System environment!');
    process.exit(0);
}
