import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-600 py-12 border-t border-gray-200" id="about">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-blue-600 mb-4">Acadence</h2>
        <div className="flex justify-center space-x-8 mb-6">
          <a href="#for-students" className="hover:text-blue-500 transition-colors font-medium">Students</a>
          <a href="#for-teachers" className="hover:text-blue-500 transition-colors font-medium">Teachers</a>
          <a href="#about" className="hover:text-blue-500 transition-colors font-medium">About</a>
          <Link to="/login" className="hover:text-blue-500 transition-colors font-medium">Login</Link>
        </div>
        <p className="text-gray-500">© 2025 Acadence. All rights reserved. Empowering the future of education.</p>
      </div>
    </footer>
  );
}

export default Footer;