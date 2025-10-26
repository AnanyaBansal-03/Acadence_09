const supabase = require('../db');

async function initializeDatabase() {
  console.log('🚀 Initializing Acadence Database Tables...');
  
  try {
    // Check if users table exists and has data
    console.log('📋 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message);
    } else {
      console.log(`✅ Users table: ${users.length} users found`);
    }

    // Check if classes table exists
    console.log('📚 Checking classes table...');
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .limit(5);
    
    if (classesError) {
      console.log('⚠️  Classes table might not exist. Creating sample data...');
      
      // Create some sample classes
      const sampleClasses = [
        {
          name: 'Mathematics 101',
          description: 'Basic Mathematics Course',
          teacher_id: 'teacher1',
          day_of_week: 'monday',
          time: '09:00:00',
          duration: 60
        },
        {
          name: 'Physics 101', 
          description: 'Introduction to Physics',
          teacher_id: 'teacher1',
          day_of_week: 'wednesday',
          time: '11:00:00',
          duration: 90
        },
        {
          name: 'Chemistry 101',
          description: 'Basic Chemistry',
          teacher_id: 'teacher1', 
          day_of_week: 'friday',
          time: '14:00:00',
          duration: 75
        }
      ];

      const { data: insertedClasses, error: insertError } = await supabase
        .from('classes')
        .insert(sampleClasses)
        .select();

      if (insertError) {
        console.error('❌ Failed to create classes:', insertError.message);
      } else {
        console.log(`✅ Created ${insertedClasses.length} sample classes`);
      }
    } else {
      console.log(`✅ Classes table: ${classes.length} classes found`);
    }

    // Check enrollments table
    console.log('👥 Checking enrollments table...');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*')
      .limit(5);
    
    if (enrollmentsError) {
      console.log('⚠️  Enrollments table might not exist or be empty');
      console.log('   Run the enrollment script manually to add student enrollments');
    } else {
      console.log(`✅ Enrollments table: ${enrollments.length} enrollments found`);
    }

    // Check attendance table  
    console.log('📊 Checking attendance table...');
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .limit(5);
    
    if (attendanceError) {
      console.log('⚠️  Attendance table might not exist or be empty');
      console.log('   This is normal for a new installation');
    } else {
      console.log(`✅ Attendance table: ${attendance.length} records found`);
    }

    console.log('\n🎉 Database initialization complete!');
    console.log('📝 Summary:');
    console.log('   - Users: Available');
    console.log('   - Classes: Available (sample data created if needed)');
    console.log('   - Enrollments: Check manually');
    console.log('   - Attendance: Ready for new data');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('💡 This might be due to:');
    console.log('   1. Missing environment variables in .env file');
    console.log('   2. Incorrect Supabase credentials');
    console.log('   3. Network connectivity issues');
    console.log('   4. Tables not yet created in Supabase dashboard');
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };