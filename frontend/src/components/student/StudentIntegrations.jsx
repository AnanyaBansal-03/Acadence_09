import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/apiConfig';

const StudentIntegrations = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [googleStatus, setGoogleStatus] = useState({ connected: false });
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchGoogleClassroomStatus();
    fetchSyncedAssignments();
    
    // Check for connection success from OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      alert('✅ Successfully connected to Google Classroom!');
      handleSync();
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      alert('❌ Failed to connect to Google Classroom. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchGoogleClassroomStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/integrations/google-classroom/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setGoogleStatus(data);
    } catch (error) {
      console.error('Error fetching Google Classroom status:', error);
    }
  };

  const fetchSyncedAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/integrations/google-classroom/synced-assignments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (error) {
      console.error('Error fetching synced assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/integrations/google-classroom/connect`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        alert('Failed to generate authorization URL');
      }
    } catch (error) {
      console.error('Error connecting to Google Classroom:', error);
      alert('Failed to connect to Google Classroom');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Classroom?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/integrations/google-classroom/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Disconnected from Google Classroom');
        setGoogleStatus({ connected: false });
        setAssignments([]);
      } else {
        alert('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/integrations/google-classroom/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}`);
        fetchSyncedAssignments();
        fetchGoogleClassroomStatus();
      } else {
        alert(`⚠️ ${data.message}`);
      }
    } catch (error) {
      console.error('Error syncing assignments:', error);
      alert('Failed to sync assignments');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mb-8">
      <p className="text-gray-600 mb-6">
        Connect your Google Classroom account to sync assignments and submissions automatically.
      </p>

      {/* Google Classroom Integration Card */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Google Classroom</h3>
              <p className="text-sm text-gray-500">
                {googleStatus.connected ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>
          <div>
            {googleStatus.connected ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                Disabled
              </span>
            )}
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">
                {googleStatus.connected ? '✅ Google Classroom Connected' : '📚 Connect Google Classroom'}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {googleStatus.connected 
                  ? 'Your Google Classroom is connected. Click "Sync Now" to import latest assignments.'
                  : 'Click "Connect" below to sync your Google Classroom assignments, courses, and submissions automatically.'
                }
              </p>
              {googleStatus.lastSync && (
                <p className="text-xs text-blue-500 mt-2">
                  Last synced: {formatDate(googleStatus.lastSync)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!googleStatus.connected ? (
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect to Google Classroom
            </button>
          ) : (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  syncing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync Now
                  </>
                )}
              </button>
              
              <button
                onClick={handleDisconnect}
                className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Synced Assignments */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Synced Assignments</h4>
          {assignments.length > 0 && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">No synced assignments yet</p>
            <p className="text-gray-400 text-sm mt-2">
              {googleStatus.connected 
                ? 'Click "Sync Now" to import your Google Classroom assignments'
                : 'Connect to Google Classroom to sync your assignments'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800">{assignment.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{assignment.course_name}</p>
                      {assignment.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{assignment.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3">
                        {assignment.due_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Due: {formatDate(assignment.due_date)}
                          </span>
                        )}
                        {assignment.max_points > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            {assignment.max_points} points
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4">
                  {assignment.alternate_link && (
                    <a
                      href={assignment.alternate_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      Open in Classroom
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    assignment.state === 'PUBLISHED' 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {assignment.state || 'ACTIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentIntegrations;
