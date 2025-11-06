import React, { useState } from 'react';

const StudentAssignments = ({ assignments = [], courses, loading, error }) => {
  const [filterStatus, setFilterStatus] = useState('all');

  // Get course name by ID
  const getCourseName = (classId) => {
    const course = courses.find(c => c.id === classId);
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
    if (status === 'all') return assignments;
    if (status === 'pending') return assignments.filter(a => !a.submitted);
    if (status === 'submitted') return assignments.filter(a => a.submitted && !a.grade);
    if (status === 'graded') return assignments.filter(a => a.grade);
    return assignments;
  };

  const filteredAssignments = filterAssignments(filterStatus);

  const pendingAssignments = assignments.filter(a => !a.submitted);
  const submittedAssignments = assignments.filter(a => a.submitted);

  if (loading) {
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
        Manage your assignments, track deadlines, and submit your work. Stay on top of all your academic tasks.
      </p>

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
            {status === 'all' && ` (${assignments.length})`}
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
                      <span className="text-gray-700 font-medium">
                        {assignment.title}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 ">
                      {getCourseName(assignment.class_id)}
                    </p>
                    {assignment.due_date && (
                      <p className="text-xs text-gray-400 mt-1">
                        Due: {formatDate(assignment.due_date)}
                      </p>
                    )}
                    {assignment.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {assignment.description}
                      </p>
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
                <p className="text-2xl font-bold text-blue-600 ">{assignments.length}</p>
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
      {assignments.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <p className="text-blue-800 ">
            ℹ️ No assignments have been posted yet. Check back later or contact your teachers for more information.
          </p>
        </div>
      )}
    </div>
  );
};

export default StudentAssignments;
