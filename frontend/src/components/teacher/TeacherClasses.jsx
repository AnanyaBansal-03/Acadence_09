import React, { useState } from 'react';

const TeacherClasses = ({ allClasses, teacherName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('all');

  // Filter classes based on search and day filter
  const filteredClasses = allClasses.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = filterDay === 'all' || cls.day_of_week?.toLowerCase() === filterDay.toLowerCase();
    return matchesSearch && matchesDay;
  });

  return (
    <div className="w-full max-w-6xl mx-auto pt-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {teacherName}'s Classes
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Manage all your courses and class schedules. View upcoming classes and organize your teaching schedule.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Days</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
            </select>
          </div>
        </div>

        {/* Classes Table */}
        <div className="bg-gray-50/80 rounded-xl p-6 border border-gray-200/50">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-800">Your Classes</h4>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
              Add New Class
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3">Class Name</th>
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Day</th>
                  <th className="pb-3">Group</th>
                  <th className="pb-3">Enrolled Students</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClasses.length > 0 ? (
                  filteredClasses.map((cls, index) => (
                    <tr key={cls.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-gray-800 font-medium">{cls.name}</td>
                      <td className="py-3 text-gray-600">{cls.schedule_time || cls.time}</td>
                      <td className="py-3 text-gray-600 capitalize">{cls.day_of_week}</td>
                      <td className="py-3">
                        {cls.group_name ? (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {cls.group_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-600">{cls.enrolled_count || 0}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm">
                            View
                          </button>
                          <button className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p>{allClasses.length === 0 ? 'No classes assigned to you yet.' : 'No classes match your search.'}</p>
                        {allClasses.length === 0 && (
                          <p className="text-sm mt-1">Contact administrator to get classes assigned.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{allClasses.length}</div>
            <div className="text-sm text-blue-700">Total Classes</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {allClasses.reduce((sum, cls) => sum + (cls.enrolled_count || 0), 0)}
            </div>
            <div className="text-sm text-green-700">Total Students</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(allClasses.map(cls => cls.day_of_week)).size}
            </div>
            <div className="text-sm text-purple-700">Active Days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;
