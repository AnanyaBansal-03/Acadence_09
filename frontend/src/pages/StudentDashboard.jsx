﻿import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import StudentAttendance from '../components/student/StudentAttendance';
import StudentGrades from '../components/student/StudentGrades';
import StudentCourses from '../components/student/StudentCourses';

const StudentDashboard = () => {
  const [activeFeature, setActiveFeature] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    courses: [],
    attendance: [],
    assignments: [],
    grades: []
  });
  const navigate = useNavigate();

  useEffect(() => {
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

      // Set student data (from 1st code UI)
      setStudentData({
        id: studentId,
        name: studentName,
        email: studentEmail,
        studentId: studentId,
        department: localStorage.getItem('userDepartment') || 'Computer Science',
        semester: localStorage.getItem('userSemester') || '4th Semester',
        joinDate: localStorage.getItem('userJoinDate') || 'September 2023',
        phone: localStorage.getItem('userPhone') || '+1 (555) 123-4567',
        address: localStorage.getItem('userAddress') || '123 University Ave, Campus City',
        dateOfBirth: localStorage.getItem('userDateOfBirth') || 'March 15, 2002'
      });

      let courses = [];
      let attendance = [];
      let assignments = [];
      let grades = [];

      // Fetch courses (from 2nd code functionality)
      try {
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('class_id, classes(id, name, teacher_id, day_of_week)')
          .eq('student_id', studentId);

        if (enrollmentError) {
          setError('Failed to load courses: ' + enrollmentError.message);
        } else {
          courses = enrollmentData?.map(enrollment => enrollment.classes).filter(cls => cls !== null) || [];
        }
      } catch (err) {
        courses = [];
      }

      // Fetch attendance (from 2nd code functionality)
      if (courses.length > 0) {
        try {
          const classIds = courses.map(c => c.id);
          const { data: attendanceData } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .in('class_id', classIds)
            .order('date', { ascending: false });
          attendance = attendanceData || [];
        } catch (err) {
          attendance = [];
        }
      }

      setDashboardData({ courses, attendance, assignments, grades });
      setLoading(false);

    } catch (error) {
      setError('Failed to load dashboard data');
      setLoading(false);
    }
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
    localStorage.clear();
    navigate('/login');
  };

  // Render feature content - Using 1st code UI structure but 2nd code functionality
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
            onClick={fetchStudentData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }

    switch(activeFeature) {
      case 'attendance':
        return <StudentAttendance attendance={dashboardData.attendance} courses={dashboardData.courses} loading={loading} error={error} />;
      case 'grades':
        return <StudentGrades grades={dashboardData.grades} courses={dashboardData.courses} loading={loading} error={error} />;
      case 'courses':
        return <StudentCourses courses={dashboardData.courses} loading={loading} error={error} />;
      case 'assignments':
        // For assignments, show placeholder
        return (
          <div className="w-full max-w-6xl mx-auto pt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {activeFeature === 'courses' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                    )}
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {activeFeature === 'courses' ? 'My Courses' : 'Assignments'}
                </h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  {activeFeature === 'courses'
                    ? 'View all your enrolled courses and schedules.'
                    : 'Manage and submit your assignments.'}
                </p>
              </div>
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {activeFeature === 'courses' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  )}
                </svg>
                <p>Feature coming soon...</p>
              </div>
            </div>
          </div>
        );
      default:
        return <WelcomePage onFeatureClick={handleFeatureClick} studentData={studentData} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900 min-h-screen">
      {/* Exact Navbar from 1st code */}
      <Navbar
        onHomeClick={handleHomeClick}
        showHomeButton={activeFeature !== 'home'}
        studentData={studentData}
        onLogout={handleLogout}
        profileOpen={profileOpen}
        toggleProfile={toggleProfile}
      />
     
      {/* Exact Sidebar from 1st code */}
      <Sidebar
        isOpen={sidebarOpen}
        activeFeature={activeFeature}
        onFeatureClick={handleFeatureClick}
        onClose={() => setSidebarOpen(false)}
      />
     
      <main className="flex items-center justify-center min-h-screen pt-24 px-6">
        {renderFeatureContent()}
      </main>
    </div>
  );
};

// EXACT COPY OF NAVBAR FROM 1ST CODE
const Navbar = ({ onHomeClick, showHomeButton, studentData, onLogout, profileOpen, toggleProfile }) => (
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"/>
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Student Dashboard
          </h1>
          {studentData && (
            <p className="text-sm text-gray-600">
              Welcome, {studentData.name} ({studentData.email})
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
          className="profile-button w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-0.5 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-sm font-bold text-blue-600">
            {studentData?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
        </button>

        {/* Profile Dropdown */}
        {profileOpen && studentData && (
          <div className="profile-dropdown absolute right-0 top-12 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 z-50 overflow-hidden">
            <div className="p-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1 mx-auto mb-4">
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    className="w-full h-full rounded-full bg-white object-cover"
                    alt="profile"
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{studentData.name}</h2>
                <p className="text-gray-600">{studentData.email}</p>
                <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mt-2">
                  {studentData.studentId}
                </div>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Department</label>
                    <p className="text-sm text-gray-800">{studentData.department}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Semester</label>
                    <p className="text-sm text-gray-800">{studentData.semester}</p>
                  </div>
                </div>
               
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Joined</label>
                  <p className="text-sm text-gray-800">{studentData.joinDate}</p>
                </div>
               
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                  <p className="text-sm text-gray-800">{studentData.phone}</p>
                </div>
               
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                  <p className="text-sm text-gray-800">{studentData.address}</p>
                </div>
               
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                  <p className="text-sm text-gray-800">{studentData.dateOfBirth}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                  Edit Profile
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium">
                  Settings
                </button>
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
    { key: 'courses', label: 'My Courses', color: 'from-emerald-400 to-emerald-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    )},
    { key: 'attendance', label: 'Attendance', color: 'from-pink-400 to-rose-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    )},
    { key: 'assignments', label: 'Assignments', color: 'from-orange-400 to-red-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    )},
    { key: 'grades', label: 'Grades', color: 'from-indigo-400 to-blue-600', icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
    )}
  ];

  return (
    <aside
      id="sidebar"
      className={`fixed left-0 top-16 h-full w-80 bg-white/95 backdrop-blur-md border-r border-gray-200/50 p-6 transform transition-transform duration-300 z-40 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
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
              <span className="font-medium text-gray-800">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

// EXACT COPY OF WELCOME PAGE FROM 1ST CODE
const WelcomePage = ({ onFeatureClick, studentData }) => {
  const features = [
    { key: 'courses', label: 'My Courses', description: 'View all your enrolled courses and schedules', color: 'from-emerald-400 to-emerald-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
    )},
    { key: 'attendance', label: 'Attendance', description: 'Check your attendance records and history', color: 'from-pink-400 to-rose-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    )},
    { key: 'assignments', label: 'Assignments', description: 'Manage and submit your assignments', color: 'from-orange-400 to-red-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
      </svg>
    )},
    { key: 'grades', label: 'Grades', description: 'View your marks and academic performance', color: 'from-indigo-400 to-blue-600', icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
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
          Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{studentData?.name || 'Student'}</span>
        </h1>
        <p className="text-gray-600 text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
          Your personalized learning platform. Track your courses, assignments, attendance, and academic progress all in one place.
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

export default StudentDashboard;