import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoginCard from "./Login";
import SignupCard from "./Signup";

export default function AuthCard() {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleChange = (e, formType) => {
    if (formType === "login") {
      setLoginData({ ...loginData, [e.target.name]: e.target.value });
    } else {
      setSignupData({ ...signupData, [e.target.name]: e.target.value });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", loginData);
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
      setErr(error.response?.data?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

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
      const res = await axios.post("http://localhost:5000/api/auth/signup", signupData);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-100 to-white overflow-hidden">
      <div
        className={`relative w-[90%] max-w-4xl h-[600px] transition-transform duration-700 transform`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {isSignup ? (
          <SignupCard
            signupData={signupData}
            handleChange={handleChange}
            handleSignup={handleSignup}
            loading={loading}
            err={err}
            switchToLogin={() => setIsSignup(false)}
          />
        ) : (
          <LoginCard
            loginData={loginData}
            handleChange={handleChange}
            handleLogin={handleLogin}
            loading={loading}
            err={err}
            switchToSignup={() => setIsSignup(true)}
          />
        )}
      </div>
    </div>
  );
}
