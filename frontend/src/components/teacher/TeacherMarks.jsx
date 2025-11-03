import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const TeacherMarks = ({ allClasses, teacherName }) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('st1');
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const sections = [
    { value: 'st1', label: 'ST1 (Sessional Test 1)', column: 'st1_marks' },
    { value: 'st2', label: 'ST2 (Sessional Test 2)', column: 'st2_marks' },
    { value: 'evaluation', label: 'Evaluation', column: 'evaluation_marks' },
    { value: 'end_term', label: 'End Term', column: 'end_term_marks' }
  ];

  // Group classes by subject AND group (each subject-group combo is separate)
  const subjects = React.useMemo(() => {
    if (!allClasses || !Array.isArray(allClasses) || allClasses.length === 0) {
      return [];
    }
    
    try {
      const subjectsMap = {};
      allClasses.forEach(cls => {
        if (!cls || !cls.id) return; // Skip invalid class objects
        
        const subjectCode = cls.subject_code || (cls.name ? cls.name.split(' ')[0] : 'UNKNOWN');
        const groupName = cls.group_name || 'No Group';
        
        // Create unique key for subject + group combination
        const key = `${subjectCode}_${groupName}`;
        
        if (!subjectsMap[key]) {
          subjectsMap[key] = {
            subject_code: subjectCode,
            name: cls.name ? cls.name.split(/\[G\d+\]/)[0].trim() : subjectCode,
            group_name: groupName,
            classIds: []
          };
        }
        subjectsMap[key].classIds.push(cls.id);
      });
      return Object.values(subjectsMap);
    } catch (error) {
      console.error('Error grouping classes by subject:', error);
      return [];
    }
  }, [allClasses]);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSubjectChange = async (subjectKey) => {
    setSelectedSubject(subjectKey);
    if (subjectKey) {
      fetchMarksForSubject(subjectKey, selectedSection);
    } else {
      setMarksData([]);
    }
  };

  const handleSectionChange = async (section) => {
    setSelectedSection(section);
    if (selectedSubject) {
      fetchMarksForSubject(selectedSubject, section);
    }
  };

  const fetchMarksForSubject = async (subjectKey, section) => {
    setLoading(true);
    try {
      // Find subject by unique key (subject_code_groupName)
      const subject = subjects.find(s => `${s.subject_code}_${s.group_name}` === subjectKey);
      if (!subject) {
        setLoading(false);
        setMarksData([]);
        return;
      }

      const sectionObj = sections.find(s => s.value === section);
      if (!sectionObj) {
        setLoading(false);
        setMarksData([]);
        return;
      }
      
      const columnName = sectionObj.column;

      // Fetch enrollments for ALL class sessions of this subject
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          class_id,
          st1_marks,
          st2_marks,
          evaluation_marks,
          end_term_marks,
          users:student_id (id, name, email, group_name)
        `)
        .in('class_id', subject.classIds);

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        throw enrollError;
      }

      // Helper function to extract roll number from email
      const getRollNumber = (email) => {
        if (!email) return '9999';
        const match = email.match(/(\d{4})(?:\.|@)/);
        return match ? match[1] : '9999';
      };

      // Group enrollments by student (since one student has multiple enrollments across sessions)
      const studentMap = {};
      enrollments?.forEach(enrollment => {
        const studentId = enrollment.student_id;
        if (!studentMap[studentId]) {
          const email = enrollment.users?.email || '';
          const name = enrollment.users?.name || (email ? email.split('@')[0] : 'Unknown');
          const rollNumber = getRollNumber(email);
          
          studentMap[studentId] = {
            student_id: studentId,
            student_name: name,
            student_email: email,
            student_group: enrollment.users?.group_name || 'No Group',
            roll_number: rollNumber,
            marks: '',
            grade: '',
            enrollmentIds: []
          };
        }
        // Store all enrollment IDs for this student (for updating later)
        studentMap[studentId].enrollmentIds.push({ 
          id: enrollment.student_id, 
          class_id: enrollment.class_id 
        });
        
        // If this enrollment has marks for the selected section, use it
        const existingMarks = enrollment[columnName];
        if (existingMarks !== null && existingMarks !== undefined) {
          studentMap[studentId].marks = existingMarks;
          studentMap[studentId].grade = calculateGrade(existingMarks);
        }
      });

      // Convert to array
      const combined = Object.values(studentMap);

      // Sort by roll number
      combined.sort((a, b) => a.roll_number.localeCompare(b.roll_number));

      setMarksData(combined);
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    const numValue = parseFloat(value);
    const percentage = maxMarks > 0 ? (numValue / maxMarks) * 100 : 0;
    setMarksData(marksData.map(item =>
      item.student_id === studentId
        ? { ...item, marks: value, grade: calculateGrade(percentage) }
        : item
    ));
  };

  const calculateGrade = (marks) => {
    const numMarks = parseFloat(marks);
    if (isNaN(numMarks)) return '';
    if (numMarks >= 90) return 'A+';
    if (numMarks >= 80) return 'A';
    if (numMarks >= 70) return 'B+';
    if (numMarks >= 60) return 'B';
    if (numMarks >= 50) return 'C';
    return 'F';
  };

  const handleSaveMarks = async () => {
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }

    if (!selectedSection) {
      alert('Please select a section');
      return;
    }

    // Find subject by unique key (subject_code_groupName)
    const subject = subjects.find(s => `${s.subject_code}_${s.group_name}` === selectedSubject);
    if (!subject) {
      alert('Selected subject not found. Please select a valid subject.');
      return;
    }

    setUploading(true);
    try {
      const sectionObj = sections.find(s => s.value === selectedSection);
      if (!sectionObj) {
        alert('Invalid section selected');
        setUploading(false);
        return;
      }
      
      // Prepare marks data - update all enrollments for each student across all class sessions
      const updates = [];
      marksData.forEach(item => {
        if (item.marks && item.marks !== '' && item.enrollmentIds && item.enrollmentIds.length > 0) {
          // Update marks for ALL enrollments of this student (all sessions of the subject)
          item.enrollmentIds.forEach(enrollment => {
            updates.push({
              student_id: item.student_id,
              class_id: enrollment.class_id,
              marks: parseFloat(item.marks)
            });
          });
        }
      });

      if (updates.length === 0) {
        alert('No marks to save');
        setUploading(false);
        return;
      }

      // Call backend API to upload marks for all sessions
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/teacher/upload-marks-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          section: selectedSection,
          marksData: updates
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please check if the backend is running.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload marks');
      }

      showSuccess(`✅ ${result.uploaded || updates.length} ${sectionObj.label} marks uploaded successfully for ${subject.subject_code}!`);
      
      // Refresh marks data
      await fetchMarksForSubject(selectedSubject, selectedSection);
    } catch (err) {
      console.error('Error saving marks:', err);
      alert('Error saving marks: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pt-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Marks Management
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Upload and manage student marks for your classes.
          </p>
        </div>

        {/* Subject Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subject
          </label>
          {subjects.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <p className="text-sm">No subjects available. Please ensure you have classes assigned.</p>
            </div>
          ) : (
            <>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a subject...</option>
                {subjects.map(subject => {
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
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        📌 Selected Group: <span className="font-bold text-purple-600">{selectedSubjectData.group_name}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Marks will be entered for all students in this subject across all class sessions
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </>
          )}
        </div>

        {/* Section Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section (Exam Type)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sections.map(section => (
              <button
                key={section.value}
                type="button"
                onClick={() => handleSectionChange(section.value)}
                className={`px-4 py-3 rounded-lg font-medium transition-all ${
                  selectedSection === section.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Marks Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Marks for {sections.find(s => s.value === selectedSection)?.label}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
              min="1"
              placeholder="Enter max marks"
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600">
              (Students will be marked out of {maxMarks})
            </span>
          </div>
        </div>

        {selectedSubject && (
          <>
            {/* Marks Table */}
            <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {sections.find(s => s.value === selectedSection)?.label} Marks (Out of {maxMarks})
                  {loading && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
                </h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {marksData.length} Students
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="pb-3 px-4">Roll No.</th>
                      <th className="pb-3 px-4">Student Name</th>
                      <th className="pb-3 px-4">Group</th>
                      <th className="pb-3 px-4">Email</th>
                      <th className="pb-3 px-4">Marks</th>
                      <th className="pb-3 px-4">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {marksData.length > 0 ? (
                      marksData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-800 font-bold">{item.roll_number}</td>
                          <td className="py-3 px-4 text-gray-800 font-medium">{item.student_name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                              {item.student_group}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.student_email}</td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              value={item.marks}
                              onChange={(e) => handleMarkChange(item.student_id, e.target.value)}
                              placeholder={`/ ${maxMarks}`}
                              min="0"
                              max={maxMarks}
                              step="0.5"
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              item.grade === 'A+' || item.grade === 'A' 
                                ? 'bg-green-100 text-green-700' 
                                : item.grade === 'B+' || item.grade === 'B'
                                ? 'bg-blue-100 text-blue-700'
                                : item.grade === 'C'
                                ? 'bg-yellow-100 text-yellow-700'
                                : item.grade === 'F'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {item.grade || '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-gray-500">
                          {loading ? 'Loading students...' : 'No students enrolled in this class'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save Button */}
            {marksData.length > 0 && (
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleSaveMarks}
                  disabled={uploading}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:bg-gray-400 font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save All Marks
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherMarks;
