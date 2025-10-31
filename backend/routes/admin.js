const express = require("express");
const router = express.Router();
const supabase = require("../db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// GET all classes
router.get("/classes", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*, users!classes_teacher_id_fkey(id, name, email)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching classes", error: err.message });
  }
});

// CREATE class
router.post("/classes", verifyAdmin, async (req, res) => {
  try {
    const { name, day_of_week, schedule_time, teacher_id } = req.body;

    if (!name || !day_of_week || !schedule_time || !teacher_id) {
      return res.status(400).json({ message: "All fields required" });
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({
        name,
        day_of_week,
        schedule_time,
        teacher_id: parseInt(teacher_id),
      })
      .select("*, users!classes_teacher_id_fkey(id, name, email)")
      .single();

    if (error) throw error;
    res.json({ message: "Class created successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error creating class", error: err.message });
  }
});

// DELETE class
router.delete("/classes/:id", verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", parseInt(req.params.id));

    if (error) throw error;
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting class", error: err.message });
  }
});

// GET all enrollments
router.get("/enrollments", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        "*, users!enrollments_student_id_fkey(id, name, email), classes(id, name)"
      );

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching enrollments", error: err.message });
  }
});

// CREATE enrollment
router.post("/enrollments", verifyAdmin, async (req, res) => {
  try {
    const { student_id, class_id } = req.body;

    if (!student_id || !class_id) {
      return res.status(400).json({ message: "Student and class required" });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", parseInt(student_id))
      .eq("class_id", parseInt(class_id))
      .single();

    if (existing) {
      return res
        .status(400)
        .json({ message: "Student already enrolled in this class" });
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: parseInt(student_id),
        class_id: parseInt(class_id),
      })
      .select(
        "*, users!enrollments_student_id_fkey(id, name, email), classes(id, name)"
      )
      .single();

    if (error) throw error;
    res.json({ message: "Enrollment created successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error creating enrollment", error: err.message });
  }
});

// DELETE enrollment
router.delete("/enrollments/:id", verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", parseInt(req.params.id));

    if (error) throw error;
    res.json({ message: "Enrollment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting enrollment", error: err.message });
  }
});

// UPDATE marks
router.put("/enrollments/:id/marks", verifyAdmin, async (req, res) => {
  try {
    const { marks } = req.body;

    if (marks === undefined || marks < 0 || marks > 100) {
      return res.status(400).json({ message: "Marks must be between 0-100" });
    }

    const { data, error } = await supabase
      .from("enrollments")
      .update({ marks: parseInt(marks) })
      .eq("id", parseInt(req.params.id))
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Marks updated successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error updating marks", error: err.message });
  }
});

// GET all users (admin only)
router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

// CREATE user
router.post("/users", verifyAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!["admin", "teacher", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        role,
      })
      .select("id, name, email, role, created_at")
      .single();

    if (error) throw error;
    res.json({ message: "User created successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error creating user", error: err.message });
  }
});

// DELETE user
router.delete("/users/:id", verifyAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", parseInt(req.params.id));

    if (error) throw error;
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

// GET all marks with filters
router.get("/marks", verifyAdmin, async (req, res) => {
  try {
    const { classId, studentId } = req.query;
    
    let query = supabase
      .from("enrollments")
      .select(`
        marks,
        student_id,
        class_id,
        users!enrollments_student_id_fkey (id, name, email),
        classes (id, name, day_of_week, schedule_time)
      `);

    if (classId) {
      query = query.eq("class_id", parseInt(classId));
    }
    
    if (studentId) {
      query = query.eq("student_id", parseInt(studentId));
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Filter out entries without marks (optional)
    const marksData = (data || []).map(enrollment => ({
      student_id: enrollment.student_id,
      class_id: enrollment.class_id,
      marks: enrollment.marks,
      users: enrollment.users,
      classes: enrollment.classes
    }));
    
    res.json(marksData);
  } catch (err) {
    res.status(500).json({ message: "Error fetching marks", error: err.message });
  }
});

// UPDATE marks (admin can override teacher marks)
router.put("/marks/:classId/:studentId", verifyAdmin, async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { marks } = req.body;

    if (marks === undefined || marks < 0 || marks > 100) {
      return res.status(400).json({ message: "Marks must be between 0-100" });
    }

    const { data, error } = await supabase
      .from("enrollments")
      .update({ marks: parseFloat(marks) })
      .eq("class_id", parseInt(classId))
      .eq("student_id", parseInt(studentId))
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Marks updated successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error updating marks", error: err.message });
  }
});

// DELETE marks (set to NULL)
router.delete("/marks/:classId/:studentId", verifyAdmin, async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const { error } = await supabase
      .from("enrollments")
      .update({ marks: null })
      .eq("class_id", parseInt(classId))
      .eq("student_id", parseInt(studentId));

    if (error) throw error;
    res.json({ message: "Marks deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting marks", error: err.message });
  }
});

module.exports = router;
