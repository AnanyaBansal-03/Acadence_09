import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/apiConfig';

const AdminGroups = ({ initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [users, setUsers] = useState(initialUsers);
  const [classes, setClasses] = useState(initialClasses);
  const [selectedGroup, setSelectedGroup] = useState('G1');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  const availableGroups = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];

  // Update local state when props change
  useEffect(() => {
    console.log('AdminGroups - Received users:', initialUsers.length);
    setUsers(initialUsers);
    setClasses(initialClasses);
  }, [initialUsers, initialClasses]);

  // Get students by group
  const getStudentsByGroup = (group) => {
    return users.filter(u => u.role === 'student' && u.group_name === group);
  };

  // Get classes by group
  const getClassesByGroup = (group) => {
    return classes.filter(c => c.group_name === group);
  };

  // Get students without group
  const getUnassignedStudents = () => {
    return users.filter(u => u.role === 'student' && !u.group_name);
  };

  // Filter students based on search
  const filteredUnassignedStudents = getUnassignedStudents().filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStudentSelection = (userId) => {
    setSelectedStudents(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredUnassignedStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredUnassignedStudents.map(u => u.id));
    }
  };

  const handleBulkAssignment = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/users/bulk-group`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userIds: selectedStudents,
          group_name: selectedGroup
        })
      });

      if (!response.ok) throw new Error('Failed to assign groups');

      const result = await response.json();
      setSelectedStudents([]);
      
      // Refresh data before showing success message
      if (onDataRefresh) {
        await onDataRefresh();
      }
      
      alert(`✅ Successfully assigned ${result.updated} students to group ${selectedGroup}`);
    } catch (err) {
      console.error('Error assigning groups:', err);
      alert('❌ Failed to assign groups: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromGroup = async (userId) => {
    if (!window.confirm('Remove this student from their group?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/users/${userId}/group`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ group_name: null })
      });

      if (!response.ok) throw new Error('Failed to remove from group');

      // Refresh data before showing success message
      if (onDataRefresh) {
        await onDataRefresh();
      }
      
      alert('✅ Student removed from group');
    } catch (err) {
      console.error('Error removing from group:', err);
      alert('❌ Failed to remove from group: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">Group Management</h2>
                <p className="text-gray-600">Organize students into groups and manage group assignments</p>
              </div>
            </div>
            <button
              onClick={() => onDataRefresh && onDataRefresh()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Group Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {availableGroups.map(group => {
            const studentCount = getStudentsByGroup(group).length;
            const classCount = getClassesByGroup(group).length;
            return (
              <div key={group} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-purple-600">{group}</span>
                  <span className="text-xs text-gray-500">{classCount} classes</span>
                </div>
                <p className="text-sm text-gray-600">{studentCount} students</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Unassigned Students */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Unassigned Students ({getUnassignedStudents().length})
              </h3>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg bg-white text-gray-900"
            />

            {/* Bulk Assignment Controls */}
            {selectedStudents.length > 0 && (
              <div className="mb-4 p-4 bg-purple-100 rounded-lg border border-purple-300">
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-medium text-gray-700">
                    {selectedStudents.length} student(s) selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                  >
                    {availableGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleBulkAssignment}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : 'Assign to Group'}
                  </button>
                </div>
              </div>
            )}

            {/* Students List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredUnassignedStudents.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredUnassignedStudents.length && filteredUnassignedStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-600">Select All</span>
                  </div>
                  {filteredUnassignedStudents.map(student => (
                    <div key={student.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {getUnassignedStudents().length === 0 ? (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p>All students are assigned to groups!</p>
                    </>
                  ) : (
                    <p>No students match your search</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Group Details */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Group Details</h3>
            
            {/* Group Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {availableGroups.map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedGroup === group
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-purple-100:bg-purple-900/30'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Selected Group Info */}
            <div className="space-y-4">
              {/* Classes in this group */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  Classes ({getClassesByGroup(selectedGroup).length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {getClassesByGroup(selectedGroup).length > 0 ? (
                    getClassesByGroup(selectedGroup).map(cls => (
                      <div key={cls.id} className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-gray-800">{cls.name}</p>
                        <p className="text-xs text-gray-600">{cls.day_of_week} • {cls.schedule_time}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No classes assigned to {selectedGroup}</p>
                  )}
                </div>
              </div>

              {/* Students in this group */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                  Students ({getStudentsByGroup(selectedGroup).length})
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {getStudentsByGroup(selectedGroup).length > 0 ? (
                    getStudentsByGroup(selectedGroup).map(student => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <div>
                          <p className="font-medium text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-600">{student.email}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveFromGroup(student.id)}
                          className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No students in {selectedGroup}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGroups;
