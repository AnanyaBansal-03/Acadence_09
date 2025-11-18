import { useEffect } from "react";
import { useNavigate, Routes, Route, useLocation } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import Squares from "./components/Squares";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FeatureCards from "./components/FeatureCard";
import RotatingText from "./components/RotatingText";
import Login from "./pages/Login";
import TeacherDash from "./pages/TeacherDash";
import StudentDashboard from "./pages/StudentDashboard";
import RequireAuth from "./RequireAuth";
import Signup from "./pages/Signup";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDash";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 });
  }, []);

  // Auto-redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    
    // Only redirect from login/signup/home pages if user is already logged in
    if (token && role && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup")) {
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "teacher") navigate("/teacher", { replace: true });
      else if (role === "student") navigate("/student", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/"
        element={
          <div className="text-gray-800 font-sans bg-white min-h-screen">
            {/* Subtle background animation */}
            <div className="fixed inset-0 -z-10">
              <Squares 
                direction="right" 
                speed={1.5} 
                borderColor="#f1f5f9" 
                hoverFillColor="#3b82f6" 
                squareSize={75} 
              />
            </div>

            <header className="absolute top-4 left-0 w-full z-50">
              <Navbar />
            </header>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center px-6 md:px-10 lg:px-20">
              <div className="max-w-4xl w-full z-10 mr-auto">
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6">
                  <div className="mb-2">Your Personal</div>
                  <div className="flex gap-2 md:gap-3 items-center flex-wrap">
                    <RotatingText
                      texts={['Academic','Smart', 'Intelligent', 'Modern']}
                      mainClassName="px-2 md:px-3 bg-blue-500 text-white overflow-hidden py-0.5 md:py-1 justify-center rounded-md text-4xl md:text-5xl lg:text-7xl font-bold"
                      staggerFrom={"last"}
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "-120%" }}
                      staggerDuration={0.025}
                      splitLevelClassName="overflow-hidden pb-0.5"
                      transition={{ type: "spring", damping: 30, stiffness: 400 }}
                      rotationInterval={2000}
                    />
                    <span className="text-gray-800">Assistant</span>
                  </div>
                </h1>
                <p className="text-base md:text-lg text-gray-600 mb-8 max-w-2xl leading-relaxed">
                  Calculate your attendance requirement, track your timetable, 
                  and monitor your CGPA with smart academic tools.
                </p>

                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  Get Started
                </button>
              </div>

              {/* Video Section */}
              <div className="absolute bottom-32 right-8 md:bottom-40 md:right-16 lg:right-24 hidden md:block">
                <video
                  src="./assets/vid7.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-[300px] md:w-[350px] lg:w-[500px] object-cover"
                />
              </div>
            </section>

            <FeatureCards />
            <Footer />
          </div>
        }
      />

      {/* Protected Routes */}
      <Route element={<RequireAuth allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route element={<RequireAuth allowedRoles={["teacher"]} />}>
        <Route path="/teacher" element={<TeacherDash />} />
      </Route>

      <Route element={<RequireAuth allowedRoles={["student"]} />}>
        <Route path="/student" element={<StudentDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
