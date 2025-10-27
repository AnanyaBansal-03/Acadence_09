// frontend/src/pages/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Welcome to Acadence</h1>
      <button
        onClick={() => navigate("/login")}
        className="bg-blue-500 text-white py-3 px-6 rounded-lg"
      >
        Go to Login
      </button>
    </div>
  );
};

export default Home;
