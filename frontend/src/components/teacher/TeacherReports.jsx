import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TeacherReports = ({ dashboardData }) => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('week');
  const classChartRef = useRef(null);
  const attendanceChartRef = useRef(null);
  const classChartInstance = useRef(null);
  const attendanceChartInstance = useRef(null);

  // Initialize charts
  useEffect(() => {
    if (classChartRef.current && dashboardData) {
      // Destroy existing chart if it exists
      if (classChartInstance.current) {
        classChartInstance.current.destroy();
      }

      const ctx = classChartRef.current.getContext('2d');
      classChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dashboardData.classSchedule.labels,
          datasets: [{
            label: 'Classes per Day',
            data: dashboardData.classSchedule.data,
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }

    return () => {
      if (classChartInstance.current) {
        classChartInstance.current.destroy();
      }
    };
  }, [dashboardData]);

  useEffect(() => {
    if (attendanceChartRef.current && dashboardData) {
      // Destroy existing chart if it exists
      if (attendanceChartInstance.current) {
        attendanceChartInstance.current.destroy();
      }

      const ctx = attendanceChartRef.current.getContext('2d');
      attendanceChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: dashboardData.attendanceStats.labels,
          datasets: [{
            data: dashboardData.attendanceStats.data,
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(251, 191, 36, 0.8)'
            ],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }

    return () => {
      if (attendanceChartInstance.current) {
        attendanceChartInstance.current.destroy();
      }
    };
  }, [dashboardData]);

  const generateReport = () => {
    alert(`Generating ${reportType} report for ${dateRange}...`);
    // Implement actual report generation logic here
  };

  const exportReport = (format) => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  return (
    <div className="w-full max-w-6xl mx-auto pt-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Generate detailed analytics and insights. Create comprehensive reports on student performance and class progress.
          </p>
        </div>

        {/* Report Controls */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="overview">Overview</option>
              <option value="attendance">Attendance Report</option>
              <option value="performance">Performance Report</option>
              <option value="class">Class-wise Report</option>
              <option value="student">Student-wise Report</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="semester">This Semester</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.allClasses?.length || 0}
            </div>
            <div className="text-sm text-blue-700">Total Classes</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.allStudents?.length || 0}
            </div>
            <div className="text-sm text-green-700">Total Students</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData?.attendanceStats?.data?.[0] || 0}%
            </div>
            <div className="text-sm text-purple-700">Avg Attendance</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData?.allStudents?.length > 0
                ? Math.round(dashboardData.allStudents.reduce((sum, s) => sum + (s.score || 0), 0) / dashboardData.allStudents.length)
                : 0}%
            </div>
            <div className="text-sm text-orange-700">Avg Performance</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Class Distribution Chart */}
          <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
            <h4 className="font-semibold mb-4 text-gray-800">Class Distribution</h4>
            <div className="h-64">
              <canvas ref={classChartRef}></canvas>
            </div>
            <div className="mt-4 space-y-2">
              {dashboardData?.classSchedule?.labels.map((day, index) => (
                <div key={day} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{day}:</span>
                  <span className="font-semibold text-blue-600">
                    {dashboardData.classSchedule.data[index]} classes
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Statistics Chart */}
          <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
            <h4 className="font-semibold mb-4 text-gray-800">Attendance Overview</h4>
            <div className="h-64">
              <canvas ref={attendanceChartRef}></canvas>
            </div>
            <div className="mt-4 space-y-2">
              {dashboardData?.attendanceStats?.labels.map((label, index) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{label}:</span>
                  <span className="font-semibold text-blue-600">
                    {dashboardData.attendanceStats.data[index]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Analysis Table */}
        <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50 mb-6">
          <h4 className="font-semibold mb-4 text-gray-800">Class Performance Analysis</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3">Class Name</th>
                  <th className="pb-3">Students</th>
                  <th className="pb-3">Avg Attendance</th>
                  <th className="pb-3">Avg Score</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dashboardData?.allClasses && dashboardData.allClasses.length > 0 ? (
                  dashboardData.allClasses.map((cls, index) => {
                    // Calculate real class statistics
                    const classStudents = dashboardData.allStudents.filter(s => s.classId === cls.id);
                    const avgAttendance = classStudents.length > 0
                      ? Math.round(classStudents.reduce((sum, s) => sum + (s.attendance || 0), 0) / classStudents.length)
                      : 0;
                    const avgScore = classStudents.length > 0
                      ? Math.round(classStudents.reduce((sum, s) => sum + (s.score || 0), 0) / classStudents.length)
                      : 0;
                    
                    return (
                      <tr key={cls.id || index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-gray-800 font-medium">{cls.name}</td>
                        <td className="py-3 text-gray-600">{cls.enrolled_count || 0}</td>
                        <td className="py-3 text-gray-600">{avgAttendance}%</td>
                        <td className="py-3 text-gray-600">{avgScore}%</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            cls.enrolled_count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {cls.enrolled_count > 0 ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">
                      No class data available for analysis.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
          <h4 className="font-semibold mb-4 text-gray-800">Export Report</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <span>📄</span> Export as PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center gap-2"
            >
              <span>📊</span> Export as Excel
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              <span>📋</span> Export as CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
            >
              <span>🖨️</span> Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
