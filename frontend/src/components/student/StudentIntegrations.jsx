import React, { useState, useEffect } from 'react';
import { FiLink, FiZap, FiGitBranch, FiVideo, FiFileText, FiPlus } from 'react-icons/fi';
import GoogleClassroomIntegration from './GoogleClassroomIntegration';
import axios from 'axios';
import { API_URL } from '../../lib/apiConfig';

const StudentIntegrations = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Available integrations (future expansion)
  const availableIntegrations = [
    {
      id: 'google_classroom',
      name: 'Google Classroom',
      description: 'Sync courses, assignments, and due dates',
      icon: '📚',
      color: 'from-green-400 to-green-600',
      status: 'available',
      component: GoogleClassroomIntegration
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Track repositories, commits, and projects',
      icon: '🐙',
      color: 'from-gray-700 to-gray-900',
      status: 'coming_soon',
      component: null
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'View meeting schedule and recordings',
      icon: '📹',
      color: 'from-blue-400 to-blue-600',
      status: 'coming_soon',
      component: null
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Access notes, pages, and to-dos',
      icon: '📝',
      color: 'from-purple-400 to-purple-600',
      status: 'coming_soon',
      component: null
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Meetings, chat, and assignments',
      icon: '💼',
      color: 'from-indigo-400 to-indigo-600',
      status: 'coming_soon',
      component: null
    },
    {
      id: 'moodle',
      name: 'Moodle',
      description: 'Assignments, grades, and announcements',
      icon: '🎓',
      color: 'from-orange-400 to-orange-600',
      status: 'coming_soon',
      component: null
    }
  ];

  useEffect(() => {
    fetchConnectedIntegrations();
  }, []);

  const fetchConnectedIntegrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/integrations/all`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setConnectedIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationStatus = (integrationId) => {
    return connectedIntegrations.some(i => i.platform === integrationId && i.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Connected Apps</h1>
              <p className="text-gray-600 mt-1">
                Connect your favorite tools and see everything in one place
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('google_classroom')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'google_classroom'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Google Classroom
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' ? (
          <div>
            {/* Connected Integrations Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Connections</h2>
              {connectedIntegrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiLink className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Connections Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Connect your first app to start syncing your academic data
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {connectedIntegrations.map((integration) => {
                    const integrationInfo = availableIntegrations.find(
                      (i) => i.id === integration.platform
                    );
                    return (
                      <div
                        key={integration.platform}
                        className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl"
                      >
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-3xl">{integrationInfo?.icon || '🔗'}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {integrationInfo?.name || integration.platform}
                            </h3>
                            <p className="text-xs text-gray-600">
                              Last synced:{' '}
                              {integration.last_synced
                                ? new Date(integration.last_synced).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Available Integrations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Integrations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableIntegrations.map((integration) => {
                  const isConnected = getIntegrationStatus(integration.id);
                  const isAvailable = integration.status === 'available';

                  return (
                    <div
                      key={integration.id}
                      className={`relative p-6 rounded-xl border-2 transition-all ${
                        isConnected
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      {/* Status Badge */}
                      {isConnected && (
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                            Connected
                          </div>
                        </div>
                      )}
                      {!isAvailable && !isConnected && (
                        <div className="absolute top-4 right-4">
                          <div className="px-3 py-1 bg-gray-400 text-white text-xs font-medium rounded-full">
                            Coming Soon
                          </div>
                        </div>
                      )}

                      <div className="flex items-start space-x-4 mb-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center text-2xl`}
                        >
                          {integration.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800">{integration.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                        </div>
                      </div>

                      {isAvailable && !isConnected && (
                        <button
                          onClick={() => setActiveTab(integration.id)}
                          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Connect Now
                        </button>
                      )}

                      {isConnected && (
                        <button
                          onClick={() => setActiveTab(integration.id)}
                          className="w-full mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                        >
                          Manage
                        </button>
                      )}

                      {!isAvailable && !isConnected && (
                        <button
                          disabled
                          className="w-full mt-4 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed font-medium"
                        >
                          Coming Soon
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">Why Connect Your Apps?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiZap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">One Central Hub</h3>
                    <p className="text-blue-100 text-sm">
                      See all your assignments, deadlines, and activities from multiple platforms in
                      one place
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiGitBranch className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Auto-Sync</h3>
                    <p className="text-blue-100 text-sm">
                      Your data stays up-to-date automatically. No manual entry needed
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiFileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Smart Insights</h3>
                    <p className="text-blue-100 text-sm">
                      Get AI-powered insights about your academic progress across all platforms
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'google_classroom' ? (
          <GoogleClassroomIntegration />
        ) : null}
      </div>
    </div>
  );
};

export default StudentIntegrations;

