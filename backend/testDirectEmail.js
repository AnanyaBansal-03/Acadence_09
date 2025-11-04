// Direct email test - bypasses all attendance calculations
// Run with: node testDirectEmail.js

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testDirectEmail() {
  console.log('📧 Testing Direct Email to yana0075.becse24@chitkara.edu.in\n');
  
  // Create transporter
  console.log('Creating email transporter...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  console.log('✅ Transporter created');
  console.log('SMTP Host:', process.env.SMTP_HOST);
  console.log('SMTP Port:', process.env.SMTP_PORT);
  console.log('Email User:', process.env.EMAIL_USER);
  console.log('');

  // Test email content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .content { padding: 20px; }
        .badge { display: inline-block; background: #ef4444; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧪 Test Email from Acadence LMS</h1>
        </div>
        <div class="content">
          <h2>Hello Yana! 👋</h2>
          <p>This is a <strong>test email</strong> from your Acadence LMS system.</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #fee2e2; border-left: 4px solid #ef4444; border-radius: 5px;">
            <span class="badge">🚨 TEST MODE</span>
            <p style="margin: 10px 0 0;">If you're receiving this email, it means:</p>
            <ul>
              <li>✅ Brevo SMTP is configured correctly</li>
              <li>✅ Email service is working</li>
              <li>✅ Emails can reach your inbox</li>
            </ul>
          </div>

          <p><strong>Sample Weekly Attendance Report Preview:</strong></p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p><strong>DSOOPS:</strong> 68.5% attendance</p>
            <div style="background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden;">
              <div style="background: #ef4444; width: 68.5%; height: 100%;"></div>
            </div>
            <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
              📅 Upcoming classes: Monday 11:00, Wednesday 15:00
            </p>
          </div>

          <p style="margin-top: 20px;">
            <a href="http://localhost:5173/student/dashboard" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Dashboard
            </a>
          </p>

          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            This is an automated test email from Acadence LMS.<br>
            Sent on ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Acadence LMS Test" <${process.env.EMAIL_USER}>`,
    to: 'yanasobti@gmail.com',
    subject: '🧪 Test Email - Acadence Weekly Attendance System',
    html: htmlContent,
    text: 'This is a test email from Acadence LMS. If you can read this, email delivery is working!'
  };

  console.log('Sending test email...');
  console.log('To:', mailOptions.to);
  console.log('Subject:', mailOptions.subject);
  console.log('');

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('');
    console.log('📬 Check your inbox: yana0075.becse24@chitkara.edu.in');
    console.log('   (Also check spam/junk folder)');
  } catch (error) {
    console.error('❌ EMAIL FAILED!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testDirectEmail();
