import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GoogleClassroomIntegration from './GoogleClassroomIntegration';
import { API_URL } from '../../lib/apiConfig';

const StudentAssignments = ({ assignments = [], courses, loading, error }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [externalAssignments, setExternalAssignments] = useState([]);
  const [showGoogleIntegration, setShowGoogleIntegration] = useState(true);
  const [loadingExternal, setLoadingExternal] = useState(false);

  useEffect(() => {
    fetchExternalAssignments();
  }, []);

  const fetchExternalAssignments = async () => {
    setLoadingExternal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/integrations/google-classroom/synced-assignments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setExternalAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Failed to fetch external assignments:', error);
      setExternalAssignments([]);
    } finally {
      setLoadingExternal(false);
    }
  };

  // Combine internal and external assignments
  const allAssignments = [
    ...assignments.map(a => ({ ...a, source: 'internal' })),
    ...externalAssignments.map(a => ({
      id: `external-${a.id}`,
      title: a.title,
      description: a.description,
      due_date: a.due_date,
      class_id: a.course_id,
      class_name: a.course_name,
      submitted: false, // External assignments don't track submission in Acadence
      grade: null,
      source: 'google_classroom',
      external_link: a.link,
      max_points: a.max_points
    }))
  ];

  // Get course name by ID
  const getCourseName = (assignment) => {
    if (assignment.source === 'google_classroom') {
      return assignment.class_name || 'Google Classroom';
    }
    const course = courses.find(c => c.id === assignment.class_id);
    return course?.name || 'Unknown Course';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate days until due
  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status badge
  const getStatusBadge = (assignment) => {
    if (assignment.source === 'google_classroom') {
      const daysUntil = getDaysUntilDue(assignment.due_date);
      if (daysUntil < 0) {
        return { text: 'Google Classroom - Overdue', color: 'bg-red-100 text-red-800 ' };
      } else if (daysUntil === 0) {
        return { text: 'Google Classroom - Due Today', color: 'bg-red-100 text-red-800 ' };
      } else if (daysUntil === 1) {
        return { text: 'Google Classroom - Due Tomorrow', color: 'bg-yellow-100 text-yellow-800 ' };
      } else if (daysUntil <= 3) {
        return { text: `Google Classroom - ${daysUntil}d`, color: 'bg-yellow-100 text-yellow-800 ' };
      } else {
        return { text: `Google Classroom - ${daysUntil}d`, color: 'bg-purple-100 text-purple-800 ' };
      }
    }
    
    if (assignment.submitted) {
      if (assignment.grade) {
        return { text: `Graded: ${assignment.grade}%`, color: 'bg-green-100 text-green-800 ' };
      }
      return { text: 'Submitted', color: 'bg-blue-100 text-blue-800 ' };
    }
    
    const daysUntil = getDaysUntilDue(assignment.due_date);
    if (daysUntil < 0) {
      return { text: 'Overdue', color: 'bg-red-100 text-red-800 ' };
    } else if (daysUntil === 0) {
      return { text: 'Due Today', color: 'bg-red-100 text-red-800 ' };
    } else if (daysUntil === 1) {
      return { text: 'Due Tomorrow', color: 'bg-red-100 text-red-800 ' };
    } else if (daysUntil <= 3) {
      return { text: `Due in ${daysUntil} days`, color: 'bg-yellow-100 text-yellow-800 ' };
    } else {
      return { text: `Due in ${daysUntil} days`, color: 'bg-blue-100 text-blue-800 ' };
    }
  };

  // Filter assignments
  const filterAssignments = (status) => {
    if (status === 'all') return allAssignments;
    if (status === 'pending') return allAssignments.filter(a => !a.submitted);
    if (status === 'submitted') return allAssignments.filter(a => a.submitted && !a.grade);
    if (status === 'graded') return allAssignments.filter(a => a.grade);
    return allAssignments;
  };

  const filteredAssignments = filterAssignments(filterStatus);

  const pendingAssignments = allAssignments.filter(a => !a.submitted);
  const submittedAssignments = allAssignments.filter(a => a.submitted);

  if (loading || loadingExternal) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Assignments</h3>
        <p className="text-red-600 ">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <p className="text-gray-600 mb-6">
        Manage your assignments from Acadence and Google Classroom. Track deadlines and stay on top of all your academic tasks.
      </p>

      {/* Google Classroom Integration Card */}
      {showGoogleIntegration && (
        <div className="mb-6">
          <GoogleClassroomIntegration onAssignmentsSync={fetchExternalAssignments} />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['all', 'pending', 'submitted', 'graded'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 '
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} 
            {status === 'all' && ` (${allAssignments.length})`}
            {status === 'pending' && ` (${pendingAssignments.length})`}
            {status === 'submitted' && ` (${submittedAssignments.filter(a => !a.grade).length})`}
            {status === 'graded' && ` (${submittedAssignments.filter(a => a.grade).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Assignments List */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 ">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 ">
            {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Assignments
          </h3>
          {filteredAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No {filterStatus !== 'all' ? filterStatus : ''} assignments found
            </p>
          ) : (
            <ul className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAssignments.map((assignment) => {
                const statusBadge = getStatusBadge(assignment);
                return (
                  <li key={assignment.id} className="py-3 border-b border-gray-100 last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <span className="text-gray-700 font-medium">
                          {assignment.title}
                        </span>
                        {assignment.source === 'google_classroom' && (
                          <span className="ml-2 text-xs text-purple-600">
                            <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 ">
                      {getCourseName(assignment)}
                    </p>
                    {assignment.due_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {formatDate(assignment.due_date)}
                      </p>
                    )}
                    {assignment.max_points && (
                      <p className="text-xs text-gray-500 mt-1">
                        Points: {assignment.max_points}
                      </p>
                    )}
                    {assignment.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {assignment.description.substring(0, 100)}
                        {assignment.description.length > 100 && '...'}
                      </p>
                    )}
                    {assignment.external_link && (
                      <a
                        href={assignment.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                      >
                        Open in Google Classroom →
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200 ">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 ">
            Assignment Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 ">Total Assignments</p>
                <p className="text-2xl font-bold text-blue-600 ">{allAssignments.length}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Acadence: {assignments.length} | Google: {externalAssignments.length}
                </p>
              </div>
              <svg className="w-10 h-10 text-blue-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 ">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 ">{pendingAssignments.length}</p>
              </div>
              <svg className="w-10 h-10 text-yellow-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 ">Submitted</p>
                <p className="text-2xl font-bold text-green-600 ">{submittedAssignments.length}</p>
              </div>
              <svg className="w-10 h-10 text-green-600 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Note about assignments */}
      {allAssignments.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-800 ">
            ℹ️ No assignments found. Connect your Google Classroom account above or check back later for Acadence assignments.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
