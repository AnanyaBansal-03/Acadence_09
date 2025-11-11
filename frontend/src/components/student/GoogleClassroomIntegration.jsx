import React, { useState, useEffect } from 'react';
import { FiLink2, FiRefreshCw, FiTrash2, FiCheckCircle, FiAlertCircle, FiCalendar, FiBook } from 'react-icons/fi';
import axios from 'axios';
import { API_URL } from '../../lib/apiConfig';

const GoogleClassroomIntegration = () => {
  const [status, setStatus] = useState({
    connected: false,
    loading: true,
    lastSynced: null
  });
  const [syncing, setSyncing] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    upcomingDeadlines: 0
  });

  useEffect(() => {
    checkConnectionStatus();
    if (status.connected) {
      fetchData();
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStatus({
        connected: response.data.connected,
        loading: false,
        lastSynced: response.data.lastSynced
      });
      
      if (response.data.connected) {
        fetchData();
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus({ connected: false, loading: false, lastSynced: null });
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch assignments
      const assignmentsRes = await axios.get(
        `${API_URL}/integrations/google-classroom/assignments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(assignmentsRes.data.assignments || []);

      // Fetch courses
      const coursesRes = await axios.get(
        `${API_URL}/integrations/google-classroom/courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(coursesRes.data.courses || []);

      // Calculate stats
      const pending = assignmentsRes.data.assignments.filter(a => a.status === 'pending').length;
      const upcoming = assignmentsRes.data.assignments.filter(a => {
        const daysUntil = getDaysUntilDue(a.due_date);
        return daysUntil >= 0 && daysUntil <= 7;
      }).length;

      setStats({
        totalCourses: coursesRes.data.courses.length,
        totalAssignments: assignmentsRes.data.assignments.length,
        pendingAssignments: pending,
        upcomingDeadlines: upcoming
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/auth`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      const popup = window.open(
        response.data.authUrl,
        'Google Classroom Authorization',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      // Check for OAuth callback
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          // Check if connection was successful
          setTimeout(() => {
            checkConnectionStatus();
          }, 1000);
        }
      }, 500);
    } catch (error) {
      console.error('Error connecting:', error);
      alert('Failed to connect to Google Classroom');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/integrations/google-classroom/sync`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setStatus(prev => ({
        ...prev,
        lastSynced: new Date().toISOString()
      }));
      
      alert(`Sync completed! ${response.data.coursesCount} courses and ${response.data.assignmentsCount} assignments synced.`);
      fetchData();
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Failed to sync Google Classroom data');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Classroom?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/integrations/google-classroom/disconnect`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setStatus({
        connected: false,
        loading: false,
        lastSynced: null
      });
      setAssignments([]);
      setCourses([]);
      setStats({
        totalCourses: 0,
        totalAssignments: 0,
        pendingAssignments: 0,
        upcomingDeadlines: 0
      });
      
      alert('Google Classroom disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect Google Classroom');
    }
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (status.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
            <FiBook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Google Classroom</h2>
            <p className="text-gray-600 text-sm mt-1">
              Sync your courses, assignments, and due dates
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {status.connected && (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Disconnect"
              >
                <FiTrash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        {status.connected ? (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-medium">Connected</span>
            {status.lastSynced && (
              <span className="text-sm text-gray-600 ml-2">
                • Last synced: {formatDate(status.lastSynced)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg">
            <div className="flex items-center space-x-2 text-gray-600">
              <FiAlertCircle className="w-5 h-5" />
              <span className="font-medium">Not Connected</span>
            </div>
            <button
              onClick={handleConnect}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FiLink2 className="w-4 h-4" />
              <span>Connect Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {status.connected && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-600">{stats.totalCourses}</div>
              <div className="text-sm text-gray-600 mt-1">Courses</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-600">{stats.totalAssignments}</div>
              <div className="text-sm text-gray-600 mt-1">Assignments</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
              <div className="text-3xl font-bold text-orange-600">{stats.pendingAssignments}</div>
              <div className="text-sm text-gray-600 mt-1">Pending</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-600">{stats.upcomingDeadlines}</div>
              <div className="text-sm text-gray-600 mt-1">Due This Week</div>
            </div>
          </div>

          {/* Recent Assignments */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Assignments</h3>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No assignments found. Click "Sync Now" to fetch latest data.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.slice(0, 5).map((assignment) => {
                  const daysUntil = getDaysUntilDue(assignment.due_date);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{assignment.course_name}</p>
                      </div>
                      <div className="text-right ml-4">
                        {assignment.due_date ? (
                          <>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <FiCalendar className="w-4 h-4" />
                              <span>{formatDate(assignment.due_date)}</span>
                            </div>
                            {daysUntil !== null && daysUntil >= 0 && (
                              <div className={`text-xs mt-1 font-medium ${
                                daysUntil <= 2 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {daysUntil === 0 ? 'Due Today' : `${daysUntil} days left`}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">No due date</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Courses */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Courses</h3>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No courses found. Click "Sync Now" to fetch latest data.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.slice(0, 6).map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg"
                  >
                    <h4 className="font-semibold text-gray-800">{course.name}</h4>
                    {course.section && (
                      <p className="text-sm text-gray-600 mt-1">Section: {course.section}</p>
                    )}
                    {course.room && (
                      <p className="text-sm text-gray-600">Room: {course.room}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GoogleClassroomIntegration;

