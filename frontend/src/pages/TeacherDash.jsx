import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from 'react-router-dom';
import TeacherAttendance from '../components/teacher/TeacherAttendance';
import TeacherStudents from '../components/teacher/TeacherStudents';
import TeacherClasses from '../components/teacher/TeacherClasses';
import TeacherMarks from '../components/teacher/TeacherMarks';

const TeacherDashboard = () => {
  const [activeFeature, setActiveFeature] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    classSchedule: { labels: [], data: [] },
    attendanceStats: { labels: ['Present', 'Absent', 'Late'], data: [0, 0, 0] },
    allClasses: [],
    allStudents: []
  });
  const navigate = useNavigate();

  // Add this useEffect to handle component cleanup - INSIDE the component
  useEffect(() => {
    return () => {
      setDashboardData({
        classSchedule: { labels: [], data: [] },
        attendanceStats: { labels: ['Present', 'Absent', 'Late'], data: [0, 0, 0] },
        allClasses: [],
        allStudents: []
      });
    };
  }, []);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  // Handle clicking outside profile dropdown
  const profileOpenRef = useRef(profileOpen);

  useEffect(() => {
    profileOpenRef.current = profileOpen;
  }, [profileOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileOpenRef.current && !e.target.closest('.profile-dropdown') && !e.target.closest('.profile-button')) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get teacher data from localStorage
      const teacherId = localStorage.getItem('userId');
      const teacherName = localStorage.getItem('userName') || 'teacher1';
      const teacherEmail = localStorage.getItem('userEmail') || 'teacher@example.com';
      
      if (!teacherId) {
        console.warn('No teacher ID found in localStorage, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('Fetching data for teacher ID:', teacherId);

      // Set comprehensive teacher data
      setTeacherData({
        id: teacherId,
        name: teacherName,
        email: teacherEmail,
        teacherId: teacherId,
        department: localStorage.getItem('userDepartment') || 'Computer Science',
        designation: localStorage.getItem('userDesignation') || 'Associate Professor',
        specialization: localStorage.getItem('userSpecialization') || 'Machine Learning & Data Science',
        office: localStorage.getItem('userOffice') || 'Room 301, CS Building',
        officeHours: localStorage.getItem('userOfficeHours') || 'Mon-Fri: 2:00 PM - 4:00 PM',
        phone: localStorage.getItem('userPhone') || '+1 (555) 123-4567',
        joinDate: localStorage.getItem('userJoinDate') || 'September 2020'
      });

      // Initialize with empty arrays in case of missing tables
      let classes = [];
      let students = [];
      let attendance = [];

      try {
        // Fetch teacher's classes from database
        console.log('Attempting to fetch classes for teacher_id:', teacherId);
        
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', teacherId);

        if (classesError) {
          console.error('Error fetching classes:', classesError);
          setError(`Failed to load classes: ${classesError.message}. Please check your database connection.`);
          classes = [];
        } else {
          classes = classesData || [];
          console.log(`Found ${classes.length} classes for this teacher`);
        }

        console.log('Teacher classes:', classes);

        // Fetch students for these classes
        if (classes && classes.length > 0) {
          const classIds = classes.map(cls => cls.id);
          
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('enrollments')
            .select(`
              student_id,
              class_id,
              users!enrollments_student_id_fkey (id, name, email)
            `)
            .in('class_id', classIds);

          if (enrollmentsError) {
            console.error('Error fetching enrollments:', enrollmentsError.message);
            students = [];
          } else {
            // Process students data
            students = enrollments?.map(enrollment => {
              const email = enrollment.users?.email || 'student@example.com';
              const name = enrollment.users?.name || (email !== 'student@example.com' ? email.split('@')[0] : 'Student Name');
              
              return {
                id: enrollment.users?.id || enrollment.student_id,
                name: name,
                email: email,
                classId: enrollment.class_id
              };
            }) || [];
          }
        }

        console.log('Students:', students);

        // Fetch attendance data
        if (classes && classes.length > 0) {
          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .in('class_id', classes.map(c => c.id));

          if (attendanceError) {
            console.error('Error fetching attendance:', attendanceError.message);
            attendance = [];
          } else {
            attendance = attendanceData || [];
          }
        }

      } catch (dbError) {
        console.error('Database connection issue:', dbError.message);
        setError('Failed to connect to database. Please try again.');
        classes = [];
        students = [];
        attendance = [];
      }

      console.log('Attendance data:', attendance);

      // Process dashboard data
      const processedData = processDashboardData(classes, students, attendance);
      setDashboardData(processedData);

      // Calculate statistics for quick stats cards
      const totalClasses = classes?.length || 0;
      
      // Get unique students count
      const uniqueStudentIds = new Set();
      students?.forEach(student => {
        if (student.id) {
          uniqueStudentIds.add(student.id);
        }
      });
      const totalStudents = uniqueStudentIds.size;

      // Calculate today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance?.filter(a => {
        const attendanceDate = new Date(a.date).toISOString().split('T')[0];
        return attendanceDate === today;
      }).length || 0;

      // Total reports (one report per class)
      const totalReports = totalClasses;

      // Update teacher data with calculated statistics
      setTeacherData(prev => ({
        ...prev,
        totalClasses,
        totalStudents,
        todayAttendance,
        totalReports
      }));

    } catch (err) {
      console.error('Error fetching teacher data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (classes, students, attendance) => {
    // Process class schedule
    const classSchedule = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      data: [0, 0, 0, 0, 0]
    };

    const dayMap = {
      'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3, 'friday': 4
    };

    classes?.forEach(cls => {
      const dayIndex = dayMap[cls.day_of_week?.toLowerCase()];
      if (dayIndex !== undefined) {
        classSchedule.data[dayIndex]++;
      }
    });

    // Process attendance stats
    const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
    const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
    const lateCount = attendance?.filter(a => a.status === 'late').length || 0;
    const totalAttendance = presentCount + absentCount + lateCount;

    const attendanceStats = {
      labels: ['Present', 'Absent', 'Late'],
      data: totalAttendance > 0 ? [
        Math.round((presentCount / totalAttendance) * 100),
        Math.round((absentCount / totalAttendance) * 100),
        Math.round((lateCount / totalAttendance) * 100)
      ] : [0, 0, 0]
    };

    // Get unique students with real performance data
    const uniqueStudents = [];
    const studentMap = new Map();
    
    students?.forEach(student => {
      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, student);
        
        // Calculate real attendance rate for this student
        const studentAttendance = attendance?.filter(a => a.student_id === student.id) || [];
        const totalSessions = studentAttendance.length;
        const presentSessions = studentAttendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;
        
        uniqueStudents.push({
          ...student,
          score: 0, // Will be calculated from actual grades/assignments
          attendance: attendanceRate
        });
      }
    });

    return {
      classSchedule,
      attendanceStats,
      allClasses: classes?.map(cls => ({
        ...cls,
        enrolled_count: students.filter(s => s.classId === cls.id).length
      })) || [],
      allStudents: uniqueStudents
    };
  };

  const handleFeatureClick = (feature) => {
    setActiveFeature(feature);
    setSidebarOpen(true);
    setProfileOpen(false);
  };

  const handleHomeClick = () => {
    setActiveFeature('home');
    setSidebarOpen(false);
    setProfileOpen(false);
  };

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
    if (sidebarOpen) setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  // Render feature content
  const renderFeatureContent = () => {
    if (loading) {
      return (
        <div className="w-full max-w-6xl text-center py-20">
          <p className="text-xl font-medium text-blue-600">Loading Your Dashboard...</p>
          <div className="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full max-w-6xl text-center py-20 bg-red-50 p-6 rounded-xl border border-red-300">
          <p className="text-xl font-bold text-red-600">Data Error!</p>
          <p className="text-gray-700 mt-2">{error}</p>
          <button 
            onClick={fetchTeacherData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }

    switch(activeFeature) {
      case 'attendance':
        return <TeacherAttendance 
                 attendanceStats={dashboardData.attendanceStats}
                 allClasses={dashboardData.allClasses}
               />;
      case 'students':
        return <TeacherStudents 
                 allStudents={dashboardData.allStudents}
                 allClasses={dashboardData.allClasses}
               />;
      case 'classes':
        return <TeacherClasses 
                 allClasses={dashboardData.allClasses}
                 teacherName={teacherData?.name}
               />;
      case 'marks':
        return <TeacherMarks 
                 allClasses={dashboardData.allClasses}
                 teacherName={teacherData?.name}
               />;
      default:
        return <WelcomePage onFeatureClick={handleFeatureClick} teacherData={teacherData} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 min-h-screen flex flex-col">
      <Navbar 
        onHomeClick={handleHomeClick}
        showHomeButton={activeFeature !== 'home'}
        teacherData={teacherData}
        onLogout={handleLogout}
        profileOpen={profileOpen}
        toggleProfile={toggleProfile}
      />
      
      <Sidebar 
        isOpen={sidebarOpen}
        activeFeature={activeFeature}
        onFeatureClick={handleFeatureClick}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-8 px-6">
        <div className="w-full max-w-6xl">
          {renderFeatureContent()}
        </div>
      </main>
    </div>
  );
};

// EXACT COPY OF NAVBAR FROM 1ST CODE
const Navbar = ({ onHomeClick, showHomeButton, teacherData, onLogout, profileOpen, toggleProfile }) => (
  <nav className="flex justify-between items-center px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/50 fixed top-0 left-0 right-0 z-50 shadow-lg">
    <div className="flex items-center gap-4">
      <button 
        onClick={onHomeClick} 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all duration-200 ${showHomeButton ? '' : 'hidden'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span className="text-sm font-medium">Back</span>
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Teacher Dashboard
          </h1>
          {teacherData && (
            <p className="text-sm text-gray-600">
              Welcome, {teacherData.name} ({teacherData.email})
            </p>
          )}
        </div>
      </div>
    </div>
    
    <div className="flex gap-3 items-center relative">
      <button
        onClick={onLogout}
        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
      >
        Logout
      </button>
      
      {/* Profile Button */}
      <div className="relative">
        <button 
          onClick={toggleProfile}
          className="profile-button w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>

        {/* Profile Dropdown */}
        {profileOpen && teacherData && (
          <div className="profile-dropdown absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">{teacherData.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{teacherData.email}</p>
              </div>

              {/* Profile Details */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Teacher ID</p>
                    <p className="text-sm font-medium text-gray-800">{teacherData.teacherId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-800">{teacherData.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="text-sm font-medium text-gray-800">Teacher</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </nav>
);

// EXACT COPY OF SIDEBAR FROM 1ST CODE
const Sidebar = ({ isOpen, activeFeature, onFeatureClick, onClose }) => {
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.feature-btn')) {
        onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const features = [
    { key: 'classes', label: 'Your Classes', color: 'from-emerald-400 to-emerald-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    )},
    { key: 'attendance', label: 'Take Attendance', color: 'from-pink-400 to-rose-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    )},
    { key: 'students', label: 'Students', color: 'from-orange-400 to-red-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    )},
    { key: 'marks', label: 'Marks Management', color: 'from-indigo-400 to-blue-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
      </svg>
    )}
  ];

  return (
    <aside 
      id="sidebar"
      className={`fixed left-0 top-16 h-full w-80 bg-white/95 backdrop-blur-md border-r border-gray-200/50 p-6 transform transition-transform duration-300 z-40 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Navigation</h2>
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
      </div>
      <ul className="space-y-3">
        {features.map((item) => (
          <li key={item.key}>
            <button 
              className={`w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 feature-btn group ${activeFeature === item.key ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              onClick={() => onFeatureClick(item.key)}
            >
              <div className={`w-8 h-8 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-200`}>
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

// EXACT COPY OF WELCOME PAGE FROM 1ST CODE
const WelcomePage = ({ onFeatureClick, teacherData }) => {
  const features = [
    { key: 'classes', label: 'Your Classes', description: 'Manage all your courses and class schedules', color: 'from-emerald-400 to-emerald-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    )},
    { key: 'attendance', label: 'Take Attendance', description: 'Generate QR for attendance tracking', color: 'from-pink-400 to-rose-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    )},
    { key: 'students', label: 'Students', description: 'Check the progress of your every student', color: 'from-orange-400 to-red-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
      </svg>
    )},
    { key: 'marks', label: 'Marks Management', description: 'Upload and manage student marks', color: 'from-indigo-400 to-blue-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
      </svg>
    )}
  ];

  return (
    <div className="w-full max-w-6xl">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{teacherData?.name || 'Teacher'}</span>
        </h1>
        <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
          Your personalized teaching management platform. Manage your classes, track student progress, and streamline your workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {features.map((item) => (
          <div 
            key={item.key}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border border-gray-200/50 feature-btn group"
            onClick={() => onFeatureClick(item.key)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                {item.icon}
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">{item.label}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard;
