import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../lib/apiConfig";


export default function AuthCard() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  // Shared form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "", // student or teacher
  });

  // Handle input change
  const handleChange = (e, formType) => {
    if (formType === "login") {
      setLoginData({ ...loginData, [e.target.name]: e.target.value });
    } else {
      setSignupData({ ...signupData, [e.target.name]: e.target.value });
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setShowResendVerification(false);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, loginData)
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.id);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("userEmail", res.data.email);

      if (res.data.role === "admin") navigate("/admin");
      else if (res.data.role === "teacher") navigate("/teacher");
      else if (res.data.role === "student") navigate("/student");
      else navigate("/unauthorized");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error logging in";
      setErr(errorMessage);
      
      // Show resend verification option if email not verified
      if (error.response?.data?.emailNotVerified) {
        setShowResendVerification(true);
        setResendEmail(loginData.email);
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email handler
  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/resend-verification`, { email: resendEmail });
      alert(res.data.message);
      setShowResendVerification(false);
    } catch (error) {
      alert(error.response?.data?.message || "Error sending verification email");
    } finally {
      setResendLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    if (signupData.password !== signupData.confirmPassword) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/signup`, signupData);
      alert("Signup successful! Please login.");
      setIsSignup(false);
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
    } catch (error) {
      setErr(error.response?.data?.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 to-white overflow-hidden">
      <div
        className={`relative w-[90%] max-w-4xl h-[600px] transition-transform duration-700 transform ${
          isSignup ? "rotate-y-180" : ""
        }`}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* LOGIN SIDE */}
        <div className="absolute inset-0 flex flex-col md:flex-row bg-white rounded-2xl shadow-2xl backface-hidden">
          <div className="hidden md:block md:w-1/2 bg-blue-100">
            <img
              src="/assets/lg4.jpg"
              alt="Login illustration"
              className="w-full h-full object-cover rounded-l-2xl"
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8">
            <h2 className="text-3xl font-bold text-blue-700 mb-2">Welcome Back</h2>
            <p className="text-gray-500 mb-6 text-center">
              Please enter your credentials to continue
            </p>

            <form className="w-full max-w-sm flex flex-col gap-4" onSubmit={handleLogin}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => handleChange(e, "login")}
                required
                className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => handleChange(e, "login")}
                required
                className="border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
              
              {err && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center">
                  {err}
                </div>
              )}

              {showResendVerification && (
                <div className="bg-yellow-50 border border-yellow-300 px-4 py-3 rounded-xl">
                  <p className="text-yellow-800 text-sm mb-2">
                    Email not verified. Please check your inbox for the verification link.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline disabled:opacity-50"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-gray-600 mt-4 text-center">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setIsSignup(true)}
                className="text-blue-700 font-semibold hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>

        {/* SIGNUP SIDE */}
        <div
          className="absolute inset-0 w-full h-full flex flex-col md:flex-row rounded-2xl shadow-2xl bg-white transform rotate-y-180 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-blue-700 mb-6">Create Account</h1>

            {/* Role Selection */}
            <div className="flex mb-4">
              <button
                type="button"
                onClick={() => setSignupData({ ...signupData, role: "student" })}
                className={`w-1/2 py-2 text-sm font-medium border border-blue-500 rounded-l ${
                  signupData.role === "student"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500"
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setSignupData({ ...signupData, role: "teacher" })}
                className={`w-1/2 py-2 text-sm font-medium border border-blue-500 rounded-r ${
                  signupData.role === "teacher"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500"
                }`}
              >
                Teacher
              </button>
            </div>

            <form onSubmit={handleSignup}>
              {/* Full Name */}
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={signupData.name}
                onChange={(e) => handleChange(e, "signup")}
                className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />

              {/* Email */}
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) => handleChange(e, "signup")}
                className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />

              {/* Password */}
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={signupData.password}
                onChange={(e) => handleChange(e, "signup")}
                className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />

              {/* Confirm Password */}
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={signupData.confirmPassword}
                onChange={(e) => handleChange(e, "signup")}
                className="w-full p-2 mb-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />

              {err && <p className="text-red-500 text-center">{err}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-6 text-center">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setIsSignup(false)}
              >
                Log in
              </button>
            </p>
          </div>

          <div className="hidden md:block md:w-1/2 bg-blue-100">
            <img
              src="/assets/signup.jpg"
              alt="Signup illustration"
              className="w-full h-full object-cover rounded-r-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}