// src/components/FeatureCards.jsx
import React from "react";

const FeatureCard = ({ title, desc, color }) => {
  return (
    <div
      className={`relative group rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-500 cursor-pointer
        bg-white hover:shadow-lg hover:-translate-y-1`}
    >
      {/* Subtle Glow Effect */}
      <div
        className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition duration-500 -z-10
          ${color === "green" 
            ? "bg-emerald-100" 
            : "bg-blue-100"}`}
      ></div>

      {/* Color Accent Border */}
      <div
        className={`absolute top-0 left-0 w-full h-1 rounded-t-xl
          ${color === "green" ? "bg-emerald-500" : "bg-blue-500"}`}
      ></div>

      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
};

const FeatureCards = () => {
  const studentFeatures = [
    { title: "Real-Time Alerts", desc: "Stay updated on attendance, timetable changes, and important academic events." },
    { title: "CGPA Calculator", desc: "Track your grades and instantly calculate your semester and cumulative GPA." },
    { title: "Timetable Manager", desc: "Organize your daily classes and study schedule in one easy view." },
    { title: "Attendance Planner", desc: "Know exactly how many classes you need to attend to meet attendance goals." },
    { title: "Study Resources", desc: "Access curated notes, assignments, and reference material in one place." },
    { title: "AI Help Desk", desc: "Get instant answers to course-related questions with Acadence AI." },
  ];

  const teacherFeatures = [
    { title: "QR Attendance", desc: "Mark attendance instantly with secure, scannable QR codes." },
    { title: "Student Progress Reports", desc: "Get detailed insights into individual and class performance." },
    { title: "Proxy Prevention", desc: "Stop fake attendance with Wi-Fi based authentication." },
    { title: "Performance Analytics", desc: "Track academic trends and identify students who need help." },
    { title: "Resource Sharing", desc: "Easily share assignments, notes, and announcements." },
    { title: "Smart Scheduling", desc: "Plan lessons and assessments efficiently with AI suggestions." },
  ];

  return (
    <section className="relative z-10 m-0 p-0 bg-white text-gray-800 w-full">
      <div className="w-full flex flex-col justify-center items-center py-16">
        <div className="w-full px-4 md:px-8 max-w-6xl">
          {/* Main Heading */}
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Welcome to Acadence
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-medium max-w-3xl mx-auto">
              Your intelligent academic companion designed to make learning and
              teaching smarter, easier, and more efficient.
            </p>
          </div>

          {/* Students Section */}
          <div className="mb-20" id="for-students">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-full mb-3 border border-emerald-200">
                FOR STUDENTS
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Smarter Learning <span className="text-emerald-600">Made Simple</span>
              </h3>
              <div className="w-24 h-1 bg-emerald-400 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studentFeatures.map((f, i) => (
                <FeatureCard key={i} title={f.title} desc={f.desc} color="green" />
              ))}
            </div>
          </div>

          {/* Teachers Section */}
          <div id="for-teachers">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1 text-sm font-semibold text-blue-700 bg-blue-50 rounded-full mb-3 border border-blue-200">
                FOR TEACHERS
              </span>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Teaching <span className="text-blue-600">Reimagined</span>
              </h3>
              <div className="w-24 h-1 bg-blue-400 mx-auto mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {teacherFeatures.map((f, i) => (
                <FeatureCard key={i} title={f.title} desc={f.desc} color="blue" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;