// 🆓 FREE Message Generation - No API Keys Needed!
// This service generates personalized attendance messages using smart templates

/**
 * Generate personalized weekly attendance recommendation
 * Uses intelligent templates - completely FREE, no API calls!
 * @param {Object} studentData - Student information and attendance data
 * @returns {Promise<string>} Personalized message
 */
async function generateWeeklyAttendanceAdvice(studentData) {
  const { 
    studentName, 
    subjects, 
    currentWeek 
  } = studentData;

  console.log(`📝 Generating personalized message for ${studentName} using FREE template system...`);
  return generateFallbackMessage(studentData);
}

/**
 * Enhanced FREE message generator - No API calls needed!
 * Generates personalized, professional messages based on templates
 */
function generateFallbackMessage(studentData) {
  const { studentName, subjects, currentWeek } = studentData;
  
  const criticalSubjects = subjects.filter(s => s.attendance_percentage < 75);
  const warningSubjects = subjects.filter(s => s.attendance_percentage >= 75 && s.attendance_percentage < 80);
  const goodSubjects = subjects.filter(s => s.attendance_percentage >= 80);
  
  let message = '';
  
  // === EXCELLENT ATTENDANCE (All subjects >= 80%) ===
  if (criticalSubjects.length === 0 && warningSubjects.length === 0 && goodSubjects.length > 0) {
    const greetings = [
      `Excellent work, ${studentName}! 🌟`,
      `Great job, ${studentName}! 👏`,
      `Outstanding, ${studentName}! ⭐`,
      `Well done, ${studentName}! 🎯`
    ];
    
    message += greetings[Math.floor(Math.random() * greetings.length)] + '\n\n';
    message += `Your attendance is exemplary across all your subjects. Here's your current standing:\n\n`;
    
    goodSubjects.slice(0, 3).forEach(subject => {
      message += `📚 **${subject.subject_code}**: ${subject.attendance_percentage.toFixed(1)}% (${subject.classes_attended}/${subject.total_classes} classes)\n`;
    });
    
    message += `\n`;
    message += `Keep up this fantastic consistency! Your dedication to attending classes is setting you up for academic success. Remember, every class you attend is an investment in your future.\n\n`;
    message += `Stay motivated and continue this excellent streak! 💪`;
    
    return message;
  }
  
  // === CRITICAL ATTENDANCE (Below 75%) ===
  if (criticalSubjects.length > 0) {
    message += `Hello ${studentName},\n\n`;
    message += `This is an important attendance update for the week of ${currentWeek}.\n\n`;
    message += `⚠️ **URGENT ATTENTION REQUIRED**\n\n`;
    message += `The following subject${criticalSubjects.length > 1 ? 's are' : ' is'} currently **below the 75% attendance threshold**:\n\n`;
    
    criticalSubjects.forEach(subject => {
      message += `🚨 **${subject.subject_code}**\n`;
      message += `   • Current Attendance: ${subject.attendance_percentage.toFixed(1)}%\n`;
      message += `   • Classes Attended: ${subject.classes_attended} out of ${subject.total_classes}\n`;
      
      if (subject.classes_needed_for_75 > 0) {
        message += `   • **Action Required**: Attend the next ${subject.classes_needed_for_75} class${subject.classes_needed_for_75 > 1 ? 'es' : ''} without fail\n`;
      }
      
      if (subject.upcoming_classes && subject.upcoming_classes.length > 0) {
        message += `   • **Upcoming This Week**:\n`;
        subject.upcoming_classes.forEach(cls => {
          message += `     - ${cls.day_of_week} at ${cls.start_time}\n`;
        });
      }
      message += '\n';
    });
    
    message += `⚡ **What This Means:**\n`;
    message += `Attendance below 75% may result in detention or being barred from exams. Please prioritize attending all upcoming classes to avoid academic consequences.\n\n`;
    message += `💡 **Your Action Plan:**\n`;
    message += `1. Mark your calendar for all upcoming classes\n`;
    message += `2. Set reminders 30 minutes before each class\n`;
    message += `3. Attend every single class this week - no exceptions!\n\n`;
    message += `You've got this! Each class you attend brings you closer to the 75% threshold. We're here to support your success! 💪`;
    
    return message;
  }
  
  // === WARNING LEVEL (75-80%) ===
  if (warningSubjects.length > 0) {
    message += `Hi ${studentName},\n\n`;
    message += `Here's your weekly attendance check-in for ${currentWeek}.\n\n`;
    message += `⚠️ **Heads Up - Stay On Track!**\n\n`;
    message += `While you're currently above the 75% minimum, these subjects need your attention:\n\n`;
    
    warningSubjects.forEach(subject => {
      message += `📊 **${subject.subject_code}**\n`;
      message += `   • Current Attendance: ${subject.attendance_percentage.toFixed(1)}% (Just ${(80 - subject.attendance_percentage).toFixed(1)}% away from comfort zone)\n`;
      message += `   • Classes: ${subject.classes_attended}/${subject.total_classes}\n`;
      
      if (subject.upcoming_classes && subject.upcoming_classes.length > 0) {
        message += `   • **Don't Miss**: `;
        message += subject.upcoming_classes.map(c => `${c.day_of_week} ${c.start_time}`).join(', ');
        message += '\n';
      }
      message += '\n';
    });
    
    message += `🎯 **Stay Proactive:**\n`;
    message += `Missing just 1-2 more classes could drop you below 75%. Attend consistently this week to build a buffer and secure your academic standing.\n\n`;
    message += `Remember: Consistent attendance = Better understanding = Better grades! Keep up the good work! 📚`;
    
    return message;
  }
  
  // Fallback (shouldn't reach here)
  return `Hi ${studentName},\n\nYour attendance is being monitored. Please maintain regular attendance in all your classes.\n\nBest regards,\nAcadence Team`;
}

/**
 * Generate subject for weekly email based on severity
 */
function generateEmailSubject(subjects) {
  const critical = subjects.filter(s => s.attendance_percentage < 75);
  const warning = subjects.filter(s => s.attendance_percentage >= 75 && s.attendance_percentage < 80);
  
  if (critical.length > 0) {
    return `🚨 URGENT: Attendance Alert - ${critical.length} Subject${critical.length > 1 ? 's' : ''} Below 75%`;
  } else if (warning.length > 0) {
    return `⚠️ Weekly Attendance Reminder - Stay on Track!`;
  }
  return `📊 Your Weekly Attendance Update`;
}

module.exports = {
  generateWeeklyAttendanceAdvice,
  generateEmailSubject
};
