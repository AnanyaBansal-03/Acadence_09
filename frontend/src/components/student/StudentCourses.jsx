import React, { useState } from 'react';

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
    
    return courses
      .filter(course => course.day_of_week)
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
      .sort((a, b) => a.daysUntil - b.daysUntil)
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
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Courses</h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-300">
          Manage all your courses and class schedules. View upcoming classes, track progress, and access course materials.
        </p>
        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('timetable')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'timetable'
                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow'
                : 'text-gray-600 dark:text-gray-300'
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
            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Enrolled Courses ({filteredCourses.length})
          </h3>
          {filteredCourses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {searchTerm ? 'No courses match your search' : 'No courses enrolled yet'}
            </p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCourses.map((course) => (
                <li key={course.id} className="flex justify-between items-start py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <span className="text-gray-700 dark:text-gray-300 font-medium block">
                      {course.name}
                    </span>
                    {course.description && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 block mt-1">
                        {course.description}
                      </span>
                    )}
                    {course.day_of_week && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 block mt-1">
                        {course.day_of_week}
                      </span>
                    )}
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full dark:bg-blue-900 dark:text-blue-200 ml-2">
                    Ongoing
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Upcoming Classes
          </h3>
          {upcomingClasses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No upcoming classes scheduled
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingClasses.map((course) => (
                <li key={course.id} className="flex justify-between items-center py-2">
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium block">
                      {getDayLabel(course.daysUntil)}, {course.time}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {course.name}
                    </span>
                  </div>
                  {course.daysUntil === 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900 dark:text-green-200">
                      Today
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

      {/* Upcoming Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Upcoming This Week</h3>
        {upcomingClasses.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No upcoming classes scheduled</p>
        ) : (
          <ul className="space-y-3">
            {upcomingClasses.map((course) => (
              <li key={course.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{course.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getDayLabel(course.daysUntil)} • {course.schedule_time || 'Time TBA'}
                  </p>
                </div>
                {course.daysUntil === 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full dark:bg-green-900 dark:text-green-200">
                    Today
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300">Enroll in New Course</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">Browse available courses</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-purple-700 dark:text-purple-300">Course Materials</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400">Access study resources</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Timetable View Component
const TimetableView = ({ courses }) => {
  const dayLabels = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  };

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Helper to check if a time slot falls within a class period
  const isTimeInRange = (slotTime, startTime, endTime) => {
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

    courses.forEach(course => {
      const startTime = course.start_time || course.schedule_time;
      if (startTime && course.day_of_week) {
        const day = course.day_of_week.toLowerCase();
        const endTime = calculateEndTime(startTime, course.duration_hours || 1);
        
        if (endTime) {
          // Add the course to all time slots it spans
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
    });

    return timetable;
  };

  const timetableData = getTimetableData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <span>📅</span> Your Weekly Timetable
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-purple-600">
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-left text-sm font-semibold text-white sticky left-0 bg-gradient-to-r from-blue-500 to-blue-600">
                Time
              </th>
              {daysOrder.map(day => (
                <th key={day} className="border border-gray-300 dark:border-gray-600 px-3 py-3 text-center text-sm font-semibold text-white">
                  {dayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-3 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 sticky left-0">
                  {time}
                </td>
                {daysOrder.map(day => {
                  const classesAtTime = timetableData[day][time] || [];
                  return (
                    <td key={day} className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                      {classesAtTime.length > 0 ? (
                        <div className="space-y-2">
                          {classesAtTime.map(course => {
                            // Only show full details in the first slot
                            if (course.isFirstSlot) {
                              return (
                                <div key={course.id} className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded-lg shadow-sm">
                                  <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                                    {course.name}
                                  </div>
                                  {course.group_name && (
                                    <div className="mb-1">
                                      <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs font-bold">
                                        {course.group_name}
                                      </span>
                                    </div>
                                  )}
                                  <div className="text-gray-600 dark:text-gray-300 text-xs">
                                    🕐 {course.start_time || course.schedule_time} - {course.calculatedEndTime}
                                  </div>
                                </div>
                              );
                            } else {
                              // Show continuation indicator in subsequent slots
                              return (
                                <div key={course.id} className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 border-l-4 border-blue-400 dark:border-blue-500 p-2 rounded-lg shadow-sm">
                                  <div className="text-gray-700 dark:text-gray-300 text-xs text-center font-medium">
                                    ↑ {course.name}
                                  </div>
                                </div>
                              );
                            }
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">-</div>
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
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Classes</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{courses.length}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">This Week</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {courses.filter(c => c.day_of_week).length}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">My Group</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {courses.length > 0 && courses[0].group_name ? courses[0].group_name : '-'}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hours/Day</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {courses.length > 0 ? Math.round((courses.reduce((sum, c) => sum + (c.duration_hours || 1), 0) / 5) * 10) / 10 : 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentCourses;