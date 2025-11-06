import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { API_URL } from '../lib/apiConfig';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminUsers from '../components/admin/AdminUsers';
import AdminClasses from '../components/admin/AdminClasses';
import AdminEnrollments from '../components/admin/AdminEnrollments';
import AdminGrades from '../components/admin/AdminGrades';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import AdminGroups from '../components/admin/AdminGroups';

const AdminNavbar = ({ adminData, profileOpen, setProfileOpen, handleLogout }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Admin</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative profile-dropdown">
            <button onClick={() => setProfileOpen(!profileOpen)} className="profile-button flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {adminData?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-gray-800">{adminData?.name || 'Admin'}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <button onClick={handleLogout} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const AdminDashboard = () => {
  const [currentFeature, setCurrentFeature] = useState('analytics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [dbData, setDbData] = useState({
    users: [],
    classes: [],
    enrollments: [],
    attendance: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
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

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const adminId = localStorage.getItem('userId');
      const adminName = localStorage.getItem('userName') || 'Admin';
      const adminEmail = localStorage.getItem('userEmail') || 'admin@example.com';
      const token = localStorage.getItem('token');
      
      if (!adminId) {
        navigate('/login');
        return;
      }

      if (!token) {
        console.warn('No auth token found');
        setError('Authentication required');
        setLoading(false);
        return;
      }

      setAdminData({
        id: adminId,
        name: adminName,
        email: adminEmail,
        role: 'System Administrator'
      });

      // Fetch all data from backend API
      console.log('Fetching admin data from backend...');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        const usersRes = await fetch(`${API_URL}/admin/users`, { headers });
        const usersData = usersRes.ok ? await usersRes.json() : [];
        console.log('Users Response:', usersRes.status, usersData);

        const classesRes = await fetch(`${API_URL}/admin/classes`, { headers });
        const classesData = classesRes.ok ? await classesRes.json() : [];
        console.log('Classes Response:', classesRes.status, classesData);

        const enrollmentsRes = await fetch(`${API_URL}/admin/enrollments`, { headers });
        console.log('Enrollments Response Status:', enrollmentsRes.status);
        let enrollmentsData = [];
        
        if (!enrollmentsRes.ok) {
          const errorText = await enrollmentsRes.text();
          console.error('Enrollments Error:', errorText);
        } else {
          enrollmentsData = await enrollmentsRes.json();
        }
        
        console.log('Enrollments Data:', enrollmentsData);

        // For attendance, use direct Supabase or backend endpoint if available
        const attendanceData = [];

        console.log('Processed Data:', {
          usersCount: usersData?.length || 0,
          classesCount: classesData?.length || 0,
          enrollmentsCount: enrollmentsData?.length || 0,
          attendanceCount: attendanceData?.length || 0,
          enrollmentsData: enrollmentsData
        });

        setDbData({
          users: usersData || [],
          classes: classesData || [],
          enrollments: enrollmentsData || [],
          attendance: attendanceData || []
        });

      } catch (fetchErr) {
        console.error('Fetch error:', fetchErr);
        setError('Failed to fetch data from backend: ' + fetchErr.message);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchAdminData:', err);
      setError('Failed to load admin data: ' + err.message);
      setLoading(false);
    }
  };

  const handleFeatureClick = (feature) => {
    setCurrentFeature(feature);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderFeatureContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    switch (currentFeature) {
      case 'users':
        return <AdminUsers loading={loading} error={error} initialUsers={dbData.users} onDataRefresh={fetchAdminData} />;
      case 'classes':
        return <AdminClasses initialClasses={dbData.classes} initialUsers={dbData.users} onDataRefresh={fetchAdminData} />;
      case 'enrollments':
        return <AdminEnrollments initialEnrollments={dbData.enrollments} initialUsers={dbData.users} initialClasses={dbData.classes} onDataRefresh={fetchAdminData} />;
      case 'grades':
        return <AdminGrades initialEnrollments={dbData.enrollments} initialUsers={dbData.users} initialClasses={dbData.classes} onDataRefresh={fetchAdminData} />;
      case 'groups':
        return <AdminGroups initialUsers={dbData.users} initialClasses={dbData.classes} onDataRefresh={fetchAdminData} />;
      case 'analytics':
        return <AdminAnalytics users={dbData.users} classes={dbData.classes} enrollments={dbData.enrollments} attendance={dbData.attendance} />;
      default:
        return <AdminAnalytics users={dbData.users} classes={dbData.classes} enrollments={dbData.enrollments} attendance={dbData.attendance} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNavbar
        adminData={adminData}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        handleLogout={handleLogout}
      />
      <div className="flex pt-16">
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          currentFeature={currentFeature}
          handleFeatureClick={handleFeatureClick}
          handleHomeClick={() => {
            setCurrentFeature('analytics');
            setSidebarOpen(false);
          }}
        />
        <main className="flex-1 lg:ml-64 p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {renderFeatureContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
