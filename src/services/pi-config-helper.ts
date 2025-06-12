// PI AF Configuration Helper
// Use this to discover the correct configuration for your PI AF system

import { PIAFService } from '@/services/pi-af-service';

export class PIConfigHelper {
  static async discoverConfiguration(config: any) {
    console.log('🔍 PI AF Configuration Discovery Tool');
    console.log('=====================================');
    
    try {
      const piafService = new PIAFService(config);
      
      // Test endpoint connectivity
      console.log('\n1️⃣ Testing PI Web API connectivity...');
      const endpoint = await (piafService as any).findWorkingEndpoint();
      if (!endpoint) {
        console.error('❌ Cannot connect to PI Web API');
        return;
      }
      console.log(`✅ Connected to: ${endpoint}`);
      
      // Discover databases
      console.log('\n2️⃣ Discovering databases...');
      const databases = await (piafService as any).loadDatabases();
      console.log(`📋 Found ${databases.length} databases:`);
      databases.forEach((db: any, index: number) => {
        console.log(`   ${index + 1}. "${db.Name}" (Path: ${db.Path})`);
      });
      
      // If specific database is configured, explore it
      if (config.afDatabaseName) {
        console.log(`\n3️⃣ Exploring database "${config.afDatabaseName}"...`);
        const targetDb = databases.find((db: any) => 
          db.Name === config.afDatabaseName ||
          db.Name.toLowerCase() === config.afDatabaseName.toLowerCase()
        );
        
        if (targetDb) {
          const elements = await (piafService as any).loadElements(targetDb);
          console.log(`📂 Found ${elements.length} top-level elements:`);
          elements.slice(0, 20).forEach((el: any, index: number) => {
            console.log(`   ${index + 1}. Name: "${el.Name}"`);
            console.log(`      Path: "${el.Path}"`);
            console.log(`      Template: "${el.TemplateName || 'None'}"`);
            console.log('      ---');
          });
          
          if (elements.length > 20) {
            console.log(`   ... and ${elements.length - 20} more elements`);
          }
          
          // Test loading children for first few elements
          console.log(`\n4️⃣ Testing element structure (checking for wells)...`);
          for (const element of elements.slice(0, 3)) {
            try {
              const children = await (piafService as any).loadElements(element);
              console.log(`🔍 "${element.Name}" has ${children.length} child elements`);
              if (children.length > 0) {
                console.log(`   First few children: ${children.slice(0, 5).map((c: any) => c.Name).join(', ')}`);
              }
            } catch (error) {
              console.log(`⚠️ Could not load children for "${element.Name}":`, error);
            }
          }
        } else {
          console.error(`❌ Database "${config.afDatabaseName}" not found`);
        }
      }
      
      console.log('\n📝 Configuration Recommendations:');
      console.log('1. Use one of the database names listed above for "AF Database Name"');
      console.log('2. For "Parent Element Path", use the Name of an element that contains wells');
      console.log('3. Leave "Parent Element Path" empty to use all top-level elements');
      
    } catch (error) {
      console.error('❌ Discovery failed:', error);
    }
  }
}
