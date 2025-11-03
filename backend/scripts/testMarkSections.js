const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testMarkSections() {
  console.log('🔍 Testing Mark Sections Setup...\n');

  // Test 1: Check if columns exist by trying to fetch them
  console.log('1. Checking if mark section columns exist in enrollments...');
  const { data: enrollmentTest, error: enrollErr } = await supabase
    .from('enrollments')
    .select('st1_marks, st2_marks, evaluation_marks, end_term_marks')
    .limit(1);

  if (enrollErr) {
    console.error('❌ Error:', enrollErr.message);
    console.log('\n⚠️  SQL MIGRATION NOT RUN YET!');
    console.log('The mark section columns do not exist in the database.');
    console.log('\nPlease run these SQL commands in Supabase Dashboard → SQL Editor:\n');
    console.log('File: backend/scripts/addMarkSections.sql\n');
    return;
  }

  console.log('✅ Mark section columns exist!\n');

  // Test 2: Check if duration_hours exists in classes table
  console.log('2. Checking if duration_hours column exists...');
  const { data: classTest, error: classError } = await supabase
    .from('classes')
    .select('id, name, duration_hours, start_time')
    .limit(1);

  if (classError) {
    console.error('❌ Error checking classes table:', classError.message);
    if (classError.message.includes('duration_hours')) {
      console.log('⚠️  duration_hours column does not exist. Run SQL migration!');
    }
    if (classError.message.includes('start_time')) {
      console.log('⚠️  start_time column does not exist (schedule_time not renamed). Run SQL migration!');
    }
    return;
  }

  console.log('✅ Classes table has duration_hours and start_time!\n');

  // Test 3: Get sample enrollment data
  console.log('3. Fetching sample enrollment data...');
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select(`
      student_id,
      class_id,
      st1_marks,
      st2_marks,
      evaluation_marks,
      end_term_marks,
      classes(name)
    `)
    .limit(5);

  if (enrollError) {
    console.error('❌ Error fetching enrollments:', enrollError.message);
    return;
  }

  console.log(`✅ Found ${enrollments.length} enrollments`);
  console.log('\nSample data:');
  enrollments.forEach((e, i) => {
    console.log(`\n  Enrollment ${i + 1}:`);
    console.log(`    Class: ${e.classes?.name || 'Unknown'}`);
    console.log(`    Student ID: ${e.student_id}`);
    console.log(`    ST1: ${e.st1_marks || 'not set'}`);
    console.log(`    ST2: ${e.st2_marks || 'not set'}`);
    console.log(`    Evaluation: ${e.evaluation_marks || 'not set'}`);
    console.log(`    End Term: ${e.end_term_marks || 'not set'}`);
  });

  console.log('\n✅ All tests passed! Mark sections are ready to use.');
}

testMarkSections().catch(console.error);
