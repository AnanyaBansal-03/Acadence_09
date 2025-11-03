import React, { useState } from 'react';

const StudentGrades = ({ grades = [], courses, loading, error }) => {
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Debug: Log the grades data
  React.useEffect(() => {
    console.log('StudentGrades - Received grades:', grades);
    console.log('StudentGrades - Received courses:', courses);
  }, [grades, courses]);

  // Get course name by ID
  const getCourseName = (classId) => {
    const course = courses.find(c => c.id === classId);
    return course?.name || 'Unknown Course';
  };

  // Calculate average for all mark sections
  const calculateSectionAverage = (grades, section) => {
    const validGrades = grades.filter(g => g[section] !== null && g[section] !== undefined);
    if (validGrades.length === 0) return null;
    const total = validGrades.reduce((sum, g) => sum + parseFloat(g[section]), 0);
    return (total / validGrades.length).toFixed(2);
  };

  // Calculate grade statistics per course including all sections
  const calculateGradeStats = () => {
    const stats = {};
    
    courses.forEach(course => {
      const courseGrades = grades.filter(g => g.class_id === course.id);
      if (courseGrades.length === 0) {
        stats[course.id] = null;
        return;
      }

      // Calculate averages for each section
      const st1Avg = calculateSectionAverage(courseGrades, 'st1');
      const st2Avg = calculateSectionAverage(courseGrades, 'st2');
      const evalAvg = calculateSectionAverage(courseGrades, 'evaluation');
      const endTermAvg = calculateSectionAverage(courseGrades, 'end_term');

      // Calculate overall average from available sections
      const availableAverages = [st1Avg, st2Avg, evalAvg, endTermAvg].filter(avg => avg !== null);
      const overallAverage = availableAverages.length > 0
        ? (availableAverages.reduce((sum, avg) => sum + parseFloat(avg), 0) / availableAverages.length).toFixed(2)
        : 0;
      
      stats[course.id] = {
        courseName: course.name,
        st1: st1Avg,
        st2: st2Avg,
        evaluation: evalAvg,
        end_term: endTermAvg,
        average: parseFloat(overallAverage),
        letter: getLetterGrade(overallAverage),
        hasSections: availableAverages.length > 0
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
        {/* Current Grades by Course - Show All Sections */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Current Grades by Section
          </h3>
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No courses enrolled yet
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const stats = gradeStats[course.id];
                if (!stats || !stats.hasSections) {
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
                  <div key={course.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
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
                    
                    {/* Individual Section Marks */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">ST1</p>
                        <p className={`text-lg font-bold ${stats.st1 ? getGradeColor(stats.st1) : 'text-gray-400'}`}>
                          {stats.st1 ? `${stats.st1}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">ST2</p>
                        <p className={`text-lg font-bold ${stats.st2 ? getGradeColor(stats.st2) : 'text-gray-400'}`}>
                          {stats.st2 ? `${stats.st2}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Evaluation</p>
                        <p className={`text-lg font-bold ${stats.evaluation ? getGradeColor(stats.evaluation) : 'text-gray-400'}`}>
                          {stats.evaluation ? `${stats.evaluation}%` : '-'}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded">
                        <p className="text-xs text-gray-500 dark:text-gray-400">End Term</p>
                        <p className={`text-lg font-bold ${stats.end_term ? getGradeColor(stats.end_term) : 'text-gray-400'}`}>
                          {stats.end_term ? `${stats.end_term}%` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Marks Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Detailed Section Marks
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Course</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">ST1</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">ST2</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Evaluation</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">End Term</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((grade, index) => (
                    <tr
                      key={`${grade.class_id}-${index}`}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {grade.class_name || getCourseName(grade.class_id)}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {grade.st1 !== null && grade.st1 !== undefined ? (
                          <span className={`font-bold ${getGradeColor(grade.st1)}`}>
                            {grade.st1}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {grade.st2 !== null && grade.st2 !== undefined ? (
                          <span className={`font-bold ${getGradeColor(grade.st2)}`}>
                            {grade.st2}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {grade.evaluation !== null && grade.evaluation !== undefined ? (
                          <span className={`font-bold ${getGradeColor(grade.evaluation)}`}>
                            {grade.evaluation}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">
                        {grade.end_term !== null && grade.end_term !== undefined ? (
                          <span className={`font-bold ${getGradeColor(grade.end_term)}`}>
                            {grade.end_term}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
