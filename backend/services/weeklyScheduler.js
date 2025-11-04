const cron = require('node-cron');
const supabase = require('../db');
const { generateWeeklyAttendanceAdvice, generateEmailSubject } = require('./openaiService');

// Use Resend if configured, Gmail if configured, otherwise fall back to nodemailer
let sendEmailFunction;
let emailServiceName;

try {
  if (process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const { sendWeeklyAttendanceEmailGmail } = require('./gmailService');
    sendEmailFunction = sendWeeklyAttendanceEmailGmail;
    emailServiceName = 'Gmail SMTP';
    console.log('📧 Using Gmail SMTP for email delivery');
  } else if (process.env.EMAIL_SERVICE === 'resend' && process.env.RESEND_API_KEY) {
    const { sendWeeklyAttendanceEmailResend } = require('./resendService');
    sendEmailFunction = sendWeeklyAttendanceEmailResend;
    emailServiceName = 'Resend';
    console.log('📧 Using Resend for email delivery');
  } else {
    const { sendWeeklyAttendanceEmail } = require('./emailService');
    sendEmailFunction = sendWeeklyAttendanceEmail;
    emailServiceName = 'Nodemailer (Brevo)';
    console.log('📧 Using Nodemailer for email delivery');
  }
} catch (error) {
  console.warn('⚠️ Email service initialization:', error.message);
  const { sendWeeklyAttendanceEmail } = require('./emailService');
  sendEmailFunction = sendWeeklyAttendanceEmail;
  emailServiceName = 'Nodemailer (Brevo)';
}

/**
 * Calculate attendance percentage and classes needed to reach 75%
 */
function calculateAttendanceMetrics(attended, total) {
  const percentage = total > 0 ? (attended / total) * 100 : 100;
  
  // Calculate how many classes needed to reach 75%
  // Formula: (attended + x) / (total + x) = 0.75
  // attended + x = 0.75 * (total + x)
  // attended + x = 0.75*total + 0.75*x
  // x - 0.75*x = 0.75*total - attended
  // 0.25*x = 0.75*total - attended
  // x = (0.75*total - attended) / 0.25
  
  const classesNeededFor75 = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  
  return {
    attendance_percentage: percentage,
    classes_needed_for_75: classesNeededFor75
  };
}

/**
 * Get upcoming classes for the current week (Monday to Sunday)
 */
function getUpcomingClassesThisWeek(classes) {
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Filter classes that are later this week
  return classes.filter(cls => {
    const classDay = daysOfWeek.indexOf(cls.day_of_week.toLowerCase());
    return classDay >= currentDay && classDay <= 6; // Rest of this week
  });
}

/**
 * Process weekly attendance notifications for all students
 */
async function sendWeeklyAttendanceNotifications() {
  console.log('🔄 Starting weekly attendance notification job...');
  
  try {
    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'student');
    
    if (studentsError) throw studentsError;
    
    console.log(`📊 Processing ${students.length} students...`);
    
    // 🚀 PRODUCTION MODE: Send to all students with <75% attendance
    console.log(`🚀 PRODUCTION MODE: Sending emails to students with <75% attendance`);
    
    let emailsSent = 0;
    let emailsSkipped = 0;
    
    for (const student of students) {
      try {
        console.log(`\n📧 Processing student: ${student.name} (${student.email})`);
        
        // Get all enrollments for this student with class details
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            id,
            class_id,
            classes (
              id,
              name,
              subject_code,
              group_name,
              day_of_week,
              start_time,
              end_time
            )
          `)
          .eq('student_id', student.id);
        
        if (enrollError) throw enrollError;
        
        // Get attendance records for this student
        const { data: attendanceRecords, error: attendError } = await supabase
          .from('attendance')
          .select('class_id, status')
          .eq('student_id', student.id);
        
        if (attendError) throw attendError;
        
        // Group by subject
        const subjectData = {};
        
        enrollments.forEach(enrollment => {
          const cls = enrollment.classes;
          const subjectCode = cls.subject_code || cls.name.split(' ')[0];
          
          if (!subjectData[subjectCode]) {
            subjectData[subjectCode] = {
              subject_code: subjectCode,
              classes: [],
              attended: 0,
              total: 0
            };
          }
          
          subjectData[subjectCode].classes.push(cls);
        });
        
        // Calculate attendance for each subject
        attendanceRecords.forEach(record => {
          // Find which subject this class belongs to
          const enrollment = enrollments.find(e => e.class_id === record.class_id);
          if (enrollment) {
            const cls = enrollment.classes;
            const subjectCode = cls.subject_code || cls.name.split(' ')[0];
            
            if (subjectData[subjectCode]) {
              subjectData[subjectCode].total++;
              if (record.status === 'present') {
                subjectData[subjectCode].attended++;
              }
            }
          }
        });
        
        // Build subject list with metrics
        const subjects = Object.values(subjectData).map(subject => {
          const metrics = calculateAttendanceMetrics(subject.attended, subject.total);
          const upcomingClasses = getUpcomingClassesThisWeek(subject.classes);
          
          return {
            subject_code: subject.subject_code,
            classes_attended: subject.attended,
            total_classes: subject.total,
            attendance_percentage: metrics.attendance_percentage,
            classes_needed_for_75: metrics.classes_needed_for_75,
            upcoming_classes: upcomingClasses
          };
        });
        
        // Filter subjects that need attention (below 80% - buffer above 75%)
        // Filter subjects needing attention (<75% attendance)
        const subjectsNeedingAttention = subjects.filter(s => s.attendance_percentage < 75);
        
        // 🚀 PRODUCTION: Only send if student has subjects below 75%
        if (subjectsNeedingAttention.length === 0) {
          console.log(`✅ ${student.name}: All subjects at or above 75% - skipping email`);
          emailsSkipped++;
          continue;
        }
        
        console.log(`⚠️ ${student.name}: ${subjectsNeedingAttention.length} subject(s) below 75% attendance`);
        
        // Generate AI message
        const currentWeek = new Date().toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
        
        const aiMessage = await generateWeeklyAttendanceAdvice({
          studentName: student.name,
          subjects: subjectsNeedingAttention,
          currentWeek
        });
        
        if (!aiMessage) {
          console.log(`ℹ️ ${student.name}: No message generated - skipping`);
          emailsSkipped++;
          continue;
        }
        
        // Generate email subject
        const emailSubject = generateEmailSubject(subjectsNeedingAttention);
        
        // Send email
        await sendEmailFunction(
          student.email,
          student.name,
          emailSubject,
          aiMessage,
          subjectsNeedingAttention
        );
        
        console.log(`✅ Sent email to ${student.name} (${student.email})`);
        emailsSent++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing student ${student.name}:`, error);
      }
    }
    
    console.log(`\n✅ Weekly notification job completed!`);
    console.log(`📧 Emails sent: ${emailsSent}`);
    console.log(`⏭️ Emails skipped: ${emailsSkipped}`);
    
  } catch (error) {
    console.error('❌ Error in weekly notification job:', error);
  }
}

/**
 * Initialize the weekly scheduler
 * Runs every Monday at 8:00 AM
 */
function initializeWeeklyScheduler() {
  // Schedule: Every Monday at 8:00 AM
  // Cron format: minute hour day month day-of-week
  // '0 8 * * 1' = At 08:00 on Monday
  
  cron.schedule('0 8 * * 1', () => {
    console.log('\n🔔 Weekly attendance notification trigger - Monday 8:00 AM');
    sendWeeklyAttendanceNotifications();
  }, {
    timezone: "Asia/Kolkata" // Adjust to your timezone
  });
  
  console.log('✅ Weekly attendance scheduler initialized');
  console.log('📅 Will run every Monday at 8:00 AM IST');
  console.log('💡 Use POST /api/notifications/send-weekly to trigger manually\n');
}

module.exports = {
  initializeWeeklyScheduler,
  sendWeeklyAttendanceNotifications
};
