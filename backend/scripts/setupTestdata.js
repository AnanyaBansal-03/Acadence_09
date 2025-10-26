require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestData() {
  console.log('🚀 Setting up test data for Teacher Dashboard...\n');

  try {
    // 1. Get or create a teacher
    let { data: teachers } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'teacher')
      .limit(1);

    let teacherId;
    if (!teachers || teachers.length === 0) {
      console.log('No teachers found, creating one...');
      const { data: newTeacher, error } = await supabase
        .from('users')
        .insert({
          name: 'Professor Smith',
          email: 'teacher@example.com',
          password: 'hashed_password',
          role: 'teacher'
        })
        .select()
        .single();

      if (error) throw error;
      teacherId = newTeacher.id;
      console.log('✅ Created teacher:', newTeacher.name, '- ID:', teacherId);
    } else {
      teacherId = teachers[0].id;
      console.log('✅ Using existing teacher:', teachers[0].name, '- ID:', teacherId);
    }

    // 2. Check if classes table exists and add classes
    console.log('\n📚 Setting up classes...');
    const { data: existingClasses } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);

    if (!existingClasses || existingClasses.length === 0) {
      const classes = [
        {
          name: 'Mathematics 101',
          teacher_id: teacherId,
          day_of_week: 'monday',
          time: '09:00 AM',
          schedule_time: '09:00 AM',
          room: 'Room 201'
        },
        {
          name: 'Physics 201',
          teacher_id: teacherId,
          day_of_week: 'wednesday',
          time: '11:00 AM',
          schedule_time: '11:00 AM',
          room: 'Room 305'
        },
        {
          name: 'Chemistry 101',
          teacher_id: teacherId,
          day_of_week: 'friday',
          time: '02:00 PM',
          schedule_time: '02:00 PM',
          room: 'Lab 102'
        }
      ];

      const { data: newClasses, error: classError } = await supabase
        .from('classes')
        .insert(classes)
        .select();

      if (classError) throw classError;
      console.log(`✅ Created ${newClasses.length} classes`);
    } else {
      console.log(`✅ Found ${existingClasses.length} existing classes`);
    }

    // 3. Get or create students
    console.log('\n👨‍🎓 Setting up students...');
    let { data: students } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student');

    if (!students || students.length === 0) {
      const newStudents = [
        { name: 'John Doe', email: 'john@student.com', password: 'hashed', role: 'student' },
        { name: 'Jane Smith', email: 'jane@student.com', password: 'hashed', role: 'student' },
        { name: 'Bob Johnson', email: 'bob@student.com', password: 'hashed', role: 'student' },
        { name: 'Alice Brown', email: 'alice@student.com', password: 'hashed', role: 'student' }
      ];

      const { data: createdStudents, error: studentError } = await supabase
        .from('users')
        .insert(newStudents)
        .select();

      if (studentError) throw studentError;
      students = createdStudents;
      console.log(`✅ Created ${students.length} students`);
    } else {
      console.log(`✅ Found ${students.length} existing students`);
    }

    // 4. Create enrollments
    console.log('\n📝 Setting up enrollments...');
    const { data: classes } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId);

    const enrollments = [];
    classes.forEach(cls => {
      students.slice(0, 3).forEach(student => {
        enrollments.push({
          student_id: student.id,
          class_id: cls.id
        });
      });
    });

    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert(enrollments, { onConflict: 'student_id,class_id', ignoreDuplicates: true });

    if (enrollError && !enrollError.message.includes('duplicate')) {
      throw enrollError;
    }
    console.log(`✅ Created/verified ${enrollments.length} enrollments`);

    // 5. Create some attendance records
      console.log('\n✅ Setting up attendance records...');
  
  // Create some attendance records for the past week
  const today = new Date();
  const daysToCreate = 7;
  
  try {
    for (let i = 0; i < daysToCreate; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const classItem of existingClasses.slice(0, 2)) { // Just first 2 classes
        for (const student of existingStudents) {
          // Check if attendance already exists
          const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', student.id)
            .eq('class_id', classItem.id)
            .eq('date', dateStr)
            .single();
          
          if (!existing) {
            const { error: attendanceError } = await supabase
              .from('attendance')
              .insert({
                student_id: student.id,
                class_id: classItem.id,
                date: dateStr,
                status: Math.random() > 0.2 ? 'present' : 'absent',
                marked_at: date.toISOString()
              });
            
            if (attendanceError) {
              console.log(`⚠️  Skipping duplicate attendance record`);
            }
          }
        }
      }
    }
    console.log('✅ Attendance records created/verified');
  } catch (err) {
    console.log('⚠️  Note: Some attendance records may already exist');
  }

    console.log('\n🎉 Test data setup complete!');
    console.log('\n📋 Summary:');
    console.log(`   Teacher ID: ${teacherId}`);
    console.log(`   Classes: ${existingClasses.length}`);
    console.log(`   Students: ${students.length}`);
    console.log(`   Enrollments: ${enrollments.length}`);
    console.log('\n💡 Login with:');
    console.log(`   Email: teacher@example.com or student@example.com`);
    console.log(`   Or use Teacher ID: ${teacherId}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

setupTestData()
  .then(() => {
    console.log('\n✅ Done! You can now refresh your teacher dashboard.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });