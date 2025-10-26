import React, { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from 'react-router-dom';

// Import modular components
import TeacherNavbar from '../components/teacher/TeacherNavbar';
import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherAttendance from '../components/teacher/TeacherAttendance';
import TeacherStudents from '../components/teacher/TeacherStudents';

const TeacherDashboard = () => {
  const [activeFeature, setActiveFeature] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    fetchTeacherData();
  }, []);

  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileOpen && !e.target.closest('.profile-dropdown') && !e.target.closest('.profile-button')) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileOpen]);

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
            students = enrollments?.map(enrollment => ({
              id: enrollment.users?.id || enrollment.student_id,
              name: enrollment.users?.name || 'Student Name',
              email: enrollment.users?.email || 'student@example.com',
              classId: enrollment.class_id
            })) || [];
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

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
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
          <p className="text-xl font-bold text-red-600">Data Error! 🚨</p>
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
      default:
        return <WelcomePage onFeatureClick={handleFeatureClick} teacherData={teacherData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <TeacherNavbar 
        teacherData={teacherData}
        darkMode={darkMode}
        toggleTheme={toggleTheme}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        handleLogout={handleLogout}
        setSidebarOpen={setSidebarOpen}
      />
      
      <TeacherSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentFeature={activeFeature}
        handleFeatureClick={handleFeatureClick}
        handleHomeClick={handleHomeClick}
      />
      
      <main className="flex-1 lg:ml-64 p-6 pt-20 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Feature Header */}
          {activeFeature !== 'home' && (
            <div className="mb-6">
              <button
                onClick={handleHomeClick}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {activeFeature === 'classes' && 'Your Classes'}
                {activeFeature === 'attendance' && 'Take Attendance'}
                {activeFeature === 'students' && 'Students'}
                {activeFeature === 'reports' && 'Reports'}
              </h2>
            </div>
          )}

          {/* Feature Content */}
          {renderFeatureContent()}
        </div>
      </main>
    </div>
  );
};

// WelcomePage Component
const WelcomePage = ({ onFeatureClick, teacherData }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="text-center space-y-6 p-8">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome Back!
          </h1>
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 dark:text-gray-100">
            {teacherData?.name || 'Teacher'} 👨‍🏫
          </h2>
        </div>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Your teaching management platform is ready
        </p>
      </div>
    </div>
  );
};

export default TeacherDashboard;