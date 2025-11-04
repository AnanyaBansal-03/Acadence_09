// Test email with Chitkara domain verification
const nodemailer = require('nodemailer');
require('dotenv').config();

async function testChitkaraEmail() {
  console.log('🧪 Testing Email Delivery to Chitkara Domain\n');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true, // Enable debug output
    logger: true  // Log to console
  });

  console.log('Testing SMTP connection...');
  
  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP server connection verified\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    return;
  }

  // Try multiple FROM addresses to see which works
  const fromAddresses = [
    process.env.EMAIL_USER, // 9aaddb001@smtp-brevo.com
    'noreply@acadence.app',
    'admin@acadence.app',
  ];

  for (const fromEmail of fromAddresses) {
    console.log(`\n📧 Testing with FROM: ${fromEmail}`);
    
    const mailOptions = {
      from: `"Acadence Test" <${fromEmail}>`,
      to: 'yana0075.becse24@chitkara.edu.in',
      subject: `🧪 Test ${Date.now()} - From ${fromEmail}`,
      text: `This is a test email sent from ${fromEmail} at ${new Date().toLocaleString()}`,
      html: `
        <h2>🧪 Email Delivery Test</h2>
        <p>Sent from: <strong>${fromEmail}</strong></p>
        <p>Time: ${new Date().toLocaleString()}</p>
        <p>If you receive this, email delivery is working!</p>
      `
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ SUCCESS! Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}`);
      
      // Wait 2 seconds between sends
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`❌ FAILED: ${error.message}`);
    }
  }
  
  console.log('\n\n📬 Check yana0075.becse24@chitkara.edu.in inbox now!');
  console.log('   Check ALL folders: Inbox, Spam, Junk, All Mail');
  console.log('\n💡 If still no email:');
  console.log('   1. Chitkara might block external SMTP');
  console.log('   2. Try logging into Chitkara webmail directly');
  console.log('   3. Check Brevo dashboard: https://app.brevo.com/');
}

testChitkaraEmail();
