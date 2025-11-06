import React, { useState } from 'react';
import { getClassStatus } from '../../lib/classStatus';

// Timetable View Component
const TimetableView = ({ courses }) => {
  // Time slots configuration
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
    '15:00', '16:00', '17:00', '18:00'
  ];
  
  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday'
  };

  // Check if a time slot is within a class's time range
  const isTimeInRange = (slotTime, startTime, endTime) => {
    if (!slotTime || !startTime || !endTime) return false;
    
    const slotHour = parseInt(slotTime.split(':')[0]);
    const startHour = parseInt(startTime.split(':')[0]);
    const startMin = parseInt(startTime.split(':')[1] || '0');
    const endHour = parseInt(endTime.split(':')[0]);
    const endMin = parseInt(endTime.split(':')[1] || '0');
    
    const slotMinutes = slotHour * 60;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime || !durationHours) return null;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (durationHours * 60);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Group classes by day and time for timetable view
  const getTimetableData = () => {
    const timetable = {};
    
    daysOrder.forEach(day => {
      timetable[day] = {};
      timeSlots.forEach(slot => {
        timetable[day][slot] = [];
      });
    });

    // Expand subjects into their sessions for timetable display
    courses.forEach(course => {
      if (course.sessions && course.sessions.length > 0) {
        // This is a subject with multiple sessions
        course.sessions.forEach(session => {
          const startTime = session.start_time;
          const day = session.day_of_week?.toLowerCase();
          
          if (startTime && day && daysOrder.includes(day)) {
            const endTime = calculateEndTime(startTime, session.duration_hours || 1);
            
            if (endTime) {
              timeSlots.forEach(slot => {
                if (isTimeInRange(slot, startTime, endTime)) {
                  timetable[day][slot].push({
                    id: session.id,
                    name: course.name || course.subject_code, // Use subject name
                    subject_code: course.subject_code,
                    group_name: course.group_name,
                    teacher_id: course.teacher_id,
                    start_time: startTime,
                    day_of_week: session.day_of_week,
                    duration_hours: session.duration_hours,
                    isFirstSlot: slot === startTime.substring(0, 5),
                    calculatedEndTime: endTime
                  });
                }
              });
            }
          }
        });
      } else {
        // Legacy: single class session
        const startTime = course.start_time;
        if (startTime && course.day_of_week) {
          const day = course.day_of_week.toLowerCase();
          const endTime = calculateEndTime(startTime, course.duration_hours || 1);
          
          if (endTime) {
            timeSlots.forEach(slot => {
              if (isTimeInRange(slot, startTime, endTime)) {
                timetable[day][slot].push({
                  ...course,
                  isFirstSlot: slot === startTime.substring(0, 5),
                  calculatedEndTime: endTime
                });
              }
            });
          }
        }
      }
    });

    return timetable;
  };

  const timetableData = getTimetableData();

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border border-gray-200">
      <h3 className="text-lg md:text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <span>📅</span> Your Weekly Timetable
      </h3>
      {/* Mobile: Full width scroll | Desktop: Normal table */}
      <div className="overflow-x-auto md:overflow-x-visible">
        <table className="w-full border-collapse min-w-[800px] md:min-w-0">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-purple-600">
              <th className="border border-gray-300 px-3 py-3 text-left text-sm font-semibold text-white sticky left-0 bg-gradient-to-r from-blue-500 to-blue-600 md:static">
                Time
              </th>
              {daysOrder.map(day => (
                <th key={day} className="border border-gray-300 px-3 py-3 text-center text-sm font-semibold text-white">
                  {dayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="hover:bg-gray-50:bg-gray-700/50">
                    <td className="border border-gray-300 px-3 py-3 font-medium text-gray-700 bg-gray-50 sticky left-0 md:static">
                      {time}
                    </td>
                {daysOrder.map(day => {
                  const classesAtTime = timetableData[day][time] || [];
                  return (
                    <td key={day} className="border border-gray-300 px-2 py-2">
                      {classesAtTime.length > 0 ? (
                        <div className="space-y-2">
                          {classesAtTime.map(course => {
                            // Only show full details in the first slot
                            if (course.isFirstSlot) {
                              return (
                                <div key={course.id} className="bg-gradient-to-br from-blue-100 to-purple-100 border-l-4 border-blue-500 p-3 rounded-lg shadow-sm">
                                  <div className="font-semibold text-gray-900 text-sm mb-1">
                                    {course.name}
                                  </div>
                                  {course.group_name && (
                                    <div className="mb-1">
                                      <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs font-bold">
                                        {course.group_name}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-gray-600 text-xs">
                                    🕐 {course.start_time} - {course.calculatedEndTime}
                                  </div>
                                </div>
                              );
                            } else {
                              // Show continuation indicator in subsequent slots
                              return (
                                <div key={course.id} className="bg-gradient-to-br from-blue-50 to-purple-50 border-l-4 border-blue-400 p-2 rounded-lg shadow-sm">
                                  <div className="text-gray-700 text-xs text-center font-medium">
                                    ↑ {course.name}
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs text-center py-4">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Timetable Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Classes</p>
          <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">This Week</p>
          <p className="text-2xl font-bold text-green-600">
            {courses.filter(c => c.day_of_week).length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">My Group</p>
          <p className="text-2xl font-bold text-purple-600">
            {courses.length > 0 && courses[0].group_name ? courses[0].group_name : '-'}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Avg Hours/Day</p>
          <p className="text-2xl font-bold text-orange-600">
            {courses.length > 0 ? Math.round((courses.reduce((sum, c) => sum + (c.duration_hours || 1), 0) / 5) * 10) / 10 : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

const StudentCourses = ({ courses, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timetable'

  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get upcoming classes (next 7 days)
  const getUpcomingClasses = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const allSessions = [];
    
    courses.forEach(course => {
      if (course.sessions && course.sessions.length > 0) {
        // Handle courses with multiple sessions
        course.sessions.forEach(session => {
          if (session.day_of_week) {
            allSessions.push({
              ...course,
              day_of_week: session.day_of_week,
              start_time: session.start_time,
              duration_hours: session.duration_hours,
              session_id: session.id
            });
          }
        });
      } else if (course.day_of_week) {
        // Handle legacy single session courses
        allSessions.push(course);
      }
    });
    
    return allSessions
      .map(course => {
        const courseDayMap = {
          'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
          'thursday': 4, 'friday': 5, 'saturday': 6
        };
        const courseDay = courseDayMap[course.day_of_week.toLowerCase()];
        let daysUntil = courseDay - dayOfWeek;
        if (daysUntil < 0) daysUntil += 7;
        
        return { ...course, daysUntil };
      })
      .sort((a, b) => {
        // Sort by days until, then by start time
        if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
        return (a.start_time || '').localeCompare(b.start_time || '');
      })
      .slice(0, 5);
  };

  const upcomingClasses = getUpcomingClasses();

  // Get day label
  const getDayLabel = (daysUntil) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return days[targetDate.getDay()];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Courses</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Manage all your courses and class schedules. View upcoming classes, track progress, and access course materials.
        </p>
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('timetable')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'timetable'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600'
            }`}
          >
            📅 Timetable
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {viewMode === 'timetable' ? (
        <TimetableView courses={courses} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Courses */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Enrolled Subjects ({filteredCourses.length})
          </h3>
          {filteredCourses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 'No subjects match your search' : 'No subjects enrolled yet'}
            </p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCourses.map((course) => {
                const classStatus = getClassStatus(course);
                return (
                  <li key={course.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-700 font-bold text-lg">
                          {course.subject_code || course.name}
                        </span>
                        {course.group_name && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs font-bold">
                            {course.group_name}
                          </span>
                        )}
                      </div>
                      {course.sessions && course.sessions.length > 0 && (
                        <div className="text-xs text-gray-500 mt-2 space-y-1">
                          <div className="font-semibold text-gray-600">
                            📅 {course.sessions.length} session{course.sessions.length !== 1 ? 's' : ''} per week:
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {course.sessions.map((session, idx) => (
                              <div key={idx} className="text-blue-600">
                                • {session.day_of_week} at {session.start_time}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ml-2 ${classStatus.cssClass}`}>
                      {classStatus.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Upcoming Classes
          </h3>
          {upcomingClasses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No upcoming classes scheduled
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingClasses.map((course, index) => (
                <li key={`${course.id}-${course.session_id || index}`} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-800 font-semibold">
                        {course.subject_code || course.name}
                      </span>
                      {course.group_name && (
                        <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs font-bold">
                          {course.group_name}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      📅 {getDayLabel(course.daysUntil)} • 🕐 {course.start_time || 'TBA'}
                    </div>
                  </div>
                  {course.daysUntil === 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      Today
                    </span>
                  )}
                  {course.daysUntil === 1 && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      Tomorrow
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default StudentCourses;
