import React, { useState, useEffect } from 'react';

const AdminGrades = ({ initialEnrollments = [], initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [students, setStudents] = useState(initialUsers.filter(u => u.role === 'student'));
  const [classes, setClasses] = useState(initialClasses);
  const [selectedClass, setSelectedClass] = useState(classes.length > 0 ? classes[0]?.id : '');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate grade from marks
  const calculateGrade = (marks) => {
    if (!marks && marks !== 0) return '';
    const numMarks = parseFloat(marks);
    if (isNaN(numMarks)) return '';
    if (numMarks >= 90) return 'A+';
    if (numMarks >= 80) return 'A';
    if (numMarks >= 70) return 'B+';
    if (numMarks >= 60) return 'B';
    if (numMarks >= 50) return 'C';
    return 'F';
  };

  // Fetch marks when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchMarksForClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    setStudents(initialUsers.filter(u => u.role === 'student'));
  }, [initialUsers]);

  useEffect(() => {
    if (initialClasses.length > 0 && !selectedClass) {
      setSelectedClass(initialClasses[0].id);
    }
    setClasses(initialClasses);
  }, [initialClasses]);

  const fetchMarksForClass = async (classId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/marks?classId=${classId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const marks = await response.json();
        
        // Get enrollments for this class
        const classEnrollments = initialEnrollments.filter(e => e.class_id === parseInt(classId));
        
        // Combine enrollment and marks data
        const combinedData = classEnrollments.map(enrollment => {
          const student = students.find(s => s.id === enrollment.student_id);
          const mark = marks.find(m => m.student_id === enrollment.student_id);
          
          const email = student?.email || mark?.users?.email || 'N/A';
          const name = student?.name || mark?.users?.name || (email !== 'N/A' ? email.split('@')[0] : 'Unknown');
          const marksValue = mark?.marks;
          const gradeValue = calculateGrade(marksValue);
          
          return {
            enrollmentId: enrollment.id,
            studentId: enrollment.student_id,
            studentName: name,
            studentEmail: email,
            marks: marksValue,
            grade: gradeValue
          };
        });
        
        setMarksData(combinedData);
      }
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search
  const filteredStudents = marksData.filter(s =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateGrades = async (classId, studentId, marks) => {
    if (!marks || marks < 0 || marks > 100) {
      alert('Please enter marks between 0 and 100');
      return;
    }

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/marks/${classId}/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          marks: parseFloat(marks)
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Failed to update marks');
      }

      setEditingKey(null);
      setEditMarks('');
      alert('Marks updated successfully!');
      
      // Refresh marks data
      await fetchMarksForClass(classId);
      
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error updating marks:', err);
      alert('Failed to update marks: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditClick = (student) => {
    setEditingKey(`${selectedClass}-${student.studentId}`);
    setEditMarks(student.marks || '');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">View Marks of Students</h2>
          <p className="text-gray-600 dark:text-gray-400">View student grades by class</p>
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
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading marks...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const editKey = `${selectedClass}-${student.studentId}`;
                  const isEditing = editingKey === editKey;
                  
                  return (
                    <tr
                      key={editKey}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-300">
                              {student.studentName?.charAt(0).toUpperCase() || 'S'}
                            </span>
                          </div>
                          {student.studentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.studentEmail}</td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
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
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              student.marks >= 75
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : student.marks >= 60
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                : student.marks >= 45
                                ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                                : student.marks !== null && student.marks !== undefined
                                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }`}>
                              {student.marks !== null && student.marks !== undefined ? `${student.marks}/100` : 'Not graded'}
                            </span>
                            {student.grade && (
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                ({student.grade})
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleUpdateGrades(selectedClass, student.studentId, editMarks)}
                              disabled={isUpdating}
                              className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {isUpdating ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded text-sm hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditClick(student)}
                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            {student.marks !== null && student.marks !== undefined ? 'Edit' : 'Add Marks'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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