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
    const { name, day_of_week, schedule_time, duration_hours, teacher_id, group_name } = req.body;

    if (!name || !day_of_week || !schedule_time || !teacher_id || !group_name) {
      return res.status(400).json({ message: "All fields including group are required" });
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({
        name,
        day_of_week,
        start_time: schedule_time,
        duration_hours: duration_hours || 1.0,
        teacher_id: parseInt(teacher_id),
        group_name: group_name
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

// GET unique subjects (for enrollment dropdown)
router.get("/subjects", verifyAdmin, async (req, res) => {
  try {
    const { group_name } = req.query;
    
    let query = supabase
      .from("classes")
      .select("subject_code, name, group_name, day_of_week, start_time")
      .not("subject_code", "is", null)
      .order("subject_code");

    if (group_name) {
      query = query.eq("group_name", group_name);
    }

    const { data: classes, error: classError } = await query;
    
    if (classError) throw classError;

    // Group classes by subject_code
    const subjectsMap = {};
    classes.forEach(cls => {
      if (!subjectsMap[cls.subject_code]) {
        subjectsMap[cls.subject_code] = {
          subject_code: cls.subject_code,
          subject_name: cls.subject_code,
          group_name: cls.group_name,
          sessions: []
        };
      }
      subjectsMap[cls.subject_code].sessions.push({
        day: cls.day_of_week,
        time: cls.start_time
      });
    });

    const subjects = Object.values(subjectsMap);
    
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching subjects", error: err.message });
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

// SUBJECT-BASED ENROLLMENT - Enroll students in all classes of a subject
router.post("/enrollments/subject", verifyAdmin, async (req, res) => {
  try {
    const { student_ids, subject_code, group_name } = req.body;

    if (!student_ids || !subject_code || !group_name || student_ids.length === 0) {
      return res.status(400).json({ 
        message: "Student IDs, subject code, and group name are required" 
      });
    }

    // Get all classes for this subject and group
    // Try subject_code first, fallback to matching class name prefix
    let query = supabase
      .from("classes")
      .select("id, name, day_of_week, subject_code");
    
    // First try exact subject_code match
    const { data: subjectClasses, error: classError } = await query
      .eq("group_name", group_name)
      .or(`subject_code.eq.${subject_code},name.ilike.${subject_code}%`);

    if (classError) throw classError;

    if (!subjectClasses || subjectClasses.length === 0) {
      return res.status(404).json({ 
        message: `No classes found for subject ${subject_code} in group ${group_name}. Please ensure the subject_code field is populated in the database by running the migration script.` 
      });
    }

    let successCount = 0;
    let skipCount = 0;
    const enrollments = [];

    // Enroll each student in all classes of this subject
    for (const studentId of student_ids) {
      for (const classItem of subjectClasses) {
        // Check if already enrolled
        const { data: existing } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", parseInt(studentId))
          .eq("class_id", classItem.id)
          .single();

        if (!existing) {
          const { data: enrollment, error: enrollError } = await supabase
            .from("enrollments")
            .insert({
              student_id: parseInt(studentId),
              class_id: classItem.id,
            })
            .select()
            .single();

          if (!enrollError && enrollment) {
            successCount++;
            enrollments.push(enrollment);
          }
        } else {
          skipCount++;
        }
      }
    }

    res.json({ 
      message: `Enrolled ${student_ids.length} student(s) in ${subject_code}`,
      details: {
        students: student_ids.length,
        subject: subject_code,
        group: group_name,
        classesPerStudent: subjectClasses.length,
        totalEnrollments: successCount,
        skipped: skipCount,
        classes: subjectClasses.map(c => `${c.name} (${c.day_of_week})`)
      },
      data: enrollments
    });
  } catch (err) {
    console.error("Error in subject-based enrollment:", err);
    res.status(500).json({ 
      message: "Error creating enrollments", 
      error: err.message 
    });
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
      .select("id, name, email, role, group_name, created_at")
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
        st1_marks,
        st2_marks,
        evaluation_marks,
        end_term_marks,
        student_id,
        class_id,
        users!enrollments_student_id_fkey (id, name, email),
        classes (id, name, day_of_week, start_time)
      `);

    if (classId) {
      query = query.eq("class_id", parseInt(classId));
    }
    
    if (studentId) {
      query = query.eq("student_id", parseInt(studentId));
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Include all section marks in response
    const marksData = (data || []).map(enrollment => ({
      student_id: enrollment.student_id,
      class_id: enrollment.class_id,
      marks: enrollment.marks,
      st1: enrollment.st1_marks,
      st2: enrollment.st2_marks,
      evaluation: enrollment.evaluation_marks,
      end_term: enrollment.end_term_marks,
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

// UPDATE user group (assign student to a group)
router.put("/users/:userId/group", verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { group_name } = req.body;

    if (!group_name || !/^G[0-9]+$/.test(group_name)) {
      return res.status(400).json({ message: "Invalid group name. Must be in format G1, G2, etc." });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ group_name })
      .eq("id", parseInt(userId))
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Student group updated successfully", data });
  } catch (err) {
    res.status(500).json({ message: "Error updating student group", error: err.message });
  }
});

// BULK UPDATE student groups
router.put("/users/bulk-group", verifyAdmin, async (req, res) => {
  try {
    const { userIds, user_ids, group_name } = req.body;
    const studentIds = userIds || user_ids; // Support both formats

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    if (!group_name || !/^G[0-9]+$/.test(group_name)) {
      return res.status(400).json({ message: "Invalid group name. Must be in format G1, G2, etc." });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ group_name })
      .in("id", studentIds)
      .select();

    if (error) throw error;
    
    res.json({ 
      message: `${data.length} student(s) assigned to group ${group_name}`,
      updated: data.length,
      data 
    });
  } catch (err) {
    console.error('Bulk group assignment error:', err);
    res.status(500).json({ message: "Error updating student groups", error: err.message });
  }
});

module.exports = router;
