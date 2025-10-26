import React, { useState, useEffect } from 'react';

const AdminClasses = ({ initialClasses = [], initialUsers = [], onDataRefresh }) => {
  const [classes, setClasses] = useState(initialClasses);
  const [teachers, setTeachers] = useState(initialUsers.filter(u => u.role === 'teacher'));
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: 'monday',
    schedule_time: '',
    teacher_id: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);

  useEffect(() => {
    setTeachers(initialUsers.filter(u => u.role === 'teacher'));
  }, [initialUsers]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.teacher_id || !formData.schedule_time) {
      alert('Please fill all fields');
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          day_of_week: formData.day_of_week,
          schedule_time: formData.schedule_time,
          teacher_id: parseInt(formData.teacher_id)
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create class');
      }

      setClasses([result.data, ...classes]);
      setFormData({ name: '', day_of_week: 'monday', schedule_time: '', teacher_id: '' });
      setShowModal(false);
      alert('Class created successfully!');
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error creating class:', err);
      alert('Failed to create class: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure? This will remove all enrollments for this class.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete class');
      }

      setClasses(classes.filter(c => c.id !== classId));
      alert('Class deleted successfully!');
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error deleting class:', err);
      alert('Failed to delete class: ' + err.message);
    }
  };

  const dayLabels = {
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Manage Classes</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            + Create Class
          </button>
        </div>

        {/* Classes Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Class Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Teacher</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 font-medium">{cls.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {cls.users?.name || 'Unassigned'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {dayLabels[cls.day_of_week] || cls.day_of_week}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cls.schedule_time}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {classes.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No classes created yet
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Classes</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{classes.length}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Teachers</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{teachers.length}</p>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <input
                type="text"
                placeholder="Class Name (e.g., Mathematics 101)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
              </select>
              <input
                type="time"
                value={formData.schedule_time}
                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <select
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create'}
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

export default AdminClasses;
