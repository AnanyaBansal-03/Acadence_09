const bcrypt = require('bcryptjs');
const supabase = require('../db');

async function createTeachers() {
  const teacherPassword = 'teacher123'; // Default password for all teachers
  const hashedPassword = await bcrypt.hash(teacherPassword, 10);

  const teachers = [
    { name: 'Vijay Pradeep', email: 'vijay.pradeep@acadence.com' },
    { name: 'Vikas Shrivastav', email: 'vikas.shrivastav@acadence.com' },
    { name: 'Vanshika Mehta', email: 'vanshika.mehta@acadence.com' },
    { name: 'Gagandeep Kaur', email: 'gagandeep.kaur@acadence.com' },
    { name: 'Pankaj Chaudhary', email: 'pankaj.chaudhary@acadence.com' }
  ];

  console.log('Creating teacher accounts...\n');

  for (const teacher of teachers) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: teacher.name,
            email: teacher.email,
            password: hashedPassword,
            role: 'teacher',
            email_verified: true  // Skip email verification for teachers
          }
        ])
        .select('id, name, email, role');

      if (error) {
        if (error.code === '23505') {
          console.log(`❌ ${teacher.email} - Already exists, updating...`);
          
          // Update existing user
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              name: teacher.name,
              role: 'teacher', 
              email_verified: true,
              password: hashedPassword
            })
            .eq('email', teacher.email);

          if (updateError) {
            console.log(`❌ Failed to update ${teacher.email}:`, updateError.message);
          } else {
            console.log(`✅ ${teacher.email} - Updated to teacher with new password`);
          }
        } else {
          console.log(`❌ Failed to create ${teacher.email}:`, error.message);
        }
      } else {
        console.log(`✅ ${teacher.email} - Created successfully`);
        console.log(`   ID: ${data[0].id}, Name: ${data[0].name}`);
      }
    } catch (err) {
      console.error(`❌ Error with ${teacher.email}:`, err.message);
    }
  }

  console.log('\n🔑 Teacher Credentials:');
  console.log('Email: vijay.pradeep@acadence.com | Password: teacher123');
  console.log('Email: vikas.shrivastav@acadence.com | Password: teacher123');
  console.log('Email: vanshika.mehta@acadence.com | Password: teacher123');
  console.log('Email: gagandeep.kaur@acadence.com | Password: teacher123');
  console.log('Email: pankaj.chaudhary@acadence.com | Password: teacher123');
  console.log('\n⚠️  Remember to change these passwords after first login!');

  // Verify teachers
  const { data: teacherList, error } = await supabase
    .from('users')
    .select('id, name, email, role, email_verified')
    .eq('role', 'teacher')
    .order('email');

  if (!error && teacherList) {
    console.log('\n📋 All Teacher Users:');
    teacherList.forEach(teacher => {
      console.log(`   ${teacher.email} - ${teacher.name} - Verified: ${teacher.email_verified ? '✅' : '❌'}`);
    });
  }

  process.exit(0);
}

createTeachers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
