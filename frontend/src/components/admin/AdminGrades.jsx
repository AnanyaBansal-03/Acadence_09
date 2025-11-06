import React, { useState, useEffect } from 'react';
import { API_URL } from '../../lib/apiConfig';

const AdminGrades = ({ initialEnrollments = [], initialUsers = [], initialClasses = [], onDataRefresh }) => {
  const [students, setStudents] = useState(initialUsers.filter(u => u.role === 'student'));
  const [classes, setClasses] = useState(initialClasses);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Group classes by subject AND group
  useEffect(() => {
    const subjectsMap = {};
    initialClasses.forEach(cls => {
      const subjectCode = cls.subject_code || cls.name.split(' ')[0];
      const groupName = cls.group_name || 'No Group';
      
      // Create unique key for subject + group combination
      const key = `${subjectCode}_${groupName}`;
      
      if (!subjectsMap[key]) {
        subjectsMap[key] = {
          subject_code: subjectCode,
          name: cls.name.split(/\[G\d+\]/)[0].trim(),
          group_name: groupName,
          classIds: []
        };
      }
      subjectsMap[key].classIds.push(cls.id);
    });
    const subjectsArray = Object.values(subjectsMap);
    setSubjects(subjectsArray);
    if (subjectsArray.length > 0 && !selectedSubject) {
      const firstKey = `${subjectsArray[0].subject_code}_${subjectsArray[0].group_name}`;
      setSelectedSubject(firstKey);
    }
    setClasses(initialClasses);
  }, [initialClasses]);

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

  // Fetch marks when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchMarksForSubject(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    setStudents(initialUsers.filter(u => u.role === 'student'));
  }, [initialUsers]);

  const fetchMarksForSubject = async (subjectKey) => {
    setLoading(true);
    try {
      // Find subject by unique key (subject_code_groupName)
      const subject = subjects.find(s => `${s.subject_code}_${s.group_name}` === subjectKey);
      if (!subject) return;

      const token = localStorage.getItem('token');
      
      // Fetch marks for all class sessions of this subject
      const marksPromises = subject.classIds.map(classId =>
        fetch(`${API_URL}/admin/marks?classId=${classId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json())
      );

      const marksArrays = await Promise.all(marksPromises);
      const allMarks = marksArrays.flat();
        
      // Get enrollments for ALL classes in this subject
      const classEnrollments = initialEnrollments.filter(e => 
        subject.classIds.includes(e.class_id)
      );
      
      console.log('AdminGrades - Class enrollments:', classEnrollments);
      console.log('AdminGrades - All marks:', allMarks);
        
      // Helper function to extract roll number from email
      const getRollNumber = (email) => {
        if (!email) return '9999';
        const match = email.match(/(\d{4})(?:\.|@)/);
        return match ? match[1] : '9999';
      };
      
      // Group by student (since one student has multiple enrollments across sessions)
      const studentMap = {};
      classEnrollments.forEach(enrollment => {
        const student = students.find(s => s.id === enrollment.student_id);
        const studentMarks = allMarks.filter(m => m.student_id === enrollment.student_id);
        
        if (!studentMap[enrollment.student_id]) {
          const email = student?.email || 'N/A';
          const name = student?.name || (email !== 'N/A' ? email.split('@')[0] : 'Unknown');
          const rollNumber = getRollNumber(email);
          
          // Aggregate marks across all sessions (take first non-null value or average)
          const st1Values = studentMarks.filter(m => m.st1 !== null && m.st1 !== undefined).map(m => m.st1);
          const st2Values = studentMarks.filter(m => m.st2 !== null && m.st2 !== undefined).map(m => m.st2);
          const evalValues = studentMarks.filter(m => m.evaluation !== null && m.evaluation !== undefined).map(m => m.evaluation);
          const endTermValues = studentMarks.filter(m => m.end_term !== null && m.end_term !== undefined).map(m => m.end_term);
          
          studentMap[enrollment.student_id] = {
            enrollmentId: enrollment.id,
            studentId: enrollment.student_id,
            studentName: name,
            studentEmail: email,
            studentGroup: student?.group_name || 'No Group',
            rollNumber: rollNumber,
            st1: st1Values.length > 0 ? st1Values[0] : undefined,
            st2: st2Values.length > 0 ? st2Values[0] : undefined,
            evaluation: evalValues.length > 0 ? evalValues[0] : undefined,
            end_term: endTermValues.length > 0 ? endTermValues[0] : undefined
          };
        }
      });
      
      const combinedData = Object.values(studentMap);
      
      // Sort by roll number
      combinedData.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
      
      console.log('AdminGrades - Combined data:', combinedData);
      setMarksData(combinedData);
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
      const response = await fetch(`${API_URL}/admin/marks/${classId}/${studentId}`, {
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
    setEditingKey(`${selectedSubject}-${student.studentId}`);
    setEditMarks(student.marks || '');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">View Marks of Students</h2>
          <p className="text-gray-600 dark:text-gray-400">View student grades by subject</p>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Subject
          </label>
          <select
            value={selectedSubject || ''}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full md:w-80 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {subjects.map((subject) => {
              const uniqueKey = `${subject.subject_code}_${subject.group_name}`;
              return (
                <option key={uniqueKey} value={uniqueKey}>
                  {subject.subject_code} [{subject.group_name}]
                </option>
              );
            })}
          </select>
          {selectedSubject && (() => {
            const selectedSubjectData = subjects.find(s => `${s.subject_code}_${s.group_name}` === selectedSubject);
            if (selectedSubjectData?.group_name) {
              return (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    📌 Selected Group: <span className="font-bold text-purple-600 dark:text-purple-400">{selectedSubjectData.group_name}</span>
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Viewing marks aggregated across all sessions of this subject
                  </p>
                </div>
              );
            }
            return null;
          })()}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Roll No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Student Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Group</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Email</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">ST1</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">ST2</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Evaluation</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">End Term</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading marks...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const editKey = `${selectedSubject}-${student.studentId}`;
                  
                  // Helper function to render a mark cell
                  const renderMarkCell = (markValue) => {
                    if (markValue === null || markValue === undefined) {
                      return (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                      );
                    }
                    
                    const numMark = parseFloat(markValue);
                    const colorClass = numMark >= 75
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : numMark >= 60
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                      : numMark >= 45
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                      : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
                    
                    return (
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
                        {numMark}
                      </span>
                    );
                  };
                  
                  return (
                    <tr
                      key={editKey}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                        {student.rollNumber}
                      </td>
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
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-bold">
                          {student.studentGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.studentEmail}</td>
                      <td className="px-6 py-4 text-center">
                        {renderMarkCell(student.st1)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderMarkCell(student.st2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderMarkCell(student.evaluation)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {renderMarkCell(student.end_term)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
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