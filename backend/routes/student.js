const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const supabase = require("../db");

// Middleware to verify JWT token
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
    res.status(401).json({ message: "Invalid token" });
  }
};

// Mark attendance via QR code
router.post("/mark-attendance", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId, date } = req.body;

    if (!classId) {
      return res.status(400).json({ message: "classId is required" });
    }

    // Verify student is enrolled in this class
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .single();

    if (enrollmentError || !enrollment) {
      return res.status(403).json({ message: "Student not enrolled in this class" });
    }

    // Check if already marked attendance for this date/class
    const attendanceDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const { data: existingAttendance, error: checkError } = await supabase
      .from("attendance")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("class_id", classId)
      .gte("date", `${attendanceDate}T00:00:00`)
      .lte("date", `${attendanceDate}T23:59:59`);

    if (existingAttendance && existingAttendance.length > 0) {
      console.log(`Duplicate attendance attempt: Student ${studentId}, Class ${classId}, Date ${attendanceDate}`);
      return res.status(409).json({
        message: "Attendance already marked for this date",
        status: existingAttendance[0].status,
        recordCount: existingAttendance.length
      });
    }

    // Insert attendance record
    const { data, error } = await supabase
      .from("attendance")
      .insert({
        student_id: studentId,
        class_id: classId,
        status: "present",
        date: `${attendanceDate}T${new Date().toISOString().split('T')[1]}`
      })
      .select();

    if (error) {
      console.error("Error inserting attendance:", error);
      throw error;
    }

    res.json({
      message: "Attendance marked successfully",
      data: data[0]
    });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({
      message: "Error marking attendance",
      error: err.message
    });
  }
});

// Get student's attendance data
router.get("/attendance", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all classes student is enrolled in
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", studentId);

    if (enrollError) throw enrollError;

    const classIds = enrollments.map(e => e.class_id);
    if (classIds.length === 0) {
      return res.json([]);
    }

    // Get attendance records for those classes
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .in("class_id", classIds)
      .order("date", { ascending: false });

    if (attendanceError) throw attendanceError;

    res.json(attendance || []);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({
      message: "Error fetching attendance",
      error: err.message
    });
  }
});

// Get student's marks/grades
router.get("/marks", verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all enrollments with all mark sections for this student
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollments")
      .select(`
        marks,
        st1_marks,
        st2_marks,
        evaluation_marks,
        end_term_marks,
        class_id,
        classes (id, name, day_of_week, start_time)
      `)
      .eq("student_id", studentId);

    if (enrollmentsError) throw enrollmentsError;

    // Transform to include all mark sections
    const marksData = (enrollments || []).map(enrollment => ({
      class_id: enrollment.class_id,
      class_name: enrollment.classes?.name,
      st1: enrollment.st1_marks,
      st2: enrollment.st2_marks,
      evaluation: enrollment.evaluation_marks,
      end_term: enrollment.end_term_marks,
      marks: enrollment.marks, // Keep for backward compatibility
      classes: enrollment.classes
    }));

    res.json(marksData);
  } catch (err) {
    console.error("Error fetching marks:", err);
    res.status(500).json({
      message: "Error fetching marks",
      error: err.message
    });
  }
});

module.exports = router;
