import React, { useState } from 'react';

const TeacherStudents = ({ allStudents, allClasses }) => {
  const [selectedClass, setSelectedClass] = useState(allClasses?.length > 0 ? allClasses[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const currentClass = allClasses?.find(c => c.id === selectedClass);

  const classStudents = allStudents
    ?.filter(student => student.classId === selectedClass)
    .filter(student => 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        default:
          return 0;
      }
    }) || [];

  return (
    <div className="w-full max-w-6xl mx-auto pt-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl">👨‍🎓</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Students
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            View students enrolled in your classes
          </p>
        </div>

        {!allClasses || allClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">No classes assigned yet</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass || ''}
                onChange={(e) => setSelectedClass(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.subject_code || cls.name.split(' ')[0]} ({cls.group_name || 'No Group'})
                  </option>
                ))}
              </select>
            </div>

            {currentClass && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  {currentClass.name}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Day:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{currentClass.day_of_week}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Time:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{currentClass.schedule_time}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Students:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{classStudents.length}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="name">By Name</option>
                <option value="email">By Email</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.length > 0 ? (
                    classStudents.map((student) => (
                      <tr key={student.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">
                                {student.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {student.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{student.email}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                        <div className="text-4xl mb-2">👨‍🎓</div>
                        <p>No students in this class</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              Showing {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherStudents;