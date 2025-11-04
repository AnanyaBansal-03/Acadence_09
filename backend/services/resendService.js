// Resend Email Service - Modern, reliable email delivery
const { Resend } = require('resend');
require('dotenv').config();

// Only initialize Resend if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send weekly attendance email using Resend
 */
async function sendWeeklyAttendanceEmailResend(to, studentName, subject, aiMessage, subjects) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in .env file');
      return { success: false, error: 'Resend not configured' };
    }

    // Generate HTML email
    const htmlContent = generateWeeklyEmailHTML({ studentName, aiMessage, subjects });
    
    // Send via Resend
    const data = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'Acadence LMS'} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: [to],
      subject: subject,
      html: htmlContent,
      text: generateTextContent(studentName, aiMessage, subjects)
    });

    console.log(`✅ Email sent via Resend to ${to}`);
    console.log(`   Message ID: ${data.id}`);
    
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('❌ Resend email error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email template
 */
function generateWeeklyEmailHTML({ studentName, aiMessage, subjects }) {
  const critical = subjects.filter(s => s.attendance_percentage < 75);
  const warning = subjects.filter(s => s.attendance_percentage >= 75 && s.attendance_percentage < 80);
  
  const headerColor = critical.length > 0 ? '#EF4444' : warning.length > 0 ? '#F97316' : '#10B981';
  const headerGradient = critical.length > 0 
    ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
    : warning.length > 0
    ? 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)'
    : 'linear-gradient(135deg, #059669 0%, #047857 100%)';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 650px; margin: 20px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: ${headerGradient}; padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 35px; }
        .message { background: #f3f4f6; padding: 25px; border-radius: 12px; border-left: 4px solid ${headerColor}; margin: 25px 0; line-height: 1.8; color: #374151; white-space: pre-line; }
        .subject-card { background: white; border: 2px solid #E5E7EB; border-radius: 10px; padding: 20px; margin: 15px 0; }
        .subject-code { font-size: 20px; font-weight: bold; color: #111827; }
        .percentage { font-size: 24px; font-weight: bold; color: ${headerColor}; }
        .progress-bar { background: #E5E7EB; height: 12px; border-radius: 6px; overflow: hidden; margin: 15px 0; }
        .progress-fill { height: 100%; background: ${headerColor}; transition: width 0.3s ease; border-radius: 6px; }
        .footer { background: #F9FAFB; padding: 25px; text-align: center; font-size: 12px; color: #6B7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Weekly Attendance Report</h1>
          <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div class="content">
          <h2>Hello ${studentName}! 👋</h2>
          <div class="message">${aiMessage}</div>
          
          <h3 style="margin: 30px 0 15px;">📚 Subject Breakdown</h3>
          ${subjects.map(subject => `
            <div class="subject-card">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <span class="subject-code">${subject.subject_code}</span>
                <span class="percentage">${subject.attendance_percentage.toFixed(1)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, subject.attendance_percentage)}%;"></div>
              </div>
              <p style="margin: 10px 0; font-size: 13px; color: #6B7280;">
                <strong>${subject.classes_attended}/${subject.total_classes}</strong> classes attended
              </p>
            </div>
          `).join('')}
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard" 
               style="display: inline-block; background: ${headerGradient}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
              📱 View Full Dashboard
            </a>
          </p>
        </div>
        <div class="footer">
          <p><strong>Acadence Learning Management System</strong></p>
          <p>© ${new Date().getFullYear()} Acadence. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text version
 */
function generateTextContent(studentName, aiMessage, subjects) {
  let text = `Hello ${studentName},\n\n${aiMessage}\n\n`;
  text += `Subject Breakdown:\n`;
  subjects.forEach(s => {
    text += `\n${s.subject_code}: ${s.attendance_percentage.toFixed(1)}%`;
    text += `\n- Classes: ${s.classes_attended}/${s.total_classes}`;
  });
  text += `\n\nVisit your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard`;
  return text;
}

module.exports = {
  sendWeeklyAttendanceEmailResend
};
