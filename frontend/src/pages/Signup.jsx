import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../lib/apiConfig";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [err, setErr] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setSuccessMessage("");

    try {
      const res = await axios.post(
        `${API_URL}/auth/signup`,
        formData
      );
      
      // Show success message
      setSuccessMessage(res.data.message);
      setFormData({ name: "", email: "", password: "", role: "" });
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (error) {
      setErr(error.response?.data?.message || "Error signing up");
    }
  };

  return (
    <div className="h-screen flex">
      {/* Left Side Image */}
      <div className="w-1/2 hidden md:flex justify-center items-center ">
        <img
          src="./assets/signup.jpg"
          alt="Signup illustration"
          className="w-5/6 h-auto"
        />
      </div>

      {/* Right Side Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-8">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-4xl font-bold text-blue-700 mb-4 text-center">Sign Up</h2>
          <p className="text-gray-600 mb-6 text-center">Create your new account</p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="border-gray-300 border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="border-gray-300 border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="border-gray-300 border p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className={`border border-gray-300 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500
            ${formData.role === "" ? "text-gray-500" : "text-black"}`}
            >
            <option value="" disabled hidden>
            Select Role
            </option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            </select>

            {err && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-xl text-center">
                {err}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl text-center">
                <p className="font-semibold mb-1">✓ {successMessage}</p>
                <p className="text-sm">Redirecting to login page in 5 seconds...</p>
              </div>
            )}

            <button
              type="submit"
              disabled={successMessage !== ""}
              className="bg-blue-700 text-white font-bold p-3 rounded-xl w-full hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign Up
            </button>
          </form>

          <p className="text-gray-600 mt-4 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-700 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;