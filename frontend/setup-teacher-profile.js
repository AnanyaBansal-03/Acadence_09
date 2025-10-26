// Enhanced Teacher Profile Setup Script
// Run this in the browser console to set up complete teacher profile data

// Set comprehensive teacher profile data
localStorage.setItem('userId', 'teacher1');
localStorage.setItem('userName', 'Dr. Sarah Johnson');
localStorage.setItem('userEmail', 'sarah.johnson@university.edu');
localStorage.setItem('role', 'teacher');
localStorage.setItem('token', 'mock-jwt-token');

// Additional profile details
localStorage.setItem('userDepartment', 'Computer Science');
localStorage.setItem('userDesignation', 'Associate Professor');
localStorage.setItem('userSpecialization', 'Machine Learning & Data Science');
localStorage.setItem('userOffice', 'Room 301, CS Building');
localStorage.setItem('userOfficeHours', 'Mon-Fri: 2:00 PM - 4:00 PM');
localStorage.setItem('userPhone', '+1 (555) 123-4567');
localStorage.setItem('userJoinDate', 'September 2020');

console.log('✅ Complete teacher profile data set in localStorage:');
console.log('👤 Basic Info:');
console.log('- User ID:', localStorage.getItem('userId'));
console.log('- Name:', localStorage.getItem('userName'));
console.log('- Email:', localStorage.getItem('userEmail'));
console.log('- Role:', localStorage.getItem('role'));

console.log('\n🏢 Professional Info:');
console.log('- Department:', localStorage.getItem('userDepartment'));
console.log('- Designation:', localStorage.getItem('userDesignation'));
console.log('- Specialization:', localStorage.getItem('userSpecialization'));
console.log('- Office:', localStorage.getItem('userOffice'));
console.log('- Office Hours:', localStorage.getItem('userOfficeHours'));
console.log('- Phone:', localStorage.getItem('userPhone'));
console.log('- Join Date:', localStorage.getItem('userJoinDate'));

console.log('\n🎯 Next Steps:');
console.log('1. Navigate to: http://localhost:5174');
console.log('2. Go to Teacher Dashboard');
console.log('3. Click on your profile picture (top right)');
console.log('4. View your complete profile information!');

// Optional: Reload the page to see changes immediately
console.log('\n🔄 Reloading page to apply changes...');
setTimeout(() => {
    window.location.reload();
}, 2000);