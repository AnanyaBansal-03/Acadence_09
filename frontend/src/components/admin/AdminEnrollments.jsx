import React, { useState, useEffect } from 'react';

const AdminEnrollments = ({ initialEnrollments = [], initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [students, setStudents] = useState(initialUsers.filter(u => u.role === 'student'));
  const [classes, setClasses] = useState(initialClasses);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: ''
  });
  const [bulkFormData, setBulkFormData] = useState({
    class_id: '',
    student_ids: []
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

  const handleBulkEnrollment = async (e) => {
    e.preventDefault();
    if (!bulkFormData.class_id || bulkFormData.student_ids.length === 0) {
      alert('Please select a class and at least one student');
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      // Enroll each selected student
      for (const studentId of bulkFormData.student_ids) {
        // Check if already enrolled
        const existing = enrollments.find(
          e => e.student_id === parseInt(studentId) && 
               e.class_id === parseInt(bulkFormData.class_id)
        );

        if (existing) {
          failCount++;
          const student = students.find(s => s.id === parseInt(studentId));
          errors.push(`${student?.name || studentId} already enrolled`);
          continue;
        }

        try {
          const response = await fetch('http://localhost:5000/api/admin/enrollments', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              student_id: parseInt(studentId),
              class_id: parseInt(bulkFormData.class_id)
            })
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }

      setBulkFormData({ class_id: '', student_ids: [] });
      setShowBulkModal(false);
      
      if (successCount > 0) {
        alert(`✅ Successfully enrolled ${successCount} student(s)!${failCount > 0 ? `\n⚠️ ${failCount} failed` : ''}`);
        if (onDataRefresh) onDataRefresh();
      } else {
        alert(`❌ Failed to enroll students.\n${errors.join('\n')}`);
      }
    } catch (err) {
      console.error('Error in bulk enrollment:', err);
      alert('Failed to enroll students: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setBulkFormData(prev => {
      const isSelected = prev.student_ids.includes(studentId);
      return {
        ...prev,
        student_ids: isSelected
          ? prev.student_ids.filter(id => id !== studentId)
          : [...prev.student_ids, studentId]
      };
    });
  };

  const selectAllStudents = () => {
    const allStudentIds = students.map(s => s.id);
    setBulkFormData(prev => ({
      ...prev,
      student_ids: prev.student_ids.length === allStudentIds.length ? [] : allStudentIds
    }));
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
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Manage Enrollments</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Enroll students in classes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              <span>📋</span> Bulk Enroll
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              + Enroll Student
            </button>
          </div>
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
                    {student.name} ({student.email}) {student.group_name ? `[${student.group_name}]` : ''}
                  </option>
                ))}
              </select>
              <select
                value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">Select Class</option>
                {(() => {
                  const selectedStudent = students.find(s => s.id === parseInt(formData.student_id));
                  const studentGroup = selectedStudent?.group_name;
                  
                  // Filter classes by student's group
                  const filteredClasses = studentGroup 
                    ? classes.filter(cls => cls.group_name === studentGroup)
                    : classes;
                  
                  if (filteredClasses.length === 0 && studentGroup) {
                    return <option value="">No classes available for group {studentGroup}</option>;
                  }
                  
                  return filteredClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} [{cls.group_name || 'No Group'}]
                    </option>
                  ));
                })()}
              </select>
              {(() => {
                const selectedStudent = students.find(s => s.id === parseInt(formData.student_id));
                const studentGroup = selectedStudent?.group_name;
                
                if (selectedStudent && studentGroup) {
                  return (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        📌 Showing only classes for group: <span className="font-bold text-purple-600 dark:text-purple-400">{studentGroup}</span>
                      </p>
                    </div>
                  );
                }
                
                if (selectedStudent && !studentGroup) {
                  return (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        ⚠️ Student has no group assigned. All classes are shown.
                      </p>
                    </div>
                  );
                }
                
                return null;
              })()}
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

      {/* Bulk Enrollment Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Bulk Enroll Students</h3>
            <form onSubmit={handleBulkEnrollment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Class
                </label>
                <select
                  value={bulkFormData.class_id}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, class_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} [{cls.group_name || 'No Group'}] - {cls.day_of_week}
                    </option>
                  ))}
                </select>
              </div>

              {bulkFormData.class_id && (() => {
                const selectedClass = classes.find(c => c.id === parseInt(bulkFormData.class_id));
                const classGroup = selectedClass?.group_name;
                
                if (classGroup) {
                  const groupStudents = students.filter(s => s.group_name === classGroup);
                  return (
                    <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        📌 This class is for group <span className="font-bold text-purple-600 dark:text-purple-400">{classGroup}</span>
                        {groupStudents.length > 0 ? ` (${groupStudents.length} students available)` : ` (no students in this group)`}
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ This class has no group assigned. All students are shown.
                    </p>
                  </div>
                );
              })()}

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Students ({bulkFormData.student_ids.length} selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedClass = classes.find(c => c.id === parseInt(bulkFormData.class_id));
                      const classGroup = selectedClass?.group_name;
                      const filteredStudents = classGroup 
                        ? students.filter(s => s.group_name === classGroup)
                        : students;
                      const allFilteredIds = filteredStudents.map(s => s.id);
                      
                      setBulkFormData(prev => ({
                        ...prev,
                        student_ids: prev.student_ids.length === allFilteredIds.length ? [] : allFilteredIds
                      }));
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {(() => {
                      const selectedClass = classes.find(c => c.id === parseInt(bulkFormData.class_id));
                      const classGroup = selectedClass?.group_name;
                      const filteredStudents = classGroup 
                        ? students.filter(s => s.group_name === classGroup)
                        : students;
                      return bulkFormData.student_ids.length === filteredStudents.length ? 'Deselect All' : 'Select All';
                    })()}
                  </button>
                </div>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                  {(() => {
                    const selectedClass = classes.find(c => c.id === parseInt(bulkFormData.class_id));
                    const classGroup = selectedClass?.group_name;
                    const filteredStudents = classGroup 
                      ? students.filter(s => s.group_name === classGroup)
                      : students;
                    
                    if (filteredStudents.length === 0) {
                      return (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                          No students available{classGroup ? ` for group ${classGroup}` : ''}
                        </div>
                      );
                    }
                    
                    return filteredStudents.map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={bulkFormData.student_ids.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="mr-3 h-4 w-4 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {student.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            {student.email}
                            {student.group_name && (
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-bold">
                                {student.group_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating || bulkFormData.student_ids.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Enrolling...' : `Enroll ${bulkFormData.student_ids.length} Student(s)`}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkFormData({ class_id: '', student_ids: [] });
                  }}
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
