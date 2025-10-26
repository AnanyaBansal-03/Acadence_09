import React, { useState } from 'react';

const StudentGrades = ({ grades = [], courses, loading, error }) => {
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Get course name by ID
  const getCourseName = (classId) => {
    const course = courses.find(c => c.id === classId);
    return course?.name || 'Unknown Course';
  };

  // Calculate grade statistics per course
  const calculateGradeStats = () => {
    const stats = {};
    
    courses.forEach(course => {
      const courseGrades = grades.filter(g => g.class_id === course.id);
      if (courseGrades.length === 0) {
        stats[course.id] = null;
        return;
      }
      
      const total = courseGrades.reduce((sum, g) => sum + (g.score || 0), 0);
      const average = courseGrades.length > 0 ? Math.round(total / courseGrades.length) : 0;
      const highest = Math.max(...courseGrades.map(g => g.score || 0));
      const lowest = Math.min(...courseGrades.map(g => g.score || 0));
      
      stats[course.id] = {
        courseName: course.name,
        average,
        highest,
        lowest,
        count: courseGrades.length,
        letter: getLetterGrade(average)
      };
    });
    
    return stats;
  };

  // Get letter grade
  const getLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Get grade color
  const getGradeColor = (score) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Calculate overall GPA
  const calculateOverallGPA = () => {
    const gradeStats = calculateGradeStats();
    const validCourses = Object.values(gradeStats).filter(stat => stat !== null);
    
    if (validCourses.length === 0) return 0;
    
    const totalAverage = validCourses.reduce((sum, stat) => sum + stat.average, 0);
    return (totalAverage / validCourses.length).toFixed(2);
  };

  const gradeStats = calculateGradeStats();
  const overallAverage = calculateOverallGPA();

  // Filter grades by selected course
  const filteredGrades = selectedCourse === 'all'
    ? grades
    : grades.filter(g => g.class_id === parseInt(selectedCourse));

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Grades</h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        View your academic performance, grades for all courses, and track your progress throughout the semester.
      </p>

      {/* Overall Performance */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold mb-1">Overall Performance</h3>
            <p className="text-blue-100">Your current academic standing</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{overallAverage}%</p>
            <p className="text-blue-100">Average Score</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Grades by Course */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Current Grades
          </h3>
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No courses enrolled yet
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const stats = gradeStats[course.id];
                if (!stats) {
                  return (
                    <div key={course.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {course.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          No grades yet
                        </span>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={course.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {course.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-bold ${getGradeColor(stats.average)}`}>
                          {stats.letter}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {stats.average}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>High: {stats.highest}%</span>
                      <span>Low: {stats.lowest}%</span>
                      <span>{stats.count} grades</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Grade History
            </h3>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          
          {filteredGrades.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No grades recorded yet
            </p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {filteredGrades.map((grade, index) => (
                <li
                  key={`${grade.class_id}-${grade.assignment_name}-${index}`}
                  className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium block">
                        {grade.assignment_name || 'Assignment'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getCourseName(grade.class_id)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${getGradeColor(grade.score)}`}>
                        {grade.score}%
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {getLetterGrade(grade.score)}
                      </span>
                    </div>
                  </div>
                  {grade.graded_date && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Graded: {formatDate(grade.graded_date)}
                    </p>
                  )}
                  {grade.feedback && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                      "{grade.feedback}"
                    </p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300">View Detailed Report</h4>
              <p className="text-sm text-blue-600 dark:text-blue-400">Comprehensive grade analysis</p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-purple-700 dark:text-purple-300">Download Transcript</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400">Export your grades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Note about grades */}
      {grades.length === 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mt-6">
          <p className="text-blue-800 dark:text-blue-200">
            ℹ️ No grades have been posted yet. Grades will appear here once your teachers grade your assignments.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;
