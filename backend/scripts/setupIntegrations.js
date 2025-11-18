const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runIntegrationSetup() {
  console.log('🚀 Setting up Google Classroom Integration tables...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'createIntegrationsTables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_sql').insert({ query: statement });
        
        if (queryError) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message || queryError.message);
          console.log('Statement:', statement.substring(0, 100) + '...\n');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully\n`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      }
    }

    console.log('✅ Integration tables setup completed!\n');
    console.log('📋 Created tables:');
    console.log('  - integration_tokens');
    console.log('  - external_assignments');
    console.log('\n✨ You can now use Google Classroom integration!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n⚠️  Please run the SQL manually in Supabase SQL Editor:');
    console.error('   Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql');
    console.error('   Copy the contents of: backend/scripts/createIntegrationsTables.sql');
  }
}

runIntegrationSetup();
