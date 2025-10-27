import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const TeacherMarks = ({ allClasses, teacherName }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [marksData, setMarksData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bulkMarks, setBulkMarks] = useState('');

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
      // Fetch enrollments for the class
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          users!enrollments_student_id_fkey (id, name, email)
        `)
        .eq('class_id', parseInt(classId));

      if (enrollError) throw enrollError;

      // Fetch existing marks
      const { data: marks, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('class_id', parseInt(classId));

      if (marksError && marksError.code !== 'PGRST116') throw marksError;

      // Combine student and marks data
      const combined = enrollments?.map(enrollment => {
        const mark = (marks || []).find(m => m.student_id === enrollment.student_id);
        return {
          student_id: enrollment.student_id,
          student_name: enrollment.users?.name || 'Unknown',
          student_email: enrollment.users?.email || '',
          marks: mark?.marks || '',
          grade: mark?.grade || ''
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

  const handleBulkUpload = async () => {
    if (!selectedClass || !bulkMarks.trim()) {
      alert('Please select a class and enter marks data');
      return;
    }

    setUploading(true);
    try {
      const lines = bulkMarks.trim().split('\n');
      const updatePromises = lines.map(line => {
        const [email, marks] = line.split(',').map(s => s.trim());
        const student = marksData.find(m => m.student_email === email);
        if (student) {
          handleMarkChange(student.student_id, marks);
        }
      });

      await Promise.all(updatePromises);
      setBulkMarks('');
      alert('Marks updated successfully');
    } catch (err) {
      console.error('Error uploading marks:', err);
      alert('Error uploading marks: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!selectedClass) {
      alert('Please select a class');
      return;
    }

    setUploading(true);
    try {
      // Save marks to database
      const marksToInsert = marksData
        .filter(item => item.marks)
        .map(item => ({
          class_id: parseInt(selectedClass),
          student_id: item.student_id,
          marks: parseFloat(item.marks),
          grade: item.grade
        }));

      if (marksToInsert.length === 0) {
        alert('No marks to save');
        setUploading(false);
        return;
      }

      // Try to upsert marks
      const { error } = await supabase
        .from('marks')
        .upsert(marksToInsert, { onConflict: 'class_id,student_id' });

      if (error) throw error;

      alert('✅ Marks saved successfully');
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
            {/* Bulk Upload Section */}
            <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Bulk Upload Marks</h3>
              <p className="text-sm text-gray-600 mb-4">
                Format: student_email,marks (one per line)
              </p>
              <textarea
                placeholder="student1@example.com,85&#10;student2@example.com,92"
                value={bulkMarks}
                onChange={(e) => setBulkMarks(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 font-mono text-sm"
                rows="4"
              />
              <button
                onClick={handleBulkUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Upload Bulk Marks'}
              </button>
            </div>

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
                      <th className="pb-3 px-4">Marks</th>
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
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.marks}
                              onChange={(e) => handleMarkChange(item.student_id, e.target.value)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-600">{item.grade || '-'}</td>
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
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:bg-gray-400 font-medium"
                >
                  {uploading ? 'Saving...' : '💾 Save Marks'}
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
