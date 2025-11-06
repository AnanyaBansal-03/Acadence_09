// Utility function to determine class status based on current day and time

export const getClassStatus = (classOrCourse) => {
  const now = new Date();
  const currentDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Get sessions - handle both course format (with sessions array) and single class format
  const sessions = classOrCourse.sessions || [{
    day_of_week: classOrCourse.day_of_week,
    start_time: classOrCourse.start_time || classOrCourse.schedule_time,
    duration_hours: classOrCourse.duration_hours
  }];
  
  // Check each session
  for (const session of sessions) {
    const sessionDay = session.day_of_week?.toLowerCase();
    const startTime = session.start_time;
    const duration = session.duration_hours || 1;
    
    if (!sessionDay || !startTime) continue;
    
    // Parse start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTimeMinutes = startHours * 60 + startMinutes;
    
    // Calculate end time in minutes
    const endTimeMinutes = startTimeMinutes + (duration * 60);
    
    // Calculate end time as string
    const endHours = Math.floor(endTimeMinutes / 60) % 24;
    const endMins = endTimeMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    
    // Check if this session is happening now
    if (sessionDay === currentDay) {
      if (currentMinutes >= startTimeMinutes && currentMinutes < endTimeMinutes) {
        return {
          status: 'ongoing',
          label: 'Ongoing Now',
          color: 'green',
          cssClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
      } else if (currentMinutes >= endTimeMinutes) {
        return {
          status: 'completed',
          label: 'Completed',
          color: 'gray',
          cssClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        };
      }
    }
  }
  
  // Not happening now - check if it's upcoming today
  for (const session of sessions) {
    const sessionDay = session.day_of_week?.toLowerCase();
    const startTime = session.start_time;
    
    if (!sessionDay || !startTime) continue;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startTimeMinutes = startHours * 60 + startMinutes;
    
    if (sessionDay === currentDay && currentMinutes < startTimeMinutes) {
      return {
        status: 'upcoming_today',
        label: 'Today',
        color: 'blue',
        cssClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    }
  }
  
  // Default: Scheduled (upcoming on another day)
  return {
    status: 'scheduled',
    label: 'Scheduled',
    color: 'blue',
    cssClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  };
};

// Calculate end time from start time and duration
export const calculateEndTime = (startTime, durationHours) => {
  if (!startTime || !durationHours) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + (durationHours * 60);
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};
