import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Squares from "../components/Squares";

function Unauthorized() {
  return (
    <div className="text-white font-sans relative min-h-screen flex flex-col">
      {/* Background animation */}
      <div className="fixed inset-0 -z-10">
        <Squares
          direction="right"
          speed={1.5}
          borderColor="#555"
          hoverFillColor="#4f46e5"
          squareSize={75}
        />
      </div>

      {/* Navbar */}
      <header className="absolute top-4 left-0 w-full z-50">
        <Navbar />
      </header>

      {/* Main content */}
      <main className="flex flex-col items-center justify-center flex-grow text-center px-6">
        <h1 className="text-5xl font-extrabold text-red-500 mb-6">
          Unauthorized Access
        </h1>
        <p className="text-lg text-gray-300 mb-6 max-w-lg">
          Sorry, you don’t have permission to view this page. Please log in with
          the correct account.
        </p>

        <Link
          to="/login"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700"
        >
          Go to Login
        </Link>
      </main>

      <Footer />
    </div>
  );
}

export default Unauthorized;
