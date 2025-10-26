import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const headerOffset = 80;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <header
      id="navbar"
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white/95 backdrop-blur-md text-gray-800 border-b border-gray-200"
    >
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo / Brand */}
        <div className="text-2xl font-bold text-blue-600">Acadence</div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          <a
            href="#for-students"
            onClick={(e) => handleLinkClick(e, "#for-students")}
            className="px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
          >
            Students
          </a>
          <a
            href="#for-teachers"
            onClick={(e) => handleLinkClick(e, "#for-teachers")}
            className="px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
          >
            Teachers
          </a>
          <a
            href="#about"
            onClick={(e) => handleLinkClick(e, "#about")}
            className="px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
          >
            About
          </a>

          {/* Login button */}
          <Link
            to="/login"
            className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all duration-200"
          >
            Login
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-gray-700 focus:outline-none text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white/95 backdrop-blur-md flex flex-col items-center space-y-2 py-4 md:hidden shadow-lg border-b border-gray-200">
          <a
            href="#for-students"
            onClick={(e) => handleLinkClick(e, "#for-students")}
            className="px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium w-11/12 text-center"
          >
            Students
          </a>
          <a
            href="#for-teachers"
            onClick={(e) => handleLinkClick(e, "#for-teachers")}
            className="px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium w-11/12 text-center"
          >
            Teachers
          </a>
          <a
            href="#about"
            onClick={(e) => handleLinkClick(e, "#about")}
            className="px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium w-11/12 text-center"
          >
            About
          </a>
          <Link
            to="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-5 rounded-lg shadow-sm transition-all duration-200 w-11/12 text-center mt-2"
          >
            Login
          </Link>
        </div>
      )}
    </header>
  );
}

export default Navbar;