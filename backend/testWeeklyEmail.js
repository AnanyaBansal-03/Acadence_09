// Quick test script to trigger weekly email notifications
// Run this with: node testWeeklyEmail.js

const fetch = require('node-fetch');

async function testWeeklyEmails() {
  console.log('🧪 Testing Weekly Email Notifications...\n');
  
  // Step 1: Login as a student to get token
  console.log('Step 1: Logging in...');
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'yana0075.becse24@chitkara.edu.in', // Change this to any student email
      password: 'yana@1234' // Change this to the actual password
    })
  });
  
  const loginData = await loginResponse.json();
  
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData.message);
    console.log('💡 Update the email/password in this script to match a student in your database');
    return;
  }
  
  console.log('✅ Logged in successfully as:', loginData.user.name);
  console.log('📧 Email:', loginData.user.email);
  
  const token = loginData.token;
  
  // Step 2: Trigger weekly notifications
  console.log('\nStep 2: Triggering weekly email notifications...');
  const notifResponse = await fetch('http://localhost:5000/api/notifications/send-weekly', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const notifData = await notifResponse.json();
  
  if (notifData.success) {
    console.log('✅ Weekly notifications sent successfully!');
    console.log('\n📬 Check your email inbox for the weekly attendance report');
    console.log('   (Check spam folder if not in inbox)');
  } else {
    console.error('❌ Failed to send notifications:', notifData.message);
  }
  
  console.log('\n📊 Check the backend terminal for detailed logs');
}

// Run the test
testWeeklyEmails().catch(err => {
  console.error('❌ Error:', err.message);
});
