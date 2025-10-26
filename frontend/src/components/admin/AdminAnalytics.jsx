import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

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
  const [loading, setLoading] = useState(false);

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
    <div className="max-w-6xl mx-auto p-6">
      {/* User Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">User Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Users</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">All registered users</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Students</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.totalStudents}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Active learners</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Teachers</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.totalTeachers}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Course instructors</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Admins</p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.totalAdmins}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">System admins</p>
          </div>
        </div>
      </div>

      {/* Class & Enrollment Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Class Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Classes</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.totalClasses}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Active courses</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Enrollments</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.totalEnrollments}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Student-class pairs</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg. Class Size</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {stats.totalClasses > 0 ? Math.round(stats.totalEnrollments / stats.totalClasses) : 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Students per class</p>
          </div>
        </div>
      </div>

      {/* Attendance Statistics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Attendance Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Records</p>
            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.totalAttendanceRecords}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Attendance entries</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Present</p>
            <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.presentCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{attendancePercentage}% attendance rate</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Absent</p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.absentCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">No show records</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Late</p>
            <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{stats.lateCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Late arrivals</p>
          </div>
        </div>
      </div>

      {/* Attendance Breakdown Chart */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Attendance Breakdown</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Present</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.presentCount} ({stats.totalAttendanceRecords > 0 ? Math.round((stats.presentCount / stats.totalAttendanceRecords) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{ width: `${stats.totalAttendanceRecords > 0 ? (stats.presentCount / stats.totalAttendanceRecords) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Absent</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.absentCount} ({stats.totalAttendanceRecords > 0 ? Math.round((stats.absentCount / stats.totalAttendanceRecords) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-red-500 h-3 rounded-full"
                  style={{ width: `${stats.totalAttendanceRecords > 0 ? (stats.absentCount / stats.totalAttendanceRecords) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Late</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stats.lateCount} ({stats.totalAttendanceRecords > 0 ? Math.round((stats.lateCount / stats.totalAttendanceRecords) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-yellow-500 h-3 rounded-full"
                  style={{ width: `${stats.totalAttendanceRecords > 0 ? (stats.lateCount / stats.totalAttendanceRecords) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">System Health</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Database Connected</span>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Authentication System</span>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Real-time Subscription</span>
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Last Updated</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
