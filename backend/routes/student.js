const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const supabase = require("../db");
const { 
  calculateStudentAttendance, 
  categorizeRisk, 
  generateAIMessage,
  sendEmailNotification
} = require('../services/notificationService');

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

    // Trigger automatic notification generation after attendance is marked
    // Run in background to not delay response
    setTimeout(async () => {
      try {
        await generateNotificationForStudent(studentId);
      } catch (err) {
        console.error('Background notification generation failed:', err);
      }
    }, 100);

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

// Helper function to generate notifications for a student
async function generateNotificationForStudent(studentId) {
  try {
    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    // Calculate attendance for all subjects
    const attendanceStats = await calculateStudentAttendance(studentId);

    // Generate notifications only for critical and warning cases
    for (const stat of attendanceStats) {
      const risk = categorizeRisk(stat.percentage);
      
      // Only generate for critical and warning levels to avoid spam
      if (risk.level !== 'critical' && risk.level !== 'warning') {
        continue;
      }

      // Generate AI message
      const message = await generateAIMessage({
        studentName: student.name,
        subjectCode: stat.subject_code,
        subjectName: stat.subject_name,
        percentage: stat.percentage,
        riskLevel: risk.level,
        absentDays: stat.absentDays,
        totalDays: stat.totalDays
      });

      // Check if similar notification exists in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recentNotif } = await supabase
        .from('notifications')
        .select('id')
        .eq('student_id', studentId)
        .eq('subject_code', stat.subject_code)
        .eq('type', risk.level)
        .gte('created_at', oneDayAgo)
        .single();

      if (recentNotif) continue; // Skip if already notified recently

      // Insert notification to database
      await supabase
        .from('notifications')
        .insert({
          student_id: studentId,
          subject_code: stat.subject_code,
          subject_name: stat.subject_name,
          message: message,
          type: risk.level,
          attendance_percentage: stat.percentage,
          is_read: false
        });

      // Send email notification (async, don't wait)
      sendEmailNotification({
        studentEmail: student.email,
        studentName: student.name,
        subjectCode: stat.subject_code,
        subjectName: stat.subject_name,
        percentage: stat.percentage,
        riskLevel: risk.level,
        absentDays: stat.absentDays,
        totalDays: stat.totalDays
      }).catch(err => {
        console.error(`Failed to send email for ${stat.subject_code}:`, err);
      });
    }

    console.log(`✅ Generated notifications for student ${studentId}`);
  } catch (error) {
    console.error('Error generating notifications:', error);
  }
}

module.exports = router;
