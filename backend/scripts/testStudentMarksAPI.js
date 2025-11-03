// Simple test to check if marks API returns section data correctly
const fetch = require('node-fetch');

async function testStudentMarksAPI() {
  console.log('🔍 Testing Student Marks API...\n');

  // You need to get a valid student token first
  // For testing, let's try to login as a student
  
  const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'ansh@student.com',  // Change to your test student email
      password: 'student123'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Login failed. Make sure backend server is running.');
    console.log('Start backend with: npm start');
    return;
  }

  const { token } = await loginResponse.json();
  console.log('✅ Login successful\n');

  // Test marks endpoint
  const marksResponse = await fetch('http://localhost:5000/api/student/marks', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!marksResponse.ok) {
    console.error('❌ Failed to fetch marks');
    return;
  }

  const marks = await marksResponse.json();
  console.log('📊 Marks data received:');
  console.log(JSON.stringify(marks, null, 2));

  // Check if section marks are included
  if (marks.length > 0) {
    const firstMark = marks[0];
    console.log('\n🔍 Checking first mark object:');
    console.log(`  class_name: ${firstMark.class_name}`);
    console.log(`  st1: ${firstMark.st1}`);
    console.log(`  st2: ${firstMark.st2}`);
    console.log(`  evaluation: ${firstMark.evaluation}`);
    console.log(`  end_term: ${firstMark.end_term}`);
    
    if (firstMark.st1 !== undefined || firstMark.st2 !== undefined || 
        firstMark.evaluation !== undefined || firstMark.end_term !== undefined) {
      console.log('\n✅ Section marks are being returned correctly!');
    } else {
      console.log('\n❌ Section marks are missing from response!');
    }
  } else {
    console.log('\n⚠️  No marks found for this student.');
  }
}

testStudentMarksAPI().catch(console.error);
