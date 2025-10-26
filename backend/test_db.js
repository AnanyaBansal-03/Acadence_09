require('dotenv').config();
const supabase = require('./db');

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connected to Supabase successfully!');
      console.log('Users count:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

testConnection();