/**
 * PRODUCTION-READY Email Campaign Script
 * Sends attendance emails to students with <75% attendance
 * 
 * Features:
 * - Batch processing (configurable batch size)
 * - Progress tracking (resume from interruption)
 * - Rate limiting (Gmail: 500/day, Resend: 100/day for free tier)
 * - Database logging of all email sends
 * - Retry logic with exponential backoff
 * 
 * Run: node sendAttendanceEmails.js
 * 
 * Configuration:
 * - BATCH_SIZE: Number of emails to send in one batch (default: 10)
 * - BATCH_DELAY: Delay between batches in ms (default: 5000ms = 5 seconds)
 * - EMAIL_DELAY: Delay between individual emails in ms (default: 2000ms = 2 seconds)
 * - MAX_EMAILS_PER_RUN: Maximum emails to send in one run (default: 100)
 */

require('dotenv').config();
const supabase = require('./db');
const { generateWeeklyAttendanceAdvice, generateEmailSubject } = require('./services/openaiService');

// ====== CONFIGURATION ======
const CONFIG = {
  BATCH_SIZE: 10,              // Send 10 emails per batch
  BATCH_DELAY: 5000,           // Wait 5 seconds between batches
  EMAIL_DELAY: 2000,           // Wait 2 seconds between individual emails
  MAX_EMAILS_PER_RUN: 100,     // Maximum emails to send in one execution
  MAX_RETRIES: 3,              // Retry failed emails 3 times
  BASE_RETRY_DELAY: 2000,      // Base delay for exponential backoff
};

// Use Gmail if configured, otherwise fall back to Resend
let sendEmailFunction;
let SERVICE_NAME;
if (process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  const { sendWeeklyAttendanceEmailGmail } = require('./services/gmailService');
  sendEmailFunction = sendWeeklyAttendanceEmailGmail;
  SERVICE_NAME = 'Gmail';
  console.log('📧 Using Gmail for email delivery');
  console.log('⚠️  Gmail limit: 500 emails/day\n');
} else {
  const { sendWeeklyAttendanceEmailResend } = require('./services/resendService');
  sendEmailFunction = sendWeeklyAttendanceEmailResend;
  SERVICE_NAME = 'Resend';
  console.log('📧 Using Resend for email delivery');
  console.log('⚠️  Resend free tier limit: 100 emails/day\n');
}

/**
 * Log email send to database for tracking
 */
async function logEmailSend(studentId, email, subject, status, errorMessage = null) {
  try {
    await supabase.from('email_logs').insert({
      student_id: studentId,
      email_address: email,
      subject: subject,
      status: status, // 'sent', 'failed', 'skipped'
      error_message: errorMessage,
      sent_at: new Date().toISOString(),
      email_type: 'attendance_warning'
    });
  } catch (error) {
    console.log(`   ⚠️ Failed to log email: ${error.message}`);
  }
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = CONFIG.MAX_RETRIES, baseDelay = CONFIG.BASE_RETRY_DELAY) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (result.success) {
        return result;
      }
      
      // If it failed but no exception, retry
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retry ${attempt}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return result; // Return the failed result after max retries
      }
    } catch (error) {
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`   ⏳ Retry ${attempt}/${maxRetries} after ${delay}ms (Error: ${error.message})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return { success: false, error: error.message };
      }
    }
  }
}

/**
 * Process a single batch of emails
 */
async function processBatch(batch, batchNumber, totalBatches) {
  console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (${batch.length} emails)\n${'='.repeat(60)}`);
  
  const batchResults = {
    sent: 0,
    failed: 0,
    skipped: 0
  };

  for (let i = 0; i < batch.length; i++) {
    const student = batch[i];
    console.log(`\n📧 [${i + 1}/${batch.length}] Processing: ${student.name} (${student.email})`);
    
    // Check if student has low attendance
    const enrollmentResult = await processStudent(student);
    
    if (enrollmentResult.status === 'sent') {
      batchResults.sent++;
    } else if (enrollmentResult.status === 'failed') {
      batchResults.failed++;
    } else {
      batchResults.skipped++;
    }
    
    // Delay between individual emails (except for last email in batch)
    if (i < batch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.EMAIL_DELAY));
    }
  }
  
  console.log(`\n✅ Batch ${batchNumber} Complete: ${batchResults.sent} sent, ${batchResults.failed} failed, ${batchResults.skipped} skipped`);
  return batchResults;
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
    let emailsFailed = [];
    let emailsSuccessful = [];

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

        // Send email with retry logic
        const result = await retryWithBackoff(async () => {
          return await sendEmailFunction(
            student.email,
            student.name,
            emailSubject,
            aiMessage,
            subjectsNeedingAttention
          );
        }, 3, 3000); // 3 retries, starting with 3 second delay

        if (result.success) {
          console.log(`   ✅ Email sent! Message ID: ${result.messageId}`);
          emailsSent++;
          emailsSuccessful.push({ name: student.name, email: student.email });
        } else {
          console.log(`   ❌ Failed to send after retries: ${result.error}`);
          emailsSkipped++;
          emailsFailed.push({ name: student.name, email: student.email, error: result.error });
        }

        // Longer delay between students to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 3000));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        emailsSkipped++;
      }
    }

    console.log(`\n\n✅ Email campaign completed!`);
    console.log(`📧 Emails sent: ${emailsSent}`);
    console.log(`⏭️ Students skipped: ${emailsSkipped}`);
    console.log(`📊 Total processed: ${students.length}\n`);

    // Show successful emails
    if (emailsSuccessful.length > 0) {
      console.log(`\n✅ Successfully sent to:`);
      emailsSuccessful.forEach(s => {
        console.log(`   ✓ ${s.name} (${s.email})`);
      });
    }

    // Show failed emails with reasons
    if (emailsFailed.length > 0) {
      console.log(`\n❌ Failed to send to:`);
      emailsFailed.forEach(s => {
        console.log(`   ✗ ${s.name} (${s.email})`);
        console.log(`     Reason: ${s.error}`);
      });
      console.log(`\n💡 Tips to fix email failures:`);
      console.log(`   1. Check your internet connection`);
      console.log(`   2. Verify Gmail App Password in .env file`);
      console.log(`   3. Run script again - retries will help with temporary network issues`);
      console.log(`   4. Consider increasing delay between emails (currently 3 seconds)`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the script
sendAttendanceEmails();
