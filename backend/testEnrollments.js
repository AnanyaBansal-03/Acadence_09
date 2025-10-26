const supabase = require('./db');

async function testEnrollments() {
  console.log('Testing enrollments fetch...\n');

  try {
    // Direct Supabase query (no ordering - created_at doesn't exist)
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, users!enrollments_student_id_fkey(id, name, email), classes(id, name)');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Enrollments found:', data?.length || 0);
    console.log('Data:', JSON.stringify(data, null, 2));

    // Test without joins
    console.log('\n--- Testing without joins ---');
    const { data: simpleData, error: simpleError } = await supabase
      .from('enrollments')
      .select('*');

    if (simpleError) {
      console.error('❌ Simple query error:', simpleError);
      return;
    }

    console.log('✅ Simple enrollments:', simpleData?.length || 0);
    console.log('Data:', JSON.stringify(simpleData, null, 2));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testEnrollments();
