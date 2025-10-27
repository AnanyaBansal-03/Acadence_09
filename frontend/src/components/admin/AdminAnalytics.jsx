import React, { useState, useEffect } from 'react';

const AdminAnalytics = ({ users = [], classes = [], enrollments = [], attendance = [] }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    totalClasses: 0,
    totalEnrollments: 0,
    totalAttendanceRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0
  });

  useEffect(() => {
    calculateStats();
  }, [users, classes, enrollments, attendance]);

  const calculateStats = () => {
    try {
      const totalUsers = users?.length || 0;
      const totalStudents = users?.filter(u => u.role === 'student').length || 0;
      const totalTeachers = users?.filter(u => u.role === 'teacher').length || 0;
      const totalAdmins = users?.filter(u => u.role === 'admin').length || 0;

      const totalClasses = classes?.length || 0;
      const totalEnrollments = enrollments?.length || 0;

      const totalAttendanceRecords = attendance?.length || 0;
      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
      const lateCount = attendance?.filter(a => a.status === 'late').length || 0;

      setStats({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalClasses,
        totalEnrollments,
        totalAttendanceRecords,
        presentCount,
        absentCount,
        lateCount
      });
    } catch (err) {
      console.error('Error calculating analytics:', err);
    }
  };

  const attendancePercentage = stats.totalAttendanceRecords > 0
    ? Math.round((stats.presentCount / stats.totalAttendanceRecords) * 100)
    : 0;

  return (
    <div className="w-full max-w-6xl mx-auto pt-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analytics & Reports
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            View system analytics, generate comprehensive reports, and monitor institutional performance.
          </p>
        </div>

        {/* User Statistics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">User Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-4xl font-bold text-blue-700 mt-2">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">All registered users</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-4xl font-bold text-green-700 mt-2">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Active learners</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teachers</p>
                  <p className="text-4xl font-bold text-purple-700 mt-2">{stats.totalTeachers}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Course instructors</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-4xl font-bold text-red-700 mt-2">{stats.totalAdmins}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">System administrators</p>
            </div>
          </div>
        </div>

        {/* Class & Enrollment Statistics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Class Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-4xl font-bold text-blue-700 mt-2">{stats.totalClasses}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Active courses</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                  <p className="text-4xl font-bold text-green-700 mt-2">{stats.totalEnrollments}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Student-class pairs</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Class Size</p>
                  <p className="text-4xl font-bold text-purple-700 mt-2">
                    {stats.totalClasses > 0 ? Math.round(stats.totalEnrollments / stats.totalClasses) : 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Students per class</p>
            </div>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Attendance Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-4xl font-bold text-blue-700 mt-2">{stats.totalAttendanceRecords}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Attendance entries</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Present</p>
                  <p className="text-4xl font-bold text-green-700 mt-2">{stats.presentCount}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">{attendancePercentage}% attendance rate</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Absent</p>
                  <p className="text-4xl font-bold text-red-700 mt-2">{stats.absentCount}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">No show records</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Late</p>
                  <p className="text-4xl font-bold text-yellow-700 mt-2">{stats.lateCount}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Late arrivals</p>
            </div>
          </div>
        </div>

        {/* Attendance Breakdown Chart */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Attendance Breakdown</h3>
          <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Present</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.presentCount} ({stats.totalAttendanceRecords > 0 ? Math.round((stats.presentCount / stats.totalAttendanceRecords) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${stats.totalAttendanceRecords > 0 ? (stats.presentCount / stats.totalAttendanceRecords) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Absent</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.absentCount} ({stats.totalAttendanceRecords > 0 ? Math.round((stats.absentCount / stats.totalAttendanceRecords) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full"
                    style={{ width: `${stats.totalAttendanceRecords > 0 ? (stats.absentCount / stats.totalAttendanceRecords) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Late</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.lateCount} ({stats.totalAttendanceRecords > 0 ? Math.round((stats.lateCount / stats.totalAttendanceRecords) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full"
                    style={{ width: `${stats.totalAttendanceRecords > 0 ? (stats.lateCount / stats.totalAttendanceRecords) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </div>    </div>
  );
};

export default AdminAnalytics;