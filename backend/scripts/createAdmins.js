const bcrypt = require('bcryptjs');
const supabase = require('../db');

async function createAdmins() {
  const adminPassword = 'admin123'; // Change this to your desired password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admins = [
    { name: 'Admin One', email: 'admin1@acadence.com' },
    { name: 'Admin Two', email: 'admin2@acadence.com' },
    { name: 'Admin Three', email: 'admin3@acadence.com' }
  ];

  console.log('Creating admin users...\n');

  for (const admin of admins) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: admin.name,
            email: admin.email,
            password: hashedPassword,
            role: 'admin',
            email_verified: true  // Skip email verification for admins
          }
        ])
        .select('id, name, email, role');

      if (error) {
        if (error.code === '23505') {
          console.log(`❌ ${admin.email} - Already exists, updating...`);
          
          // Update existing user to admin with verified email
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              role: 'admin', 
              email_verified: true,
              password: hashedPassword
            })
            .eq('email', admin.email);

          if (updateError) {
            console.log(`❌ Failed to update ${admin.email}:`, updateError.message);
          } else {
            console.log(`✅ ${admin.email} - Updated to admin with new password`);
          }
        } else {
          console.log(`❌ Failed to create ${admin.email}:`, error.message);
        }
      } else {
        console.log(`✅ ${admin.email} - Created successfully`);
        console.log(`   ID: ${data[0].id}, Name: ${data[0].name}`);
      }
    } catch (err) {
      console.error(`❌ Error with ${admin.email}:`, err.message);
    }
  }

  console.log('\n🔑 Admin Credentials:');
  console.log('Email: admin1@acadence.com | Password: admin123');
  console.log('Email: admin2@acadence.com | Password: admin123');
  console.log('Email: admin3@acadence.com | Password: admin123');
  console.log('\n⚠️  Remember to change these passwords after first login!');

  // Verify admins
  const { data: adminList, error } = await supabase
    .from('users')
    .select('id, name, email, role, email_verified')
    .eq('role', 'admin');

  if (!error && adminList) {
    console.log('\n📋 All Admin Users:');
    adminList.forEach(admin => {
      console.log(`   ${admin.email} - Verified: ${admin.email_verified ? '✅' : '❌'}`);
    });
  }

  process.exit(0);
}

createAdmins().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});