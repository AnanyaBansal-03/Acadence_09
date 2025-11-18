import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../lib/apiConfig';

const GoogleClassroomIntegration = ({ onAssignmentsSync }) => {
  const [integrationStatus, setIntegrationStatus] = useState({
    connected: false,
    google_email: '',
    google_name: '',
    last_synced: null
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showCourses, setShowCourses] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  useEffect(() => {
    checkIntegrationStatus();
    
    // Check URL parameters for connection status
    const params = new URLSearchParams(window.location.search);
    if (params.get('integration') === 'connected') {
      setConnectionMessage('✅ Successfully connected to Google Classroom!');
      setTimeout(() => setConnectionMessage(''), 5000);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error') === 'connection_failed') {
      setConnectionMessage('❌ Failed to connect. Please try again.');
      setTimeout(() => setConnectionMessage(''), 5000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/status`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setIntegrationStatus(response.data);
    } catch (error) {
      console.error('Failed to check integration status:', error);
      // Don't show error to user, just keep as disconnected
      setIntegrationStatus({
        connected: false,
        google_email: '',
        google_name: '',
        last_synced: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again to connect Google Classroom.');
        return;
      }

      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/connect`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const popup = window.open(
        response.data.authUrl,
        'Google Classroom Connect',
        `width=${width},height=${height},left=${left},top=${top},noopener=no`
      );

      if (!popup) {
        alert('Popup blocked! Please allow popups for this site.');
        return;
      }

      // Use message event instead of polling to avoid COOP issues
      const messageHandler = (event) => {
        // Verify origin for security
        if (event.origin === window.location.origin || event.data === 'google-auth-complete') {
          window.removeEventListener('message', messageHandler);
          checkIntegrationStatus();
        }
      };
      
      window.addEventListener('message', messageHandler);

      // Fallback: Check every 2 seconds with try-catch to handle COOP
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            window.removeEventListener('message', messageHandler);
            // Recheck status after popup closes
            setTimeout(() => {
              checkIntegrationStatus();
            }, 1000);
          }
        } catch (e) {
          // Ignore COOP errors, rely on message event
        }
      }, 2000);

      // Clear interval after 5 minutes to prevent memory leak
      setTimeout(() => {
        clearInterval(checkPopup);
        window.removeEventListener('message', messageHandler);
      }, 300000);
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log out and log back in.');
      } else {
        alert('Failed to connect to Google Classroom. Please try again.');
      }
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/assignments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setConnectionMessage(`✅ Successfully synced ${response.data.count} assignments from Google Classroom!`);
      setTimeout(() => setConnectionMessage(''), 5000);
      
      // Update last synced time
      await checkIntegrationStatus();
      
      // Notify parent component to refresh assignments
      if (onAssignmentsSync) {
        onAssignmentsSync();
      }
    } catch (error) {
      console.error('Failed to sync assignments:', error);
      alert('Failed to sync assignments. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/courses`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setCourses(response.data.courses);
      setShowCourses(true);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      alert('Failed to fetch courses. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Classroom?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/integrations/google-classroom/disconnect`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setIntegrationStatus({
        connected: false,
        google_email: '',
        google_name: '',
        last_synced: null
      });
      setCourses([]);
      setShowCourses(false);
      
      setConnectionMessage('✅ Disconnected from Google Classroom successfully!');
      setTimeout(() => setConnectionMessage(''), 3000);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-6 border-2 border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Google Classroom</h3>
            <p className="text-sm text-gray-600">Sync your assignments & courses</p>
          </div>
        </div>
        
        {/* Connection Status Badge */}
        {integrationStatus.connected ? (
          <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full border-2 border-green-300">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-semibold text-sm">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full border-2 border-gray-300">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 font-semibold text-sm">Not Connected</span>
          </div>
        )}
      </div>

      {/* Connection Message */}
      {connectionMessage && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 animate-fade-in">
          {connectionMessage}
        </div>
      )}

      {!integrationStatus.connected ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-gray-700 text-sm mb-2">
              📚 Connect your Google Classroom to automatically import all your assignments, courses, and deadlines into Acadence!
            </p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li>View all assignments in one place</li>
              <li>Never miss a deadline</li>
              <li>Auto-sync with Google Classroom</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
            </svg>
            Connect Google Classroom
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✅</span>
              <span className="font-semibold text-green-800">Connected Successfully</span>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Account:</strong> {integrationStatus.google_name}</p>
              <p><strong>Email:</strong> {integrationStatus.google_email}</p>
              {integrationStatus.last_synced && (
                <p><strong>Last Synced:</strong> {new Date(integrationStatus.last_synced).toLocaleString()}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </>
              )}
            </button>

            <button
              onClick={handleFetchCourses}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View Courses
            </button>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors text-sm"
          >
            Disconnect
          </button>

          {showCourses && courses.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 max-h-64 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-gray-800">Your Courses ({courses.length})</h4>
                <button
                  onClick={() => setShowCourses(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-800">{course.name}</p>
                    {course.section && (
                      <p className="text-sm text-gray-600">Section: {course.section}</p>
                    )}
                    {course.descriptionHeading && (
                      <p className="text-xs text-gray-500 mt-1">{course.descriptionHeading}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoogleClassroomIntegration;
