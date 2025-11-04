const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service for sending attendance notifications
 * Supports Gmail, Outlook, and custom SMTP servers
 */

// Create reusable transporter
let transporter = null;

function createTransporter() {
  if (transporter) return transporter;

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email not configured. Add EMAIL_USER and EMAIL_PASS to .env file');
    return null;
  }

  const emailService = process.env.EMAIL_SERVICE || 'gmail'; // gmail, outlook, brevo, or custom

  let config;
  
  if (emailService === 'gmail') {
    config = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // Use App Password for Gmail
      }
    };
  } else if (emailService === 'outlook') {
    config = {
      service: 'hotmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };
  } else if (emailService === 'brevo' || emailService === 'sendinblue') {
    // Brevo (formerly Sendinblue) configuration
    config = {
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // SMTP Key from Brevo
      }
    };
  } else {
    // Custom SMTP server
    config = {
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    };
  }

  transporter = nodemailer.createTransport(config);

  // Verify connection configuration
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });

  return transporter;
}

/**
 * Generate HTML email template based on notification type
 */
function generateEmailHTML({ studentName, subjectCode, subjectName, percentage, type, message, absentDays, totalDays }) {
  const colors = {
    critical: { bg: '#FEE2E2', border: '#EF4444', emoji: '🚨' },
    warning: { bg: '#FED7AA', border: '#F97316', emoji: '⚠️' },
    good: { bg: '#FEF3C7', border: '#EAB308', emoji: '✅' },
    excellent: { bg: '#D1FAE5', border: '#10B981', emoji: '🌟' }
  };

  const color = colors[type] || colors.warning;
  const attendanceBar = Math.round(percentage);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .alert-box { background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .alert-emoji { font-size: 48px; margin-bottom: 10px; }
        .message { font-size: 16px; line-height: 1.6; color: #374151; margin: 15px 0; }
        .stats { display: table; width: 100%; margin: 20px 0; }
        .stat-item { display: table-cell; text-align: center; padding: 15px; background: #f9fafb; border-radius: 8px; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
        .stat-value { font-size: 24px; font-weight: bold; color: #111827; margin-top: 5px; }
        .progress-bar { background: #e5e7eb; height: 24px; border-radius: 12px; overflow: hidden; margin: 20px 0; }
        .progress-fill { background: ${color.border}; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; transition: width 0.3s ease; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .threshold { font-size: 12px; color: #6b7280; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📚 Acadence LMS</h1>
          <p>Attendance Alert Notification</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="alert-box">
            <div class="alert-emoji">${color.emoji}</div>
            <h2 style="margin: 0 0 10px; color: #111827;">Hello ${studentName}!</h2>
            <div class="message">${message}</div>
          </div>

          <!-- Attendance Stats -->
          <div class="stats">
            <div class="stat-item" style="margin-right: 10px;">
              <div class="stat-label">Subject</div>
              <div class="stat-value">${subjectCode}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Attendance</div>
              <div class="stat-value">${percentage}%</div>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${attendanceBar}%;">${percentage}%</div>
          </div>
          <div class="threshold">
            ${percentage < 75 ? '❌ Below Required 75%' : percentage < 85 ? '⚠️ Approaching Critical' : percentage < 95 ? '✅ Good Standing' : '🌟 Excellent!'}
          </div>

          <!-- Detailed Stats -->
          <div style="margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <h3 style="margin: 0 0 15px; color: #374151;">Attendance Details</h3>
            <p style="margin: 8px 0; color: #6b7280;"><strong>Subject:</strong> ${subjectName}</p>
            <p style="margin: 8px 0; color: #6b7280;"><strong>Classes Attended:</strong> ${totalDays - absentDays} / ${totalDays}</p>
            <p style="margin: 8px 0; color: #6b7280;"><strong>Classes Missed:</strong> ${absentDays}</p>
            <p style="margin: 8px 0; color: #6b7280;"><strong>Current Percentage:</strong> ${percentage}%</p>
          </div>

          ${percentage < 75 ? `
          <!-- Warning Box for Critical -->
          <div style="background: #FEF2F2; border: 2px solid #EF4444; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong style="color: #991B1B;">⚠️ DETENTION RISK</strong>
            <p style="margin: 10px 0 0; color: #7F1D1D; font-size: 14px;">Your attendance is below the required 75% threshold. Please attend all upcoming classes to avoid academic consequences.</p>
          </div>
          ` : ''}

          <!-- Call to Action -->
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard" class="cta-button">
              View Full Attendance Report
            </a>
          </center>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Acadence Learning Management System</strong></p>
          <p>This is an automated notification. Please do not reply to this email.</p>
          <p style="margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #667eea; text-decoration: none;">Visit Dashboard</a> • 
            <a href="#" style="color: #667eea; text-decoration: none;">Help Center</a>
          </p>
          <p style="margin-top: 10px; color: #9ca3af; font-size: 11px;">
            © ${new Date().getFullYear()} Acadence. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send attendance notification email
 */
async function sendAttendanceEmail({
  to,
  studentName,
  subjectCode,
  subjectName,
  percentage,
  type,
  message,
  absentDays,
  totalDays
}) {
  try {
    const transport = createTransporter();
    
    if (!transport) {
      console.log('📧 Email service not configured - skipping email notification');
      return { success: false, error: 'Email not configured' };
    }

    const subject = type === 'critical' 
      ? `🚨 URGENT: ${subjectCode} Attendance Alert - Action Required`
      : type === 'warning'
      ? `⚠️ ${subjectCode} Attendance Warning`
      : type === 'excellent'
      ? `🌟 Great Job! ${subjectCode} Attendance Update`
      : `✅ ${subjectCode} Attendance Update`;

    const htmlContent = generateEmailHTML({
      studentName,
      subjectCode,
      subjectName,
      percentage,
      type,
      message,
      absentDays,
      totalDays
    });

    // Plain text fallback
    const textContent = `
Hello ${studentName},

${message}

Subject: ${subjectName} (${subjectCode})
Current Attendance: ${percentage}%
Classes Attended: ${totalDays - absentDays} / ${totalDays}
Classes Missed: ${absentDays}

${percentage < 75 ? 'WARNING: Your attendance is below the required 75% threshold. Please attend all upcoming classes to avoid detention.' : ''}

Visit your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard

---
Acadence Learning Management System
This is an automated notification.
    `.trim();

    const mailOptions = {
      from: `"Acadence LMS" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
      priority: type === 'critical' ? 'high' : 'normal'
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk attendance emails (for daily digest, etc.)
 */
async function sendBulkAttendanceEmails(notifications) {
  const results = {
    sent: 0,
    failed: 0,
    errors: []
  };

  for (const notif of notifications) {
    try {
      const result = await sendAttendanceEmail(notif);
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({ email: notif.to, error: result.error });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      results.errors.push({ email: notif.to, error: error.message });
    }
  }

  return results;
}

/**
 * Generate HTML for weekly attendance recommendation email
 */
function generateWeeklyEmailHTML({ studentName, aiMessage, subjects }) {
  // Determine overall severity
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
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 35px; }
        .greeting { font-size: 18px; color: #111827; margin-bottom: 20px; }
        .ai-message { background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); padding: 25px; border-radius: 12px; border-left: 4px solid ${headerColor}; margin: 25px 0; line-height: 1.8; color: #374151; white-space: pre-line; }
        .subject-card { background: white; border: 2px solid #E5E7EB; border-radius: 10px; padding: 20px; margin: 15px 0; transition: all 0.3s; }
        .subject-card:hover { border-color: ${headerColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .subject-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .subject-code { font-size: 20px; font-weight: bold; color: #111827; }
        .percentage { font-size: 24px; font-weight: bold; color: ${headerColor}; }
        .progress-bar { background: #E5E7EB; height: 12px; border-radius: 6px; overflow: hidden; margin: 15px 0; }
        .progress-fill { height: 100%; background: ${headerColor}; transition: width 0.3s ease; border-radius: 6px; }
        .class-list { margin-top: 15px; }
        .class-item { display: flex; align-items: center; padding: 8px 0; color: #6B7280; font-size: 14px; }
        .class-item::before { content: "📅"; margin-right: 8px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 10px; }
        .badge-critical { background: #FEE2E2; color: #991B1B; }
        .badge-warning { background: #FED7AA; color: #9A3412; }
        .cta-button { display: inline-block; background: ${headerGradient}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .footer { background: #F9FAFB; padding: 25px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>📊 Weekly Attendance Report</h1>
          <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="greeting">Hello ${studentName}! 👋</div>

          <!-- AI Generated Message -->
          <div class="ai-message">
            ${aiMessage}
          </div>

          <!-- Subject Details -->
          <h3 style="color: #111827; margin: 30px 0 15px;">📚 Subject Breakdown</h3>
          
          ${subjects.map(subject => `
            <div class="subject-card">
              <div class="subject-header">
                <div class="subject-code">${subject.subject_code}</div>
                <div class="percentage">${subject.attendance_percentage.toFixed(1)}%</div>
              </div>
              
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(100, subject.attendance_percentage)}%;"></div>
              </div>
              
              <div style="font-size: 13px; color: #6B7280; margin-top: 8px;">
                <strong>${subject.classes_attended}/${subject.total_classes}</strong> classes attended
                ${subject.classes_needed_for_75 > 0 ? `<br><strong style="color: #DC2626;">Must attend next ${subject.classes_needed_for_75} class${subject.classes_needed_for_75 > 1 ? 'es' : ''} to reach 75%</strong>` : ''}
              </div>

              ${subject.attendance_percentage < 75 
                ? '<span class="badge badge-critical">🚨 Below Threshold</span>'
                : subject.attendance_percentage < 80
                ? '<span class="badge badge-warning">⚠️ Needs Attention</span>'
                : ''
              }

              ${subject.upcoming_classes && subject.upcoming_classes.length > 0 ? `
                <div class="class-list">
                  <strong style="color: #374151; font-size: 13px;">Upcoming classes this week:</strong>
                  ${subject.upcoming_classes.map(cls => `
                    <div class="class-item">${cls.day_of_week} at ${cls.start_time}</div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}

          <!-- Call to Action -->
          <center>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard" class="cta-button">
              📱 View Full Dashboard
            </a>
          </center>

          <!-- Motivational Footer -->
          <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 10px; text-align: center;">
            <p style="margin: 0; color: #1E40AF; font-weight: 600; font-size: 14px;">
              💪 Remember: Every class counts! Stay on track and succeed!
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p><strong>Acadence Learning Management System</strong></p>
          <p>Weekly Automated Attendance Report</p>
          <p style="margin-top: 15px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #667eea; text-decoration: none;">Visit Dashboard</a> • 
            <a href="#" style="color: #667eea; text-decoration: none;">Help Center</a>
          </p>
          <p style="margin-top: 10px; color: #9ca3af; font-size: 11px;">
            © ${new Date().getFullYear()} Acadence. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send weekly attendance recommendation email
 */
async function sendWeeklyAttendanceEmail(to, studentName, subject, aiMessage, subjects) {
  try {
    const transport = createTransporter();
    
    if (!transport) {
      console.log('📧 Email service not configured - skipping email');
      return { success: false, error: 'Email not configured' };
    }

    const htmlContent = generateWeeklyEmailHTML({
      studentName,
      aiMessage,
      subjects
    });

    // Plain text fallback
    const textContent = `
Hello ${studentName},

${aiMessage}

Subject Breakdown:
${subjects.map(s => `
${s.subject_code}: ${s.attendance_percentage.toFixed(1)}%
- Classes: ${s.classes_attended}/${s.total_classes}
${s.classes_needed_for_75 > 0 ? `- Must attend next ${s.classes_needed_for_75} class(es) to reach 75%` : ''}
${s.upcoming_classes && s.upcoming_classes.length > 0 ? `- Upcoming: ${s.upcoming_classes.map(c => `${c.day_of_week} at ${c.start_time}`).join(', ')}` : ''}
`).join('\n')}

Visit your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/dashboard

---
Acadence Learning Management System
Weekly Automated Attendance Report
    `.trim();

    const mailOptions = {
      from: `"Acadence LMS" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
      priority: subjects.some(s => s.attendance_percentage < 75) ? 'high' : 'normal'
    };

    const info = await transport.sendMail(mailOptions);
    console.log(`✅ Weekly email sent to ${to}: ${info.messageId}`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending weekly email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendAttendanceEmail,
  sendBulkAttendanceEmails,
  sendWeeklyAttendanceEmail,
  createTransporter
};
