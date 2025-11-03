const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testAdminMarks() {
  console.log('🔍 Testing Admin Marks API Query...\n');

  // Simulate the same query the admin route uses
  const { data, error } = await supabase
    .from("enrollments")
    .select(`
      marks,
      st1_marks,
      st2_marks,
      evaluation_marks,
      end_term_marks,
      student_id,
      class_id,
      users!enrollments_student_id_fkey (id, name, email),
      classes (id, name, day_of_week, start_time)
    `)
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    
    // Check if it's a column name issue
    if (error.message.includes('start_time')) {
      console.log('\n⚠️  Column "start_time" does not exist!');
      console.log('Trying with "schedule_time" instead...\n');
      
      const { data: data2, error: error2 } = await supabase
        .from("enrollments")
        .select(`
          marks,
          st1_marks,
          st2_marks,
          evaluation_marks,
          end_term_marks,
          student_id,
          class_id,
          users!enrollments_student_id_fkey (id, name, email),
          classes (id, name, day_of_week, schedule_time)
        `)
        .limit(5);
      
      if (error2) {
        console.error('❌ Still error:', error2.message);
      } else {
        console.log('✅ Query works with schedule_time!');
        console.log('\n📊 Sample data:');
        console.log(JSON.stringify(data2, null, 2));
        console.log('\n⚠️  You need to update the backend to use "schedule_time" instead of "start_time"');
      }
    }
    return;
  }

  console.log('✅ Query successful!\n');
  console.log('📊 Sample enrollment data:');
  
  data.forEach((enrollment, i) => {
    console.log(`\nEnrollment ${i + 1}:`);
    console.log(`  Student: ${enrollment.users?.name} (ID: ${enrollment.student_id})`);
    console.log(`  Class: ${enrollment.classes?.name} (ID: ${enrollment.class_id})`);
    console.log(`  ST1: ${enrollment.st1_marks || 'not set'}`);
    console.log(`  ST2: ${enrollment.st2_marks || 'not set'}`);
    console.log(`  Evaluation: ${enrollment.evaluation_marks || 'not set'}`);
    console.log(`  End Term: ${enrollment.end_term_marks || 'not set'}`);
  });
}

testAdminMarks().catch(console.error);
