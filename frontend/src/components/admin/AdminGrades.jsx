import React, { useState, useEffect } from 'react';

const AdminGrades = ({ initialEnrollments = [], initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [students, setStudents] = useState(initialUsers.filter(u => u.role === 'student'));
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(classes.length > 0 ? classes[0]?.id : '');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Get students in selected class
  const classEnrollments = enrollments.filter(e => e.class_id === parseInt(selectedClass));
  const classStudents = classEnrollments.map(e => ({
    ...e,
    studentName: students.find(s => s.id === e.student_id)?.name || 'Unknown',
    studentEmail: students.find(s => s.id === e.student_id)?.email || 'N/A'
  }));

  // Filter by search
  const filteredStudents = classStudents.filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    setEnrollments(initialEnrollments);
  }, [initialEnrollments]);

  useEffect(() => {
    setStudents(initialUsers.filter(u => u.role === 'student'));
  }, [initialUsers]);

  useEffect(() => {
    if (initialClasses.length > 0 && !selectedClass) {
      setSelectedClass(initialClasses[0].id);
    }
    setClasses(initialClasses);
  }, [initialClasses]);

  const handleUpdateGrades = async (enrollmentId, marks) => {
    if (!marks || marks < 0 || marks > 100) {
      alert('Please enter marks between 0 and 100');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/enrollments/${enrollmentId}/marks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marks: parseInt(marks)
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to update marks');
      }

      // Update local state
      setEnrollments(enrollments.map(e =>
        e.id === enrollmentId ? { ...e, marks: parseInt(marks) } : e
      ));

      setEditingId(null);
      setEditMarks('');
      alert('Marks updated successfully!');
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error updating marks:', err);
      alert('Failed to update marks: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClick = (enrollment) => {
    setEditingId(enrollment.id);
    setEditMarks(enrollment.marks || '');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Assign Marks to Students</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage and update student grades by class</p>
        </div>

        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(parseInt(e.target.value))}
            className="w-full md:w-80 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} - {cls.day_of_week} {cls.schedule_time}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Student Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Current Marks</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((enrollment) => (
                  <tr
                    key={enrollment.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                            {enrollment.studentName?.charAt(0).toUpperCase() || 'S'}
                          </span>
                        </div>
                        {enrollment.studentName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{enrollment.studentEmail}</td>
                    <td className="px-6 py-4 text-center">
                      {editingId === enrollment.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editMarks}
                            onChange={(e) => setEditMarks(e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white text-center"
                            autoFocus
                          />
                          <span className="text-gray-600 dark:text-gray-400">/100</span>
                        </div>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          enrollment.marks >= 75
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : enrollment.marks >= 60
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                            : enrollment.marks >= 45
                            ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }`}>
                          {enrollment.marks !== null && enrollment.marks !== undefined ? `${enrollment.marks}/100` : 'Not graded'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editingId === enrollment.id ? (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleUpdateGrades(enrollment.id, editMarks)}
                            disabled={isUpdating}
                            className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded text-sm hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(enrollment)}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        >
                          {enrollment.marks !== null && enrollment.marks !== undefined ? 'Edit' : 'Add Marks'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p>{classes.length === 0 ? 'No classes available' : 'No students enrolled in this class'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {filteredStudents.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredStudents.length}</span> student{filteredStudents.length !== 1 ? 's' : ''} in selected class
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGrades;