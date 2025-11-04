const supabase = require('../db');
const { sendAttendanceEmail } = require('./emailService');

/**
 * Calculate attendance percentage for each subject for a student
 * @param {number} studentId - The student's ID
 * @returns {Promise<Array>} Array of subject attendance stats
 */
async function calculateStudentAttendance(studentId) {
  try {
    // Get all enrollments for the student
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        class_id,
        classes (
          id,
          name,
          subject_code,
          group_name
        )
      `)
      .eq('student_id', studentId);

    if (enrollError) throw enrollError;

    // Group enrollments by subject_code + group_name
    const subjectGroups = {};
    enrollments.forEach(enrollment => {
      const classInfo = enrollment.classes;
      if (!classInfo) return;
      
      const key = `${classInfo.subject_code}_${classInfo.group_name}`;
      if (!subjectGroups[key]) {
        subjectGroups[key] = {
          subject_code: classInfo.subject_code,
          subject_name: classInfo.name,
          group_name: classInfo.group_name,
          classIds: []
        };
      }
      subjectGroups[key].classIds.push(classInfo.id);
    });

    // Calculate attendance for each subject group
    const attendanceStats = [];
    
    for (const [key, subject] of Object.entries(subjectGroups)) {
      // Get all attendance records for this subject's class sessions
      const { data: attendanceRecords, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId)
        .in('class_id', subject.classIds);

      if (attError) {
        console.error(`Error fetching attendance for ${subject.subject_code}:`, attError);
        continue;
      }

      // Count unique dates to avoid duplicates
      const uniqueDates = new Set(
        attendanceRecords.map(record => new Date(record.date).toISOString().split('T')[0])
      );
      const totalDays = uniqueDates.size;
      
      const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
      const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      attendanceStats.push({
        subject_code: subject.subject_code,
        subject_name: subject.subject_name,
        group_name: subject.group_name,
        totalDays,
        presentDays: presentCount,
        absentDays: totalDays - presentCount,
        percentage
      });
    }

    return attendanceStats;
  } catch (error) {
    console.error('Error calculating attendance:', error);
    throw error;
  }
}

/**
 * Categorize attendance risk level
 * @param {number} percentage - Attendance percentage
 * @returns {Object} Risk level info
 */
function categorizeRisk(percentage) {
  if (percentage < 75) {
    return { level: 'critical', color: 'red', priority: 1 };
  } else if (percentage < 85) {
    return { level: 'warning', color: 'orange', priority: 2 };
  } else if (percentage < 95) {
    return { level: 'good', color: 'yellow', priority: 3 };
  } else {
    return { level: 'excellent', color: 'green', priority: 4 };
  }
}

/**
 * Generate AI-powered personalized notification message
 * @param {Object} params - Message parameters
 * @returns {Promise<string>} Generated message
 */
async function generateAIMessage({ studentName, subjectCode, subjectName, percentage, riskLevel, absentDays, totalDays }) {
  // For now, using template-based messages
  // You can integrate OpenAI/Gemini API here
  
  const templates = {
    critical: [
      `⚠️ URGENT: ${studentName}, your ${subjectCode} attendance is at ${percentage}%! You've missed ${absentDays} out of ${totalDays} classes. Attend the next ${subjectCode} class or risk detention. This is critical! 🚨`,
      `🚨 ATTENTION ${studentName.toUpperCase()}: Your ${subjectCode} attendance has dropped to ${percentage}%. You're below the 75% threshold! Immediate action required - don't miss your next ${subjectName} class! ⚠️`,
      `⛔ DETENTION ALERT: ${studentName}, you have only ${percentage}% attendance in ${subjectCode}. Missing ${absentDays} classes is serious. Attend every upcoming ${subjectName} session to avoid academic consequences!`
    ],
    warning: [
      `⚠️ Hey ${studentName}, your ${subjectCode} attendance is at ${percentage}%. You're at risk! Try to attend all upcoming ${subjectName} classes to stay above 85%. You can do it! 💪`,
      `📉 ${studentName}, your ${subjectCode} attendance (${percentage}%) needs attention. Missing more classes could put you below 75%. Stay consistent with ${subjectName}!`,
      `🔔 Heads up ${studentName}! Your ${subjectCode} attendance is ${percentage}%. A few more absences and you'll hit the danger zone. Keep attending ${subjectName} classes regularly!`
    ],
    good: [
      `✅ Good job ${studentName}! Your ${subjectCode} attendance is at ${percentage}%. You're doing well, but don't get too comfortable. Keep it up! 👍`,
      `👏 ${studentName}, you have ${percentage}% attendance in ${subjectCode}. You're in a safe zone! Maintain this consistency in ${subjectName}.`,
      `🎯 Nice work ${studentName}! ${percentage}% attendance in ${subjectCode} is solid. Just keep attending your ${subjectName} classes regularly.`
    ],
    excellent: [
      `🌟 AMAZING ${studentName}! Your ${subjectCode} attendance is ${percentage}% - absolutely stellar! You're attendance-risk-free. Feel free to take a breather, you've earned it! 🎉`,
      `💯 OUTSTANDING! ${studentName}, you have ${percentage}% attendance in ${subjectCode}. You're crushing it! No worries about detention - you're completely safe. Keep being awesome! ⭐`,
      `🏆 PERFECT ATTENDANCE VIBES! ${studentName}, ${percentage}% in ${subjectCode} is exceptional! You can relax - you're way above requirements. Enjoy your well-deserved peace of mind! 😌`
    ]
  };

  const messageArray = templates[riskLevel] || templates.good;
  const randomIndex = Math.floor(Math.random() * messageArray.length);
  return messageArray[randomIndex];
}

/**
 * Generate AI-powered notification using external AI API (OpenAI/Gemini)
 * Uncomment and configure when you have API key
 */
/*
async function generateAIMessageWithAPI({ studentName, subjectCode, subjectName, percentage, riskLevel, absentDays, totalDays }) {
  const { Configuration, OpenAIApi } = require('openai');
  
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // Add to .env file
  });
  const openai = new OpenAIApi(configuration);

  const prompts = {
    critical: `Generate a strict, urgent notification for student ${studentName} whose ${subjectCode} (${subjectName}) attendance is ${percentage}% (${absentDays}/${totalDays} absent). Warn about detention risk. Be firm but professional. Keep it under 150 characters.`,
    warning: `Generate an encouraging but cautionary notification for student ${studentName} whose ${subjectCode} attendance is ${percentage}%. Motivate them to improve. Keep it friendly but serious. Under 150 characters.`,
    good: `Generate a positive notification for student ${studentName} whose ${subjectCode} attendance is ${percentage}%. Acknowledge their good work. Keep it brief and encouraging. Under 150 characters.`,
    excellent: `Generate a congratulatory, lenient notification for student ${studentName} whose ${subjectCode} attendance is ${percentage}%. Tell them they're risk-free and can relax. Be fun and friendly. Under 150 characters.`
  };

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful, empathetic academic assistant who sends personalized attendance notifications to students." },
        { role: "user", content: prompts[riskLevel] }
      ],
      temperature: 0.8,
      max_tokens: 100
    });

    return completion.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI API error:', error);
    // Fallback to template
    return generateAIMessage({ studentName, subjectCode, subjectName, percentage, riskLevel, absentDays, totalDays });
  }
}
*/

/**
 * Send email notification for attendance alert
 * @param {Object} params - Notification parameters including student email
 * @returns {Promise<Object>} Email send result
 */
async function sendEmailNotification({ studentEmail, studentName, subjectCode, subjectName, percentage, riskLevel, absentDays, totalDays }) {
  try {
    // Only send emails for critical and warning cases (to avoid spam)
    if (riskLevel !== 'critical' && riskLevel !== 'warning') {
      console.log(`📧 Skipping email for ${riskLevel} level (${subjectCode})`);
      return { success: false, reason: 'Not critical/warning' };
    }

    // Generate message
    const message = await generateAIMessage({
      studentName,
      subjectCode,
      subjectName,
      percentage,
      riskLevel,
      absentDays,
      totalDays
    });

    // Send email
    const result = await sendAttendanceEmail({
      to: studentEmail,
      studentName,
      subjectCode,
      subjectName,
      percentage,
      type: riskLevel,
      message,
      absentDays,
      totalDays
    });

    return result;
  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  calculateStudentAttendance,
  categorizeRisk,
  generateAIMessage,
  sendEmailNotification
};
