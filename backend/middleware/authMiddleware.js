const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header and validates it
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Middleware to verify user is an admin
 */
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

/**
 * Middleware to verify user is a teacher
 */
const verifyTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: "Access denied. Teacher only." });
  }
  next();
};

/**
 * Middleware to verify user is a student
 */
const verifyStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: "Access denied. Student only." });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyTeacher,
  verifyStudent
};
