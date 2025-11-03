const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();
const supabase = require("../db");

// Middleware to verify JWT token and check if teacher
const verifyTeacher = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can perform this action" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Submit/Finalize attendance for a class on a date
// This marks all students as either present/absent/late and finalizes
router.post("/submit-attendance", verifyTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId, date, attendanceRecords } = req.body;

    if (!classId || !date) {
      return res.status(400).json({ message: "classId and date are required" });
    }

    // Verify this teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id")
      .eq("id", classId)
      .single();

    if (classError || !classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to submit attendance for this class" });
    }

    // Get all enrolled students
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", classId);

    if (enrollError) throw enrollError;

    const attendanceDate = new Date(date).toISOString().split('T')[0];
    const studentIds = enrollments.map(e => e.student_id);
    
    // Prepare attendance records: submitted + auto-absent for non-submitted
    const recordsToInsertOrUpdate = [];
    const attendanceMap = {};

    // First, build map of submitted records
    if (attendanceRecords && Array.isArray(attendanceRecords)) {
      for (const record of attendanceRecords) {
        attendanceMap[record.student_id] = {
          status: record.status,
          date: `${attendanceDate}T${new Date().toISOString().split('T')[1]}`
        };
      }
    }

    // Add all enrolled students to final list
    for (const studentId of studentIds) {
      const status = attendanceMap[studentId]?.status || 'absent';
      recordsToInsertOrUpdate.push({
        student_id: studentId,
        class_id: classId,
        status: status,
        date: `${attendanceDate}T${new Date().toISOString().split('T')[1]}`
      });
    }

    // Check for existing records for this date/class
    const { data: existingRecords, error: existingError } = await supabase
      .from("attendance")
      .select("id, student_id")
      .eq("class_id", classId)
      .gte("date", `${attendanceDate}T00:00:00`)
      .lte("date", `${attendanceDate}T23:59:59`);

    if (existingError) throw existingError;

    // Split into insert and update operations
    const existingStudentIds = new Set(existingRecords?.map(r => r.student_id) || []);
    const toInsert = recordsToInsertOrUpdate.filter(r => !existingStudentIds.has(r.student_id));
    const toUpdate = recordsToInsertOrUpdate.filter(r => existingStudentIds.has(r.student_id));

    // Insert new records
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("attendance")
        .insert(toInsert);

      if (insertError) throw insertError;
    }

    // Update existing records
    for (const record of toUpdate) {
      const { error: updateError } = await supabase
        .from("attendance")
        .update({ status: record.status })
        .eq("class_id", classId)
        .eq("student_id", record.student_id)
        .gte("date", `${attendanceDate}T00:00:00`)
        .lte("date", `${attendanceDate}T23:59:59`);

      if (updateError) throw updateError;
    }

    res.json({
      message: "Attendance submitted successfully",
      submitted: recordsToInsertOrUpdate.length,
      inserted: toInsert.length,
      updated: toUpdate.length
    });
  } catch (err) {
    console.error("Error submitting attendance:", err);
    res.status(500).json({
      message: "Error submitting attendance",
      error: err.message
    });
  }
});

// Get attendance report for a class on a date
router.get("/attendance-report/:classId/:date", verifyTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId, date } = req.params;

    // Verify this teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id, name")
      .eq("id", classId)
      .single();

    if (classError || !classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to view this class" });
    }

    const attendanceDate = new Date(date).toISOString().split('T')[0];

    // Get all students in class
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("student_id, users!enrollments_student_id_fkey(id, name, email)")
      .eq("class_id", classId);

    if (enrollError) throw enrollError;

    // Get attendance for this date
    const { data: attendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("*")
      .eq("class_id", classId)
      .gte("date", `${attendanceDate}T00:00:00`)
      .lte("date", `${attendanceDate}T23:59:59`);

    if (attendanceError) throw attendanceError;

    // Combine data
    const report = enrollments.map(enrollment => {
      const studentId = enrollment.users?.id || enrollment.student_id;
      const attendanceRecord = attendance?.find(a => a.student_id === studentId);
      const email = enrollment.users?.email || '';
      const name = enrollment.users?.name || (email ? email.split('@')[0] : 'Unknown');
      
      return {
        student_id: studentId,
        student_name: name,
        student_email: email,
        status: attendanceRecord?.status || 'absent',
        marked_at: attendanceRecord?.created_at || null
      };
    });

    res.json({
      class_name: classData.name,
      date: attendanceDate,
      report: report,
      summary: {
        present: report.filter(r => r.status === 'present').length,
        absent: report.filter(r => r.status === 'absent').length,
        late: report.filter(r => r.status === 'late').length,
        total: report.length
      }
    });
  } catch (err) {
    console.error("Error fetching attendance report:", err);
    res.status(500).json({
      message: "Error fetching attendance report",
      error: err.message
    });
  }
});

// Upload/Update marks for students in a class
router.post("/upload-marks", verifyTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId, section, marksData } = req.body;

    if (!classId || !section || !marksData || !Array.isArray(marksData)) {
      return res.status(400).json({ message: "classId, section, and marksData array are required" });
    }

    // Map section to column name
    const sectionColumns = {
      'st1': 'st1_marks',
      'st2': 'st2_marks',
      'evaluation': 'evaluation_marks',
      'end_term': 'end_term_marks'
    };

    const columnName = sectionColumns[section];
    if (!columnName) {
      return res.status(400).json({ message: "Invalid section. Must be: st1, st2, evaluation, or end_term" });
    }

    // Verify this teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id, name")
      .eq("id", classId)
      .single();

    if (classError || !classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to upload marks for this class" });
    }

    // Validate marks data
    for (const item of marksData) {
      if (!item.student_id || item.marks === undefined) {
        return res.status(400).json({ message: "Each entry must have student_id and marks" });
      }
      if (item.marks < 0 || item.marks > 100) {
        return res.status(400).json({ message: "Marks must be between 0 and 100" });
      }
    }

    // Verify all students are enrolled in this class
    const studentIds = marksData.map(m => m.student_id);
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", classId)
      .in("student_id", studentIds);

    if (enrollError) throw enrollError;

    const enrolledStudentIds = new Set(enrollments.map(e => e.student_id));
    const invalidStudents = studentIds.filter(id => !enrolledStudentIds.has(id));
    
    if (invalidStudents.length > 0) {
      return res.status(400).json({ 
        message: "Some students are not enrolled in this class",
        invalidStudents 
      });
    }

    // Update marks in enrollments table for the specific section
    let updated = 0;
    const errors = [];

    for (const item of marksData) {
      const updateData = {};
      updateData[columnName] = parseFloat(item.marks);

      const { data, error } = await supabase
        .from("enrollments")
        .update(updateData)
        .eq("class_id", classId)
        .eq("student_id", item.student_id)
        .select();

      if (error) {
        errors.push({ student_id: item.student_id, error: error.message });
      } else if (data && data.length > 0) {
        updated++;
      }
    }

    if (errors.length > 0) {
      return res.status(500).json({
        message: "Some marks failed to update",
        updated,
        errors
      });
    }

    res.json({
      message: "Marks uploaded successfully",
      uploaded: updated,
      className: classData.name
    });
  } catch (err) {
    console.error("Error uploading marks:", err);
    res.status(500).json({
      message: "Error uploading marks",
      error: err.message
    });
  }
});

// Get marks for a specific class
router.get("/marks/:classId", verifyTeacher, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId } = req.params;

    // Verify this teacher owns this class
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id, name")
      .eq("id", classId)
      .single();

    if (classError || !classData || classData.teacher_id !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to view marks for this class" });
    }

    // Get all marks for this class with student details from enrollments
    const { data: enrollments, error: marksError } = await supabase
      .from("enrollments")
      .select(`
        marks,
        student_id,
        users!enrollments_student_id_fkey (id, name, email)
      `)
      .eq("class_id", classId)
      .order("marks", { ascending: false });

    if (marksError && marksError.code !== 'PGRST116') throw marksError;

    res.json({
      className: classData.name,
      marks: enrollments || []
    });
  } catch (err) {
    console.error("Error fetching marks:", err);
    res.status(500).json({
      message: "Error fetching marks",
      error: err.message
    });
  }
});

module.exports = router;
