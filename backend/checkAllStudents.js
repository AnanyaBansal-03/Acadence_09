const supabase = require('./db');

async function checkAllStudents() {
  try {
    // Get all students
    const { data: students } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('role', 'student')
      .order('id');

    console.log('All Students:');
    
    for (const student of students) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, class_id')
        .eq('student_id', student.id);

      const { data: attendance } = await supabase
        .from('attendance')
        .select('id, class_id, date, status')
        .eq('student_id', student.id);

      const uniqueClasses = [...new Set(attendance?.map(a => a.class_id) || [])];
      
      console.log(`\nStudent ${student.id} (${student.name}) - Role: ${student.role}`);
      console.log(`  Enrollments: ${enrollments?.length || 0}`);
      console.log(`  Total Attendance Records: ${attendance?.length || 0}`);
      console.log(`  Unique Classes with Attendance: ${uniqueClasses.length}`);
      
      if (attendance && attendance.length > 0) {
        console.log(`  Attendance by class:`);
        const byClass = {};
        attendance.forEach(a => {
          if (!byClass[a.class_id]) byClass[a.class_id] = 0;
          byClass[a.class_id]++;
        });
        
        for (const [classId, count] of Object.entries(byClass)) {
          console.log(`    Class ${classId}: ${count} records`);
        }
      }
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkAllStudents();