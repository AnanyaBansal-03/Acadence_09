import React, { useState } from 'react';

const StudentCourses = ({ courses, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');

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
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Manage all your courses and class schedules. View upcoming classes, track progress, and access course materials.
      </p>

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
      </div>

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

export default StudentCourses;