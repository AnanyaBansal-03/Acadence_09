import React, { useState, useEffect } from 'react';

const AdminEnrollments = ({ initialEnrollments = [], initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [students, setStudents] = useState(initialUsers.filter(u => u.role === 'student'));
  const [classes, setClasses] = useState(initialClasses);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setEnrollments(initialEnrollments);
  }, [initialEnrollments]);

  useEffect(() => {
    setStudents(initialUsers.filter(u => u.role === 'student'));
  }, [initialUsers]);

  useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);

  const handleCreateEnrollment = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.class_id) {
      alert('Please select both student and class');
      return;
    }

    setIsCreating(true);
    try {
      // Check if already enrolled
      const existing = enrollments.find(
        e => e.student_id === parseInt(formData.student_id) && 
             e.class_id === parseInt(formData.class_id)
      );

      if (existing) {
        alert('This student is already enrolled in this class');
        setIsCreating(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: parseInt(formData.student_id),
          class_id: parseInt(formData.class_id)
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create enrollment');
      }

      setEnrollments([result.data, ...enrollments]);
      setFormData({ student_id: '', class_id: '' });
      setShowModal(false);
      alert('Enrollment created successfully!');
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error creating enrollment:', err);
      alert('Failed to enroll student: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to unenroll this student?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to unenroll student');
      }

      setEnrollments(enrollments.filter(e => e.id !== enrollmentId));
      alert('Student unenrolled successfully!');
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      alert('Failed to unenroll student: ' + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Manage Enrollments</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Enroll Student
          </button>
        </div>

        {/* Enrollments Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Student Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Enrolled On</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">
                    {enrollment.users?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {enrollment.users?.email || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {enrollment.classes?.name || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(enrollment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteEnrollment(enrollment.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      Unenroll
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {enrollments.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No enrollments yet
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Enrollments</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{enrollments.length}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Students</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{new Set(enrollments.map(e => e.student_id)).size}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Classes</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{new Set(enrollments.map(e => e.class_id)).size}</p>
          </div>
        </div>
      </div>

      {/* Create Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Enroll Student</h3>
            <form onSubmit={handleCreateEnrollment} className="space-y-4">
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Enrolling...' : 'Enroll'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
