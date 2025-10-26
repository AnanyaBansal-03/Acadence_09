import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../components/student/StudentNavbar';
import StudentSidebar from '../components/student/StudentSidebar';
import StudentAttendance from '../components/student/StudentAttendance';
import StudentGrades from '../components/student/StudentGrades';

const StudentDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState('home');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    attendance: [],
    assignments: [],
    grades: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    fetchStudentData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileOpen && !e.target.closest('.profile-dropdown') && !e.target.closest('.profile-button')) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileOpen]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      const studentId = localStorage.getItem('userId');
      const studentName = localStorage.getItem('userName') || 'Student';
      const studentEmail = localStorage.getItem('userEmail') || 'student@example.com';
      if (!studentId) {
        navigate('/login');
        return;
      }
      setStudentData({ id: studentId, studentId: studentId, name: studentName, email: studentEmail });
      let courses = [];
      try {
        const { data: enrollmentData, error: enrollmentError } = await supabase.from('enrollments').select('class_id,classes(id,name,teacher_id,day_of_week)').eq('student_id', studentId);
        if (enrollmentError) {
          setError('Failed to load courses: ' + enrollmentError.message);
        } else {
          courses = enrollmentData?.map(enrollment => enrollment.classes).filter(cls => cls !== null) || [];
        }
      } catch (err) {
        courses = [];
      }
      let attendance = [];
      if (courses.length > 0) {
        try {
          const classIds = courses.map(c => c.id);
          const { data: attendanceData } = await supabase.from('attendance').select('*').eq('student_id', studentId).in('class_id', classIds).order('date', { ascending: false });
          attendance = attendanceData || [];
        } catch (err) {
          attendance = [];
        }
      }
      let assignments = [];
      let grades = [];
      setDashboardData({ courses, attendance, assignments, grades });
      setLoading(false);
    } catch (error) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
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

  const handleFeatureClick = (feature) => {
    setCurrentFeature(feature);
    setSidebarOpen(true);
  };

  const handleHomeClick = () => {
    setCurrentFeature('home');
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderFeatureContent = () => {
    if (currentFeature === 'attendance') return React.createElement(StudentAttendance, { attendance: dashboardData.attendance, courses: dashboardData.courses, loading, error });
    if (currentFeature === 'grades') return React.createElement(StudentGrades, { grades: dashboardData.grades, courses: dashboardData.courses, loading, error });
    
    // Home view - Attendance scanning focus
    return React.createElement('div', { className: 'space-y-8' },
      React.createElement('div', { className: 'text-center space-y-6 p-8' },
        React.createElement('div', { className: 'mb-8' },
          React.createElement('h1', { className: 'text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4' }, 'Welcome!'),
          React.createElement('h2', { className: 'text-3xl md:text-4xl font-semibold text-gray-800 dark:text-gray-100' }, 
            (studentData?.name || 'Student') + ' 🎓'
          )
        ),
        React.createElement('p', { className: 'text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6' }, 
          'Scan the QR code to mark your attendance'
        )
      ),
      React.createElement(StudentAttendance, { attendance: dashboardData.attendance, courses: dashboardData.courses, loading, error })
    );
  };

  const getFeatureTitle = () => {
    if (currentFeature === 'courses') return 'My Courses';
    if (currentFeature === 'attendance') return 'Attendance';
    if (currentFeature === 'assignments') return 'Assignments';
    if (currentFeature === 'grades') return 'Grades';
    return 'Dashboard';
  };

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800' },
    React.createElement(StudentNavbar, { studentData, darkMode, toggleTheme, profileOpen, setProfileOpen, handleLogout, setSidebarOpen }),
    React.createElement('div', { className: 'flex' },
      React.createElement(StudentSidebar, { sidebarOpen, setSidebarOpen, currentFeature, handleFeatureClick, handleHomeClick }),
      React.createElement('main', { className: 'flex-1 lg:ml-64 p-6' }, renderFeatureContent())
    )
  );
};

export default StudentDashboard;