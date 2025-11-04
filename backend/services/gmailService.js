/**
 * Gmail SMTP Email Service
 * Alternative to Resend - works without domain verification
 * Requires Gmail App Password
 */

const nodemailer = require('nodemailer');

/**
 * Send weekly attendance email via Gmail SMTP
 */
async function sendWeeklyAttendanceEmailGmail(to, studentName, subject, aiMessage, subjects) {
  try {
    // Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const htmlContent = generateWeeklyEmailHTML(studentName, aiMessage, subjects);
    const textContent = generateTextContent(studentName, aiMessage, subjects);

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Acadence LMS'} <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent via Gmail to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Gmail email error for ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Generate HTML email content
 */
function generateWeeklyEmailHTML(studentName, aiMessage, subjects) {
  const subjectRows = subjects.map(subject => {
    const percentage = subject.attendance_percentage;
    let statusColor = '#22c55e'; // Green for good
    let statusText = 'Good';
    let barColor = '#22c55e';

    if (percentage < 75) {
      statusColor = '#ef4444'; // Red for critical
      statusText = 'Critical';
      barColor = '#ef4444';
    } else if (percentage < 80) {
      statusColor = '#f59e0b'; // Orange for warning
      statusText = 'Warning';
      barColor = '#f59e0b';
    }

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${subject.name}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${subject.attended}/${subject.total}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <div style="background-color: #f3f4f6; border-radius: 8px; height: 24px; overflow: hidden;">
            <div style="background-color: ${barColor}; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="color: ${statusColor}; font-weight: 600;">${percentage}%</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="background-color: ${statusColor}15; color: ${statusColor}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
            ${statusText}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          ${subject.classes_needed_for_75 > 0 ? `<strong>${subject.classes_needed_for_75}</strong> classes` : '✅ Target met'}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Attendance Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📊 Weekly Attendance Update
              </h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #1f2937;">
                Hi <strong>${studentName}</strong>,
              </p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1e40af; line-height: 1.6;">
                  ${aiMessage}
                </p>
              </div>
            </td>
          </tr>

          <!-- Attendance Table -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">
                📚 Your Attendance Breakdown
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Subject</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Classes</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Progress</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">%</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Status</th>
                    <th style="padding: 12px; text-align: left; font-size: 14px; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${subjectRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin-top: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>💡 Remember:</strong> You need <strong>75% attendance</strong> to be eligible for exams. Attend all your upcoming classes!
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                  Sent with 💙 by <strong>Acadence LMS</strong>
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  You're receiving this because you're enrolled in courses at Chitkara University
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate plain text email content
 */
function generateTextContent(studentName, aiMessage, subjects) {
  let text = `Weekly Attendance Update\n`;
  text += `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
  text += `Hi ${studentName},\n\n`;
  text += `${aiMessage}\n\n`;
  text += `Your Attendance Breakdown:\n`;
  text += `${'='.repeat(60)}\n\n`;

  subjects.forEach(subject => {
    text += `${subject.name}\n`;
    text += `  Classes: ${subject.attended}/${subject.total}\n`;
    text += `  Percentage: ${subject.attendance_percentage}%\n`;
    text += `  Action: ${subject.classes_needed_for_75 > 0 ? `Attend next ${subject.classes_needed_for_75} classes` : 'Target met ✓'}\n\n`;
  });

  text += `${'='.repeat(60)}\n\n`;
  text += `Remember: You need 75% attendance to be eligible for exams.\n`;
  text += `Attend all your upcoming classes!\n\n`;
  text += `Sent by Acadence LMS\n`;

  return text;
}

module.exports = {
  sendWeeklyAttendanceEmailGmail
};
