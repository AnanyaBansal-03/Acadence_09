require('dotenv').config();
const { Resend } = require('resend');

async function testResendEmail() {
  console.log('🔧 Testing Resend Email Service...\n');
  
  // Check configuration
  console.log('📋 Configuration:');
  console.log('API Key:', process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 10)}...` : '❌ MISSING');
  console.log('From:', process.env.EMAIL_FROM);
  console.log('From Name:', process.env.EMAIL_FROM_NAME);
  console.log('Service:', process.env.EMAIL_SERVICE);
  console.log('');
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env file!');
    return;
  }
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  try {
    console.log('📧 Sending test email to: yana0075.becse24@chitkara.edu.in\n');
    
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to: ['yana0075.becse24@chitkara.edu.in'],
      subject: '🧪 Test Email from Acadence - Resend Integration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">✅ Resend Email Test Successful!</h2>
          <p>Hi there,</p>
          <p>This is a test email from your <strong>Acadence LMS</strong> application.</p>
          <p>If you're reading this, it means:</p>
          <ul>
            <li>✅ Resend API is properly configured</li>
            <li>✅ Email delivery is working</li>
            <li>✅ Weekly attendance notifications should work!</li>
          </ul>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Sent via Resend API<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `Test Email from Acadence LMS\n\nIf you're reading this, Resend integration is working!\n\nTime: ${new Date().toLocaleString()}`
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
      console.error('\nFull Error Details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ EMAIL SENT SUCCESSFULLY!\n');
    console.log('📋 Response Details:');
    console.log('Message ID:', data.id);
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\n📬 Check your inbox: yana0075.becse24@chitkara.edu.in');
    console.log('⏱️ Resend emails typically arrive within seconds');
    console.log('\n💡 If email not received:');
    console.log('   1. Check spam/junk folder');
    console.log('   2. Check Resend dashboard: https://resend.com/emails');
    console.log('   3. Verify domain settings in Resend');
    
  } catch (error) {
    console.error('❌ EXCEPTION:', error.message);
    console.error('\nStack Trace:', error.stack);
  }
}

testResendEmail();
