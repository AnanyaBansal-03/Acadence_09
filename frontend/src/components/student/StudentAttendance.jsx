import React, { useState } from 'react';
import QRScanner from './QRScanner';
import { supabase } from '../../lib/supabaseClient';

const StudentAttendance = ({ attendance, courses, loading, error }) => {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showScanner, setShowScanner] = useState(false);

  // Calculate attendance percentage for each course
  const calculateAttendanceStats = () => {
    const stats = {};
    
    courses.forEach(course => {
      const courseAttendance = attendance.filter(record => record.class_id === course.id);
      
      // Count unique dates instead of total records (to avoid counting duplicates)
      const uniqueDates = new Set(
        courseAttendance.map(record => new Date(record.date).toISOString().split('T')[0])
      );
      const totalDays = uniqueDates.size;
      
      const presentCount = courseAttendance.filter(record => record.status === 'present').length;
      const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
      
      stats[course.id] = {
        courseName: course.name,
        total: totalDays,
        present: presentCount,
        absent: totalDays - presentCount,
        percentage
      };
    });
    
    return stats;
  };

  const attendanceStats = calculateAttendanceStats();

  // Get recent attendance records
  const getRecentRecords = () => {
    return attendance
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };

  const recentRecords = getRecentRecords();

  // Filter records by selected course
  const filteredRecords = selectedCourse === 'all'
    ? recentRecords
    : recentRecords.filter(record => record.class_id === parseInt(selectedCourse));

  // Get course name by ID
  const getCourseName = (classId) => {
    const course = courses.find(c => c.id === classId);
    return course?.name || 'Unknown Course';
  };

  // Get progress bar color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-600';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  // Format date
  const formatDate = (dateString) => {
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
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Attendance</h3>
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Track your class attendance records, view history, and check your attendance percentage for each course.
      </p>

      {/* QR Scan Section - ALWAYS VISIBLE AT TOP */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 shadow-md border-2 border-blue-200 dark:border-blue-700 mb-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">📱 Mark Your Attendance</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Point your camera at the QR code displayed by your teacher to mark attendance
          </p>
          <button
            onClick={() => setShowScanner(true)}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-lg rounded-lg hover:from-green-600 hover:to-green-700 font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎯 Scan QR Code
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Attendance Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            Attendance Summary
          </h3>
          {courses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No courses enrolled yet
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => {
                const stats = attendanceStats[course.id];
                if (!stats || stats.total === 0) return null;
                
                return (
                  <div key={course.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {course.name}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stats.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div
                        className={`${getProgressColor(stats.percentage)} h-2 rounded-full transition-all`}
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{stats.present} marked present</span>
                      <span>{stats.absent} not marked</span>
                      <span>{stats.total} days</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Records */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Recent Records
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
          
          {filteredRecords.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No attendance records found
            </p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {filteredRecords.map((record, index) => (
                <li
                  key={`${record.class_id}-${record.date}-${index}`}
                  className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium block">
                      {getCourseName(record.class_id)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(record.date)}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      record.status === 'present'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : record.status === 'absent'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showScanner && (
        <QRScanner
          onScan={async (result, err) => {
            setShowScanner(false);
            if (!result) {
              alert('No QR data found or camera access denied');
              return;
            }

            // Parse payload
            let payload = result;
            if (typeof result === 'string') {
              try { payload = JSON.parse(result); } catch(e) { payload = { raw: result }; }
            }

            const token = localStorage.getItem('token');
            if (!token) {
              alert('Not logged in. Please login first.');
              return;
            }

            const classId = payload.classId || payload.class_id || null;
            if (!classId) {
              alert('QR missing classId');
              return;
            }

            try {
              const response = await fetch('http://localhost:5000/api/student/mark-attendance', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  classId: parseInt(classId),
                  date: payload.date || new Date().toISOString()
                })
              });

              const data = await response.json();

              if (!response.ok) {
                alert(data.message || 'Failed to mark attendance');
                return;
              }

              alert('✅ Attendance marked successfully!');
              // Refresh page to show updated attendance
              window.location.reload();
            } catch (e) {
              console.error('Failed to mark attendance via QR:', e);
              alert('Failed to mark attendance. Please try again or contact teacher.');
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default StudentAttendance;