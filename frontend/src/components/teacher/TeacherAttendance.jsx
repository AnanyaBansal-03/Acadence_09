import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabaseClient';

const TeacherAttendance = ({ attendanceStats, allClasses }) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real attendance records when class or date changes
  useEffect(() => {
    if (selectedClass && attendanceDate) {
      fetchAttendanceRecords();
    } else {
      setAttendanceRecords([]);
    }
  }, [selectedClass, attendanceDate]);

  const fetchAttendanceRecords = async () => {
    setLoading(true);
    try {
      // Fetch students enrolled in selected class
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          users!enrollments_student_id_fkey (id, name, email)
        `)
        .eq('class_id', parseInt(selectedClass));

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        setAttendanceRecords([]);
        return;
      }

      // Fetch attendance records for selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', parseInt(selectedClass))
        .gte('date', `${attendanceDate}T00:00:00`)
        .lte('date', `${attendanceDate}T23:59:59`);

      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
      }

      // Combine student data with attendance status
      const records = enrollments?.map(enrollment => {
        const studentId = enrollment.users?.id || enrollment.student_id;
        const attendanceRecord = attendanceData?.find(a => a.student_id === studentId);
        const email = enrollment.users?.email || '';
        const name = enrollment.users?.name || (email ? email.split('@')[0] : 'Unknown');
        
        return {
          id: studentId,
          studentName: name,
          status: attendanceRecord?.status || 'absent',
          time: attendanceRecord?.created_at ? new Date(attendanceRecord.created_at).toLocaleTimeString() : '-',
          attendanceId: attendanceRecord?.id
        };
      }) || [];

      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };


  // Realtime subscription: update attendanceRecords when students mark attendance
  useEffect(() => {
    if (!selectedClass) return;

    const channelName = `attendance-class-${selectedClass}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance', filter: `class_id=eq.${selectedClass}` }, (payload) => {
        const a = payload.new;
        // Only update if the attendance date matches the selected date
        try {
          const aDate = new Date(a.date).toISOString().slice(0,10);
          if (aDate !== attendanceDate) return;

          setAttendanceRecords(prev => {
            const idx = prev.findIndex(r => String(r.id) === String(a.student_id));
            const newRec = {
              id: a.student_id,
              studentName: prev[idx]?.studentName || 'Student',
              status: a.status,
              time: a.created_at ? new Date(a.created_at).toLocaleTimeString() : '-',
              attendanceId: a.id
            };

            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...newRec };
              return copy;
            }
            return [...prev, newRec];
          });
        } catch (e) {
          console.error('Realtime insert handling error:', e);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance', filter: `class_id=eq.${selectedClass}` }, (payload) => {
        const a = payload.new;
        try {
          const aDate = new Date(a.date).toISOString().slice(0,10);
          if (aDate !== attendanceDate) return;

          setAttendanceRecords(prev => prev.map(r => r.id === a.student_id ? { ...r, status: a.status, attendanceId: a.id, time: a.updated_at ? new Date(a.updated_at).toLocaleTimeString() : r.time } : r));
        } catch (e) {
          console.error('Realtime update handling error:', e);
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (e) { /* ignore */ }
    };
  }, [selectedClass, attendanceDate]);

  // Update attendance status
  const handleStatusChange = async (studentId, newStatus, attendanceId) => {
    try {
      if (attendanceId) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update({ status: newStatus })
          .eq('id', attendanceId);
        
        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            class_id: selectedClass,
            status: newStatus,
            date: new Date(attendanceDate).toISOString()
          });
        
        if (error) throw error;
      }
      
      // Refresh records
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    }
  };

  // Generate QR Code for attendance
  const handleGenerateQR = () => {
    if (!selectedClass) {
      alert('Please select a class first!');
      return;
    }

    const classInfo = allClasses.find(cls => cls.id === parseInt(selectedClass));
    const qrData = {
      classId: selectedClass,
      className: classInfo?.name,
      date: attendanceDate,
      timestamp: new Date().toISOString(),
      teacherId: localStorage.getItem('userId')
    };

    setQrCodeData(JSON.stringify(qrData));
    setShowQR(true);
  };

  // Submit/Finalize all attendance for the class
  const handleSubmitAttendance = async () => {
    if (!selectedClass) {
      alert('Please select a class first!');
      return;
    }

    if (attendanceRecords.length === 0) {
      alert('No attendance records to submit!');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Not logged in. Please login first.');
        return;
      }

      // Convert records to format expected by backend
      const recordsToSubmit = attendanceRecords.map(record => ({
        student_id: record.id,
        status: record.status
      }));

      const response = await fetch('http://localhost:5000/api/teacher/submit-attendance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: parseInt(selectedClass),
          date: attendanceDate,
          attendanceRecords: recordsToSubmit
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert('Failed to submit attendance: ' + (data.message || 'Unknown error'));
        return;
      }

      alert(`✅ Attendance submitted successfully!\n\nSubmitted: ${data.submitted} records\nInserted: ${data.inserted} new records\nUpdated: ${data.updated} records`);
      setShowQR(false);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to submit attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-700';
      case 'absent':
        return 'bg-red-100 text-red-700';
      case 'late':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto pt-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl text-white">📝</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Take Attendance
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Generate QR codes for quick attendance marking. Track student presence and manage attendance records efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* QR Code Generation Section */}
          <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
            <h4 className="font-semibold mb-4 text-gray-800">Generate QR Code</h4>
            
            {/* Class Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a class...</option>
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.day_of_week} {cls.schedule_time || cls.time}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* QR Code Display */}
            <div className="flex flex-col items-center">
              <div className="w-64 h-64 bg-white p-4 rounded-lg mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
                {showQR && qrCodeData ? (
                  <QRCodeSVG value={qrCodeData} size={220} />
                ) : (
                  <div className="text-center text-gray-500">
                    <span className="text-4xl mb-2 block">📱</span>
                    <p>QR Code will appear here</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateQR}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  Generate QR Code
                </button>
                {showQR && (
                  <button
                    onClick={() => setShowQR(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Statistics Section */}
          <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
            <h4 className="font-semibold mb-4 text-gray-800">Attendance Statistics</h4>
            <div className="space-y-4">
              {attendanceStats.labels.map((label, index) => (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{label}:</span>
                    <span className="font-semibold text-blue-600">{attendanceStats.data[index]}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        label === 'Present' ? 'bg-green-500' : 
                        label === 'Absent' ? 'bg-red-500' : 
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${attendanceStats.data[index]}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              <h5 className="font-medium text-gray-700 mb-3">Today's Summary</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-600">
                    {attendanceRecords.filter(r => r.status === 'present').length}
                  </div>
                  <div className="text-xs text-gray-600">Present</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-600">
                    {attendanceRecords.filter(r => r.status === 'absent').length}
                  </div>
                  <div className="text-xs text-gray-600">Absent</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        {selectedClass && (
          <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50 mt-6">
            <h4 className="font-semibold mb-4 text-gray-800">Attendance Records</h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500">
                        Loading attendance records...
                      </td>
                    </tr>
                  ) : attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-gray-800 font-medium">{record.studentName}</td>
                        <td className="py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 text-gray-600">{record.time}</td>
                        <td className="py-3">
                          <select
                            value={record.status}
                            onChange={(e) => handleStatusChange(record.id, e.target.value, record.attendanceId)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-500">
                        No students enrolled in this class yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Submit Attendance Button */}
            {attendanceRecords.length > 0 && (
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={handleSubmitAttendance}
                  disabled={submitting}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg shadow-md hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? '⏳ Submitting...' : '✅ Submit Attendance'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendance;
