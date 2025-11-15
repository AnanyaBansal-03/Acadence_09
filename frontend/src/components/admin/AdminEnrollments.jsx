import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/apiConfig';

const AdminEnrollments = ({ initialEnrollments = [], initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [students, setStudents] = useState(initialUsers.filter(u => u.role === 'student'));
  const [classes, setClasses] = useState(initialClasses);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    class_id: ''
  });
  const [bulkFormData, setBulkFormData] = useState({
    subject_code: '',
    group_name: '',
    student_ids: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setEnrollments(initialEnrollments);
    setCurrentPage(1); // Reset to first page when enrollments change
  }, [initialEnrollments]);

  useEffect(() => {
    setStudents(initialUsers.filter(u => u.role === 'student'));
  }, [initialUsers]);

  useEffect(() => {
    setClasses(initialClasses);
    // Extract unique subjects from classes
    const uniqueSubjects = {};
    initialClasses.forEach(cls => {
      const subjectCode = cls.subject_code || cls.name.split(' ')[0]; // Extract from name if no subject_code
      if (!uniqueSubjects[subjectCode]) {
        uniqueSubjects[subjectCode] = {
          code: subjectCode,
          name: subjectCode,
          groups: new Set()
        };
      }
      if (cls.group_name) {
        uniqueSubjects[subjectCode].groups.add(cls.group_name);
      }
    });
    
    const subjectsList = Object.values(uniqueSubjects).map(s => ({
      ...s,
      groups: Array.from(s.groups)
    }));
    
    setSubjects(subjectsList);
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
      const response = await fetch(`${API_URL}/admin/enrollments`, {
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
    } catch (error) {
      console.error('Error creating enrollment:', error);
      alert(error.message || 'Failed to create enrollment');
    } finally {
      setIsCreating(false);
    }
  };

  // Group enrollments by student and subject
  const getGroupedEnrollments = () => {
    const grouped = {};
    
    enrollments.forEach(enrollment => {
      const studentId = enrollment.student_id;
      const subjectCode = enrollment.classes?.subject_code || enrollment.classes?.name?.split(' ')[0];
      const groupName = enrollment.classes?.group_name;
      const key = `${studentId}_${subjectCode}_${groupName}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          id: enrollment.id, // Use first enrollment ID for deletion
          student_id: studentId,
          student_name: enrollment.users?.name,
          student_email: enrollment.users?.email,
          subject_code: subjectCode,
          subject_name: subjectCode,
          group_name: groupName,
          created_at: enrollment.created_at,
          enrollment_ids: [enrollment.id] // Track all enrollment IDs for this subject
        };
      } else {
        // Add this enrollment ID to the list
        grouped[key].enrollment_ids.push(enrollment.id);
        // Use earliest enrollment date
        if (new Date(enrollment.created_at) < new Date(grouped[key].created_at)) {
          grouped[key].created_at = enrollment.created_at;
        }
      }
    });
    
    return Object.values(grouped);
  };

  const groupedEnrollments = getGroupedEnrollments();

  // Pagination calculations
  const totalItems = groupedEnrollments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEnrollments = groupedEnrollments.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  const handleBulkEnrollment = async (e) => {
    e.preventDefault();
    if (!bulkFormData.subject_code || !bulkFormData.group_name || bulkFormData.student_ids.length === 0) {
      alert('Please select a subject, group, and at least one student');
      return;
    }

    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/admin/enrollments/subject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_ids: bulkFormData.student_ids.map(id => parseInt(id)),
          subject_code: bulkFormData.subject_code,
          group_name: bulkFormData.group_name
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create enrollments');
      }

      // Success message with details
      const message = `
✅ Successfully enrolled ${result.details.students} student(s) in ${result.details.subject}!

📚 Classes enrolled:
${result.details.classes.join('\n')}

📊 Total enrollments: ${result.details.totalEnrollments}
⏭️ Already enrolled (skipped): ${result.details.skipped}
      `.trim();

      alert(message);
      
      setBulkFormData({ subject_code: '', group_name: '', student_ids: [] });
      setShowBulkModal(false);
      setSearchTerm('');
      if (onDataRefresh) onDataRefresh();
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

  const handleDeleteEnrollment = async (enrollmentId, enrollmentIds = [enrollmentId]) => {
    const count = enrollmentIds.length;
    if (!window.confirm(`Are you sure you want to unenroll this student from this subject? This will remove ${count} class enrollment(s).`)) return;

    try {
      const token = localStorage.getItem('token');
      
      // Delete all enrollments for this subject
      const deletePromises = enrollmentIds.map(id =>
        fetch(`${API_URL}/admin/enrollments/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      );

      const responses = await Promise.all(deletePromises);
      
      // Check if any failed
      const failedResponses = responses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        throw new Error('Failed to unenroll from some classes');
      }

      // Remove all deleted enrollments from state
      setEnrollments(enrollments.filter(e => !enrollmentIds.includes(e.id)));
      alert(`Student unenrolled successfully from all ${count} class(es)!`);
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      console.error('Error deleting enrollment:', err);
      alert('Failed to unenroll student: ' + err.message);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Manage Enrollments</h2>
            <p className="text-gray-600 mt-1">Enroll students in classes</p>
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

        {/* Pagination Controls - Top */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} enrollments
            </span>
          </div>
        </div>

        {/* Enrollments Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Student Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enrolled On</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEnrollments.map((enrollment) => (
                <tr key={`${enrollment.student_id}_${enrollment.subject_code}_${enrollment.group_name}`} className="border-b border-gray-100 hover:bg-gray-50:bg-gray-700">
                  <td className="px-4 py-3 text-gray-800 font-medium">
                    {enrollment.student_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {enrollment.student_email || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {enrollment.subject_code} {enrollment.group_name ? `(${enrollment.group_name})` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(enrollment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteEnrollment(enrollment.id, enrollment.enrollment_ids)}
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

        {groupedEnrollments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No enrollments yet
          </div>
        )}

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-1">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                «
              </button>
              
              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ‹
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border text-sm ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  } rounded`}
                >
                  {page}
                </button>
              ))}

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                ›
              </button>
              
              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                »
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Subject Enrollments</p>
            <p className="text-2xl font-bold text-blue-600">{groupedEnrollments.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Enrolled Students</p>
            <p className="text-2xl font-bold text-green-600">{new Set(groupedEnrollments.map(e => e.student_id)).size}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Total Class Sessions</p>
            <p className="text-2xl font-bold text-purple-600">{enrollments.length}</p>
          </div>
        </div>
      </div>

      {/* Create Enrollment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Enroll Student</h3>
            <form onSubmit={handleCreateEnrollment} className="space-y-4">
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
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
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        📌 Showing only classes for group: <span className="font-bold text-purple-600">{studentGroup}</span>
                      </p>
                    </div>
                  );
                }
                
                if (selectedStudent && !studentGroup) {
                  return (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
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
          <div className="bg-white rounded-xl p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Bulk Enroll Students</h3>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkFormData({ class_id: '', student_ids: [] });
                  setSearchTerm('');
                }}
                className="text-gray-500 hover:text-gray-700:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleBulkEnrollment}>
              {/* Step 1: Select Subject & Group */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <label className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Select Subject & Group
                </label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
                    <select
                      value={bulkFormData.subject_code}
                      onChange={(e) => {
                        setBulkFormData({ subject_code: e.target.value, group_name: '', student_ids: [] });
                        setSearchTerm('');
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
                    >
                      <option value="">Choose subject...</option>
                      {subjects.map((subject) => (
                        <option key={subject.code} value={subject.code}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
                    <select
                      value={bulkFormData.group_name}
                      onChange={(e) => {
                        setBulkFormData(prev => ({ ...prev, group_name: e.target.value, student_ids: [] }));
                        setSearchTerm('');
                      }}
                      required
                      disabled={!bulkFormData.subject_code}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium disabled:opacity-50"
                    >
                      <option value="">Choose group...</option>
                      {bulkFormData.subject_code && (() => {
                        const selectedSubject = subjects.find(s => s.code === bulkFormData.subject_code);
                        return selectedSubject?.groups.map(group => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              {bulkFormData.subject_code && bulkFormData.group_name && (() => {
                const subjectClasses = classes.filter(c => 
                  (c.subject_code === bulkFormData.subject_code || c.name.startsWith(bulkFormData.subject_code)) &&
                  c.group_name === bulkFormData.group_name
                );
                const filteredStudents = students.filter(s => s.group_name === bulkFormData.group_name);
                
                // Further filter by search term
                const searchFilteredStudents = searchTerm
                  ? filteredStudents.filter(s => 
                      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  : filteredStudents;

                // Get students who are enrolled in ALL classes of this subject+group
                // A student is "enrolled" only if they're in ALL sessions
                const enrolledStudentIds = new Set();
                students.forEach(student => {
                  const enrolledClassIds = enrollments
                    .filter(e => e.student_id === student.id)
                    .map(e => e.class_id);
                  
                  // Check if student is enrolled in ALL classes of this subject
                  const isFullyEnrolled = subjectClasses.every(cls => 
                    enrolledClassIds.includes(cls.id)
                  );
                  
                  if (isFullyEnrolled) {
                    enrolledStudentIds.add(student.id);
                  }
                });

                // Group students by group_name
                const groupedStudents = searchFilteredStudents.reduce((acc, student) => {
                  const group = student.group_name || 'No Group';
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(student);
                  return acc;
                }, {});

                return (
                  <>
                    {/* Subject Info Banner */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-600 text-white rounded-lg p-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-1">
                            {bulkFormData.subject_code} - All Sessions
                          </h4>
                          <div className="flex flex-wrap gap-2 text-sm mb-2">
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-bold">
                              Group: {bulkFormData.group_name}
                            </span>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                              {subjectClasses.length} class session{subjectClasses.length !== 1 ? 's' : ''}
                            </span>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                              {filteredStudents.length} eligible students
                            </span>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                              {enrolledStudentIds.size} already enrolled
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div className="font-semibold">📅 Class Schedule:</div>
                            <div className="grid grid-cols-2 gap-1">
                              {subjectClasses.map(cls => (
                                <div key={cls.id} className="flex items-center gap-1">
                                  <span className="text-purple-600">•</span>
                                  {cls.day_of_week} at {cls.start_time}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Select Students */}
                    <div className="mb-4">
                      <label className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                        Select Students to Enroll
                        <span className="ml-auto text-blue-600 font-normal">
                          {bulkFormData.student_ids.length} selected
                        </span>
                      </label>

                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <input
                          type="text"
                          placeholder="Search by name or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900"
                        />
                        <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const allFilteredIds = searchFilteredStudents
                              .filter(s => !enrolledStudentIds.has(s.id))
                              .map(s => s.id);
                            setBulkFormData(prev => ({
                              ...prev,
                              student_ids: allFilteredIds
                            }));
                          }}
                          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200:bg-green-800 transition-colors"
                        >
                          ✓ Select All Available
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkFormData(prev => ({ ...prev, student_ids: [] }))}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200:bg-red-800 transition-colors"
                        >
                          ✗ Clear Selection
                        </button>
                      </div>

                      {/* Students List - Grouped */}
                      <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto bg-gray-50">
                        {searchFilteredStudents.length === 0 ? (
                          <div className="p-8 text-center">
                            <div className="text-gray-400 mb-2">
                              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                            <p className="text-gray-500">
                              {searchTerm ? 'No students found matching your search' : `No students available${bulkFormData.group_name ? ` for group ${bulkFormData.group_name}` : ''}`}
                            </p>
                          </div>
                        ) : (
                          Object.entries(groupedStudents).map(([groupName, groupStudents]) => (
                            <div key={groupName} className="mb-2 last:mb-0">
                              {/* Group Header */}
                              <div className="sticky top-0 bg-gradient-to-r from-gray-200 to-gray-100 px-4 py-2 border-b border-gray-300">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs">
                                      {groupName}
                                    </span>
                                    <span className="text-sm font-normal text-gray-600">
                                      {groupStudents.length} student{groupStudents.length !== 1 ? 's' : ''}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const groupStudentIds = groupStudents
                                        .filter(s => !enrolledStudentIds.has(s.id))
                                        .map(s => s.id);
                                      const allSelected = groupStudentIds.every(id => bulkFormData.student_ids.includes(id));
                                      
                                      setBulkFormData(prev => ({
                                        ...prev,
                                        student_ids: allSelected
                                          ? prev.student_ids.filter(id => !groupStudentIds.includes(id))
                                          : [...new Set([...prev.student_ids, ...groupStudentIds])]
                                      }));
                                    }}
                                    className="text-xs text-blue-600 hover:underline font-medium"
                                  >
                                    {groupStudents.filter(s => !enrolledStudentIds.has(s.id)).every(s => bulkFormData.student_ids.includes(s.id))
                                      ? 'Deselect Group' : 'Select Group'}
                                  </button>
                                </div>
                              </div>
                              
                              {/* Group Students */}
                              {groupStudents.map((student) => {
                                const isEnrolled = enrolledStudentIds.has(student.id);
                                const isSelected = bulkFormData.student_ids.includes(student.id);
                                
                                return (
                                  <label
                                    key={student.id}
                                    className={`flex items-center p-3 border-b border-gray-200 last:border-b-0 transition-colors ${
                                      isEnrolled 
                                        ? 'bg-gray-100 opacity-50 cursor-not-allowed' 
                                        : isSelected
                                          ? 'bg-blue-50 cursor-pointer hover:bg-blue-100:bg-blue-900/30'
                                          : 'bg-white cursor-pointer hover:bg-gray-50:bg-gray-800'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        if (!isEnrolled) {
                                          toggleStudentSelection(student.id);
                                        }
                                      }}
                                      disabled={isEnrolled}
                                      className="mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">
                                          {student.name}
                                        </span>
                                        {isEnrolled && (
                                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                                            ✓ Already Enrolled
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {student.email}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    {bulkFormData.student_ids.length > 0 && (
                      <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                            ✓
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              Ready to enroll {bulkFormData.student_ids.length} student{bulkFormData.student_ids.length !== 1 ? 's' : ''} in {bulkFormData.subject_code}
                            </p>
                            <p className="text-sm text-gray-600">
                              Each student will be enrolled in {subjectClasses.length} class session{subjectClasses.length !== 1 ? 's' : ''} ({subjectClasses.map(c => c.day_of_week).join(', ')})
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isCreating || bulkFormData.student_ids.length === 0 || !bulkFormData.subject_code || !bulkFormData.group_name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enrolling...
                    </span>
                  ) : (
                    `Enroll in ${bulkFormData.subject_code || 'Subject'}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkFormData({ subject_code: '', group_name: '', student_ids: [] });
                    setSearchTerm('');
                  }}
                  disabled={isCreating}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400:bg-gray-500 font-bold transition-colors disabled:opacity-50"
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