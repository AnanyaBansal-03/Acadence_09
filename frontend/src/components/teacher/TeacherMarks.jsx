import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const TeacherMarks = ({ allClasses, teacherName }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleClassChange = async (classId) => {
    setSelectedClass(classId);
    if (classId) {
      fetchMarksForClass(classId);
    } else {
      setMarksData([]);
    }
  };

  const fetchMarksForClass = async (classId) => {
    setLoading(true);
    try {
      // Fetch enrollments for the class with marks
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          marks,
          users:student_id (id, name, email)
        `)
        .eq('class_id', parseInt(classId));

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        throw enrollError;
      }

      console.log('Fetched enrollments:', enrollments);

      // Combine student and marks data
      const combined = enrollments?.map(enrollment => {
        const email = enrollment.users?.email || '';
        const name = enrollment.users?.name || (email ? email.split('@')[0] : 'Unknown');
        const marksValue = enrollment.marks !== null && enrollment.marks !== undefined ? enrollment.marks : '';
        const gradeValue = marksValue !== '' ? calculateGrade(marksValue) : '';
        
        return {
          student_id: enrollment.student_id,
          student_name: name,
          student_email: email,
          marks: marksValue,
          grade: gradeValue
        };
      }) || [];

      setMarksData(combined);
    } catch (err) {
      console.error('Error fetching marks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setMarksData(marksData.map(item =>
      item.student_id === studentId
        ? { ...item, marks: value, grade: calculateGrade(value) }
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
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    setUploading(true);
    try {
      // Prepare marks data for upload
      const marksToUpload = marksData
        .filter(item => item.marks && item.marks !== '')
        .map(item => ({
          student_id: item.student_id,
          marks: parseFloat(item.marks)
        }));

      if (marksToUpload.length === 0) {
        alert('No marks to save');
        setUploading(false);
        return;
      }

      // Call backend API to upload marks
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/teacher/upload-marks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          classId: parseInt(selectedClass),
          marksData: marksToUpload
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

      showSuccess(`✅ ${result.uploaded} marks uploaded successfully for ${result.className}!`);
      
      // Refresh marks data
      await fetchMarksForClass(selectedClass);
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

        {/* Class Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a class...</option>
            {(allClasses || []).map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.day_of_week} - {cls.schedule_time})
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <>
            {/* Marks Table */}
            <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Student Marks {loading && <span className="text-sm text-gray-500">(Loading...)</span>}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200">
                      <th className="pb-3 px-4">Student Name</th>
                      <th className="pb-3 px-4">Email</th>
                      <th className="pb-3 px-4">Marks (0-100)</th>
                      <th className="pb-3 px-4">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {marksData.length > 0 ? (
                      marksData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-gray-800 font-medium">{item.student_name}</td>
                          <td className="py-3 px-4 text-gray-600">{item.student_email}</td>
                          <td className="py-3 px-4">
                            <select
                              value={item.marks}
                              onChange={(e) => handleMarkChange(item.student_id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                              <option value="">Select marks...</option>
                              {Array.from({ length: 101 }, (_, i) => i).map(mark => (
                                <option key={mark} value={mark}>{mark}</option>
                              ))}
                            </select>
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
