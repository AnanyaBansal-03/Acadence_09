const supabase = require('../db');

async function updateAdminNames() {
  console.log('Updating admin names...\n');

  const updates = [
    { email: 'admin1@acadence.com', name: 'Yana Sobti' },
    { email: 'admin2@acadence.com', name: 'Ananya Bansal' },
    { email: 'admin3@acadence.com', name: 'Ansh Kaur' }
  ];

  for (const admin of updates) {
    const { error } = await supabase
      .from('users')
      .update({ name: admin.name })
      .eq('email', admin.email);

    if (error) {
      console.log(`❌ Failed to update ${admin.email}:`, error.message);
    } else {
      console.log(`✅ Updated: ${admin.email} → ${admin.name}`);
    }
  }

  // Verify updates
  const { data } = await supabase
    .from('users')
    .select('name, email, role')
    .eq('role', 'admin')
    .order('email');

  console.log('\n📋 All Admin Users:');
  data.forEach(admin => {
    console.log(`   ${admin.email} - ${admin.name}`);
  });

  process.exit(0);
}

updateAdminNames().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
