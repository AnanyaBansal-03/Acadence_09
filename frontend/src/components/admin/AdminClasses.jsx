import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/apiConfig';
import { getClassStatus, calculateEndTime } from '../../lib/classStatus';

const AdminClasses = ({ initialClasses = [], initialUsers = [], onDataRefresh }) => {
  const [classes, setClasses] = useState(initialClasses);
  const [teachers, setTeachers] = useState(initialUsers.filter(u => u.role === 'teacher'));
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('timetable'); // 'timetable' or 'list'
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all'); // Filter for timetable view
  const [formData, setFormData] = useState({
    name: '',
    day_of_week: 'monday',
    schedule_time: '',
    duration_hours: '1',
    teacher_id: '',
    group_name: 'G1'
  });
  const [isCreating, setIsCreating] = useState(false);

  const availableGroups = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'];

  useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);

  useEffect(() => {
    setTeachers(initialUsers.filter(u => u.role === 'teacher'));
  }, [initialUsers]);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.teacher_id || !formData.schedule_time || !formData.duration_hours || !formData.group_name) {
      alert('Please fill all fields including group');
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          day_of_week: formData.day_of_week,
          schedule_time: formData.schedule_time,
          duration_hours: parseFloat(formData.duration_hours),
          teacher_id: parseInt(formData.teacher_id),
          group_name: formData.group_name
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to create class');
      }

      setClasses([result.data, ...classes]);
      setFormData({ name: '', day_of_week: 'monday', schedule_time: '', duration_hours: '1', teacher_id: '', group_name: 'G1' });
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
      const response = await fetch(`${API_URL}/admin/classes/${classId}`, {
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

  const timeSlots = [
     '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Helper to check if a time slot falls within a class period
  const isTimeInRange = (slotTime, startTime, endTime) => {
    const slotHour = parseInt(slotTime.split(':')[0]);
    const startHour = parseInt(startTime.split(':')[0]);
    const startMin = parseInt(startTime.split(':')[1] || '0');
    const endHour = parseInt(endTime.split(':')[0]);
    const endMin = parseInt(endTime.split(':')[1] || '0');
    
    const slotMinutes = slotHour * 60;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  };

  // Calculate end time from start time and duration
  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime || !durationHours) return null;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (durationHours * 60);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  // Group classes by day and time for timetable view
  const getTimetableData = () => {
    const timetable = {};
    
    daysOrder.forEach(day => {
      timetable[day] = {};
      timeSlots.forEach(slot => {
        timetable[day][slot] = [];
      });
    });

    // Filter classes by selected group
    const filteredClasses = selectedGroupFilter === 'all' 
      ? classes 
      : classes.filter(cls => cls.group_name === selectedGroupFilter);

    filteredClasses.forEach(cls => {
      const startTime = cls.start_time || cls.schedule_time;
      if (startTime && cls.day_of_week) {
        const day = cls.day_of_week.toLowerCase();
        const endTime = calculateEndTime(startTime, cls.duration_hours || 1);
        
        if (endTime) {
          // Add the class to all time slots it spans
          timeSlots.forEach(slot => {
            if (isTimeInRange(slot, startTime, endTime)) {
              timetable[day][slot].push({
                ...cls,
                isFirstSlot: slot === startTime.substring(0, 5),
                calculatedEndTime: endTime
              });
            }
          });
        }
      }
    });

    return timetable;
  };

  const timetableData = getTimetableData();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Manage Classes</h2>
            <p className="text-gray-600 mt-1">View and manage class schedule</p>
          </div>
          <div className="flex gap-3">
            {/* Group Filter (only in timetable view) */}
            {viewMode === 'timetable' && (
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="all">All Groups</option>
                {availableGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            )}
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timetable')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'timetable'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600'
                }`}
              >
                📅 Timetable
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600'
                }`}
              >
                📋 List
              </button>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              + Create Class
            </button>
          </div>
        </div>

        {/* Timetable View */}
        {viewMode === 'timetable' ? (
          <div>
            {/* Group Filter Info */}
            {selectedGroupFilter !== 'all' && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Showing classes for:</span>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-600 text-white">
                    {selectedGroupFilter}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedGroupFilter('all')}
                  className="text-sm text-purple-600 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-100">
                    Time
                  </th>
                  {daysOrder.map(day => (
                    <th key={day} className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {dayLabels[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(timeSlot => (
                  <tr key={timeSlot} className="hover:bg-gray-50:bg-gray-700/50">
                    <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 sticky left-0">
                      {timeSlot}
                    </td>
                    {daysOrder.map(day => {
                      const classesAtTime = timetableData[day][timeSlot] || [];
                      return (
                        <td key={`${day}-${timeSlot}`} className="border border-gray-300 px-2 py-2 align-top">
                          {classesAtTime.length > 0 ? (
                            <div className="space-y-1">
                              {classesAtTime.map(cls => {
                                // Only show full details in the first slot
                                if (cls.isFirstSlot) {
                                  return (
                                    <div key={cls.id} className="bg-blue-100 border-l-4 border-blue-500 p-2 rounded text-xs">
                                      <div className="flex justify-between items-start">
                                        <div className="font-semibold text-gray-800">{cls.name}</div>
                                        <span className="px-2 py-0.5 bg-purple-500 text-white rounded text-xs font-bold">
                                          {cls.group_name || 'No Group'}
                                        </span>
                                      </div>
                                      <div className="text-gray-600 mt-1">
                                        👤 {cls.users?.name || 'No teacher'}
                                      </div>
                                      <div className="text-gray-500 mt-1">
                                        🕐 {cls.start_time || cls.schedule_time} - {cls.calculatedEndTime}
                                      </div>
                                      <button
                                        onClick={() => handleDeleteClass(cls.id)}
                                        className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 w-full"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  );
                                } else {
                                  // Show continuation indicator in subsequent slots
                                  return (
                                    <div key={cls.id} className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded text-xs">
                                      <div className="text-gray-700 text-center font-medium">
                                        ↑ {cls.name}
                                      </div>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs text-center py-4">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Group</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Teacher</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const status = getClassStatus(cls);
                const startTime = cls.start_time || cls.schedule_time;
                const endTime = calculateEndTime(startTime, cls.duration_hours);

                return (
                  <tr key={cls.id} className="border-b border-gray-100 hover:bg-gray-50:bg-gray-700">
                    <td className="px-4 py-3 text-gray-800 font-medium">{cls.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        {cls.group_name || 'No Group'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cls.users?.name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {dayLabels[cls.day_of_week] || cls.day_of_week}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {startTime} {endTime && `- ${endTime}`}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cls.duration_hours ? `${cls.duration_hours} hrs` : '1 hr'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${status.color === 'green' ? 'bg-green-100 text-green-700' :
                          status.color === 'red' ? 'bg-red-100 text-red-700' :
                          status.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {classes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No classes created yet
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Classes</p>
            <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Teachers</p>
            <p className="text-2xl font-bold text-purple-600">{teachers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Active Groups</p>
            <p className="text-2xl font-bold text-green-600">
              {new Set(classes.map(c => c.group_name).filter(Boolean)).size}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Avg Classes/Group</p>
            <p className="text-2xl font-bold text-orange-600">
              {classes.length > 0 ? Math.round(classes.length / Math.max(new Set(classes.map(c => c.group_name).filter(Boolean)).size, 1)) : 0}
            </p>
          </div>
        </div>
      </div>

      {/* Create Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Class</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <input
                type="text"
                placeholder="Class Name (e.g., Mathematics 101)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              />
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                placeholder="Start Time"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Duration
                </label>
                <select
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                >
                  <option value="0.5">30 minutes</option>
                  <option value="1">1 hour</option>
                  <option value="1.5">1.5 hours</option>
                  <option value="2">2 hours</option>
                  <option value="2.5">2.5 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                </select>
              </div>
              <select
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.group_name}
                  onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
                >
                  {availableGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Students assigned to this group will see this class
                </p>
              </div>
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
