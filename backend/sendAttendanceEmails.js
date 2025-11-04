/**
 * Direct script to send attendance emails to students with <75% attendance
 * Run: node sendAttendanceEmails.js
 */

require('dotenv').config();
const supabase = require('./db');
const { generateWeeklyAttendanceAdvice, generateEmailSubject } = require('./services/openaiService');

// Use Gmail if configured, otherwise fall back to Resend
let sendEmailFunction;
if (process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  const { sendWeeklyAttendanceEmailGmail } = require('./services/gmailService');
  sendEmailFunction = sendWeeklyAttendanceEmailGmail;
  console.log('📧 Using Gmail for email delivery\n');
} else {
  const { sendWeeklyAttendanceEmailResend } = require('./services/resendService');
  sendEmailFunction = sendWeeklyAttendanceEmailResend;
  console.log('📧 Using Resend for email delivery\n');
}

async function sendAttendanceEmails() {
  try {
    console.log('\n🚀 Starting attendance email campaign...\n');
    console.log('📧 Target: Students with <75% attendance in any subject\n');

    // Get all students
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'student');

    if (studentsError) throw studentsError;

    console.log(`📊 Found ${students.length} total students\n`);

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const student of students) {
      try {
        console.log(`\n📧 Processing: ${student.name} (${student.email})`);

        // Get enrollments
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
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

        // Get attendance records
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

        // Calculate attendance
        attendanceRecords.forEach(record => {
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
          const percentage = subject.total > 0 ? (subject.attended / subject.total) * 100 : 100;
          
          // Calculate classes needed for 75%
          const classesNeeded = subject.total > 0
            ? Math.max(0, Math.ceil((0.75 * subject.total - subject.attended) / 0.25))
            : 0;

          return {
            name: subject.subject_code,
            attended: subject.attended,
            total: subject.total,
            attendance_percentage: Math.round(percentage * 10) / 10,
            classes_needed_for_75: classesNeeded
          };
        }).filter(s => s.total > 0);

        if (subjects.length === 0) {
          console.log(`   ⏭️ No enrollment data - skipping`);
          emailsSkipped++;
          continue;
        }

        // Filter subjects <75%
        const subjectsNeedingAttention = subjects.filter(s => s.attendance_percentage < 75);

        if (subjectsNeedingAttention.length === 0) {
          console.log(`   ✅ All subjects ≥75% - skipping`);
          emailsSkipped++;
          continue;
        }

        console.log(`   ⚠️ ${subjectsNeedingAttention.length} subject(s) below 75%:`);
        subjectsNeedingAttention.forEach(s => {
          console.log(`      - ${s.name}: ${s.attendance_percentage}% (${s.attended}/${s.total})`);
        });

        // Generate message
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
          console.log(`   ℹ️ No message generated - skipping`);
          emailsSkipped++;
          continue;
        }

        // Generate subject
        const emailSubject = generateEmailSubject(subjectsNeedingAttention);

        // Send email
        const result = await sendEmailFunction(
          student.email,
          student.name,
          emailSubject,
          aiMessage,
          subjectsNeedingAttention
        );

        if (result.success) {
          console.log(`   ✅ Email sent! Message ID: ${result.messageId}`);
          emailsSent++;
        } else {
          console.log(`   ❌ Failed to send: ${result.error}`);
          emailsSkipped++;
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        emailsSkipped++;
      }
    }

    console.log(`\n\n✅ Email campaign completed!`);
    console.log(`📧 Emails sent: ${emailsSent}`);
    console.log(`⏭️ Students skipped: ${emailsSkipped}`);
    console.log(`📊 Total processed: ${students.length}\n`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
sendAttendanceEmails();
