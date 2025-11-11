const supabase = require('../db');

/**
 * Test script to verify Google Classroom integration setup
 * Run: node scripts/testIntegrationSetup.js
 */

async function testIntegrationSetup() {
  console.log('🔍 Testing Google Classroom Integration Setup...\n');
  
  let allPassed = true;

  // Test 1: Check if integration tables exist
  console.log('1️⃣  Checking database tables...');
  try {
    const tables = ['user_integrations', 'external_assignments', 'external_courses', 'integration_sync_logs'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`   ❌ Table "${table}" not found or error: ${error.message}`);
        allPassed = false;
      } else {
        console.log(`   ✅ Table "${table}" exists`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Error checking tables: ${error.message}`);
    allPassed = false;
  }

  // Test 2: Check environment variables
  console.log('\n2️⃣  Checking environment variables...');
  const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'FRONTEND_URL'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`);
    } else {
      console.log(`   ❌ ${envVar} is missing`);
      allPassed = false;
    }
  }

  // Test 3: Check if googleapis package is installed
  console.log('\n3️⃣  Checking required packages...');
  try {
    require('googleapis');
    console.log('   ✅ googleapis package installed');
  } catch (error) {
    console.log('   ❌ googleapis package not installed');
    console.log('      Run: npm install googleapis');
    allPassed = false;
  }

  try {
    require('passport');
    console.log('   ✅ passport package installed');
  } catch (error) {
    console.log('   ❌ passport package not installed');
    console.log('      Run: npm install passport passport-google-oauth20');
    allPassed = false;
  }

  // Test 4: Check if services exist
  console.log('\n4️⃣  Checking service files...');
  try {
    const googleClassroomService = require('../services/googleClassroomService');
    console.log('   ✅ googleClassroomService.js exists');
    
    // Check if key methods exist
    if (typeof googleClassroomService.getAuthUrl === 'function') {
      console.log('   ✅ getAuthUrl method exists');
    } else {
      console.log('   ❌ getAuthUrl method missing');
      allPassed = false;
    }
  } catch (error) {
    console.log('   ❌ googleClassroomService.js not found');
    allPassed = false;
  }

  try {
    const integrationSyncService = require('../services/integrationSyncService');
    console.log('   ✅ integrationSyncService.js exists');
  } catch (error) {
    console.log('   ❌ integrationSyncService.js not found');
    allPassed = false;
  }

  // Test 5: Check if routes exist
  console.log('\n5️⃣  Checking route files...');
  try {
    const integrationsRoutes = require('../routes/integrations');
    console.log('   ✅ integrations.js routes exist');
  } catch (error) {
    console.log('   ❌ integrations.js routes not found');
    allPassed = false;
  }

  // Test 6: Test database connection
  console.log('\n6️⃣  Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      allPassed = false;
    } else {
      console.log('   ✅ Database connection successful');
    }
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    allPassed = false;
  }

  // Final Summary
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Set up Google Cloud OAuth credentials');
    console.log('   2. Update .env with your credentials');
    console.log('   3. Start the backend server: npm start');
    console.log('   4. Test OAuth flow in the frontend');
    console.log('\n📖 See GOOGLE_CLASSROOM_INTEGRATION_GUIDE.md for detailed setup');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('\n📋 Action Items:');
    console.log('   1. Review errors above');
    console.log('   2. Check GOOGLE_CLASSROOM_INTEGRATION_GUIDE.md');
    console.log('   3. Ensure all files are created');
    console.log('   4. Run database migrations');
    console.log('   5. Install missing packages');
  }
  console.log('='.repeat(50) + '\n');

  process.exit(allPassed ? 0 : 1);
}

// Run tests
testIntegrationSetup().catch(error => {
  console.error('💥 Test script error:', error);
  process.exit(1);
});
