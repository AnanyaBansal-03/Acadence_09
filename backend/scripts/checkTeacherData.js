const supabase = require('../db');

async function checkAndSetupTeacherData() {
  console.log('🔍 Checking teacher data...\n');

  // Get all users to see what we have
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*');

  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log('📊 Total users:', users.length);
  
  // Find teachers
  const teachers = users.filter(u => u.role === 'teacher');
  console.log('👨‍🏫 Teachers found:', teachers.length);
  teachers.forEach(t => console.log(`   - ${t.name} (${t.email}) - ID: ${t.id}`));

  if (teachers.length === 0) {
    console.log('\n❌ No teachers found! Creating test teacher...');
    
    const { data: newTeacher, error: teacherError } = await supabase
      .from('users')
      .insert({
        name: 'Professor Smith',
        email: 'teacher@example.com',
        password: '$2b$10$xZJ8h.8gqCKqH8F5rGfLKeOvjZ7qGYhZVY5xB5rGfLKeOvjZ7qGYh', // password: teacher123
        role: 'teacher'
      })
      .select()
      .single();

    if (teacherError) {
      console.error('❌ Error creating teacher:', teacherError);
      return;
    }
    
    console.log('✅ Teacher created:', newTeacher);
    teachers.push(newTeacher);
  }

  // Check classes
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('*');

  if (classesError) {
    console.error('❌ Error fetching classes:', classesError);
    console.log('\n💡 The classes table might not exist. Creating it...');
    return;
  }

  console.log('\n📚 Total classes:', classes?.length || 0);
  
  // Check if teacher has classes
  const teacherId = teachers[0].id;
  const teacherClasses = classes?.filter(c => c.teacher_id === teacherId) || [];
  
  console.log(`\n📋 Classes for ${teachers[0].name}:`, teacherClasses.length);
  
  if (teacherClasses.length === 0) {
    console.log('\n💡 No classes assigned to this teacher. Creating sample classes...');
    
    const sampleClasses = [
      {
        name: 'Mathematics 101',
        teacher_id: teacherId,
        day_of_week: 'monday',
        time: '09:00',
        schedule_time: '09:00 AM'
      },
      {
        name: 'Physics 101',
        teacher_id: teacherId,
        day_of_week: 'wednesday',
        time: '11:00',
        schedule_time: '11:00 AM'
      },
      {
        name: 'Chemistry 101',
        teacher_id: teacherId,
        day_of_week: 'friday',
        time: '14:00',
        schedule_time: '02:00 PM'
      }
    ];

    const { data: newClasses, error: insertError } = await supabase
      .from('classes')
      .insert(sampleClasses)
      .select();

    if (insertError) {
      console.error('❌ Error creating classes:', insertError);
      return;
    }

    console.log('✅ Created', newClasses.length, 'classes');
    newClasses.forEach(c => console.log(`   - ${c.name} (${c.day_of_week} at ${c.time})`));
  } else {
    teacherClasses.forEach(c => console.log(`   - ${c.name} (${c.day_of_week} at ${c.time || c.schedule_time})`));
  }

  // Check students
  const students = users.filter(u => u.role === 'student');
  console.log('\n👨‍🎓 Students found:', students.length);

  if (students.length === 0) {
    console.log('\n💡 No students found. Creating sample students...');
    
    const sampleStudents = [
      { name: 'John Doe', email: 'john@example.com', password: 'hashed', role: 'student' },
      { name: 'Jane Smith', email: 'jane@example.com', password: 'hashed', role: 'student' },
      { name: 'Bob Wilson', email: 'bob@example.com', password: 'hashed', role: 'student' }
    ];

    const { data: newStudents, error: studentsError } = await supabase
      .from('users')
      .insert(sampleStudents)
      .select();

    if (studentsError) {
      console.error('❌ Error creating students:', studentsError);
    } else {
      console.log('✅ Created', newStudents.length, 'students');
      students.push(...newStudents);
    }
  }

  // Check enrollments
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('enrollments')
    .select('*');

  if (enrollmentsError) {
    console.error('❌ Error fetching enrollments:', enrollmentsError);
    console.log('\n💡 The enrollments table might not exist.');
    return;
  }

  console.log('\n📝 Total enrollments:', enrollments?.length || 0);

  if ((!enrollments || enrollments.length === 0) && students.length > 0 && teacherClasses.length > 0) {
    console.log('\n💡 Creating sample enrollments...');
    
    const sampleEnrollments = [];
    teacherClasses.forEach(cls => {
      students.slice(0, 2).forEach(student => {
        sampleEnrollments.push({
          student_id: student.id,
          class_id: cls.id
        });
      });
    });

    const { data: newEnrollments, error: enrollError } = await supabase
      .from('enrollments')
      .insert(sampleEnrollments)
      .select();

    if (enrollError) {
      console.error('❌ Error creating enrollments:', enrollError);
    } else {
      console.log('✅ Created', newEnrollments.length, 'enrollments');
    }
  }

  console.log('\n✅ Setup complete!');
  console.log('\n📋 Summary:');
  console.log(`   - Teachers: ${teachers.length}`);
  console.log(`   - Students: ${students.length}`);
  console.log(`   - Classes: ${classes?.length || 0}`);
  console.log(`   - Enrollments: ${enrollments?.length || 0}`);
  console.log('\n💡 You can now login with:');
  console.log(`   Email: ${teachers[0].email}`);
  console.log(`   Teacher ID: ${teachers[0].id}`);
}

checkAndSetupTeacherData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });