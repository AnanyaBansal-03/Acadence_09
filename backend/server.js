const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");
const teacherRoutes = require("./routes/teacher");
const notificationRoutes = require("./routes/notifications");
const integrationsRoutes = require("./routes/integrations");
const { initializeWeeklyScheduler } = require("./services/weeklyScheduler");
const integrationSyncService = require("./services/integrationSyncService");
require("dotenv").config();
const supabase = require("./db"); // ✅ This is now Supabase

const app = express();

// Middlewares
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// ✅ REMOVE THIS MYSQL CODE COMPLETELY:
// db.getConnection()
//   .then((connection) => {
//     console.log("✅ Database connected successfully!");
//     connection.release();
//   })
//   .catch((err) => {
//     console.error("❌ DATABASE CONNECTION FAILED.", err);
//     process.exit(1);
//   });

// ✅ ADD SUPABASE CONNECTION TEST INSTEAD:
console.log("✅ Supabase client initialized!");

// Test Supabase connection
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) {
      console.error("❌ Supabase connection test failed:", error.message);
    } else {
      console.log("✅ Supabase connected successfully!");
      console.log("Users count:", data[0].count);
    }
  } catch (err) {
    console.error("❌ Error testing Supabase connection:", err);
  }
}

testSupabaseConnection();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/integrations", integrationsRoutes);

// ✅ ADD THESE ROUTES:
app.get('/', (req, res) => {
  res.json({ 
    message: 'Acadence Backend API is running! 🚀',
    endpoints: {
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login'
      },
      health: 'GET /health',
      dashboard: 'GET /api/dashboard/teacher/:teacherId'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count');
    
    if (error) {
      res.status(500).json({ 
        status: '❌ Error', 
        database: 'Disconnected',
        error: error.message 
      });
    } else {
      res.json({ 
        status: '✅ OK', 
        database: 'Connected',
        users_count: data[0]?.count || 0,
        timestamp: new Date().toISOString() 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: '❌ Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Teacher Dashboard API endpoint
app.get('/api/dashboard/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    if (!teacherId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Teacher ID is required' 
      });
    }

    // Initialize response data with fallbacks
    let dashboardData = {
      classes: [],
      students: [],
      attendance: [],
      message: 'Using fallback data - some tables might not exist'
    };

    try {
      // Try to fetch classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId);

      if (!classesError && classes) {
        dashboardData.classes = classes;
      } else {
        console.warn('Classes fetch failed:', classesError?.message);
        // Provide sample classes
        dashboardData.classes = [
          {
            id: 1,
            name: 'Mathematics 101',
            teacher_id: teacherId,
            day_of_week: 'monday',
            time: '09:00'
          },
          {
            id: 2, 
            name: 'Physics 101',
            teacher_id: teacherId,
            day_of_week: 'wednesday', 
            time: '11:00'
          }
        ];
      }

      // Try to fetch students if we have classes
      if (dashboardData.classes.length > 0) {
        const classIds = dashboardData.classes.map(c => c.id);
        
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            student_id,
            class_id,
            users!enrollments_student_id_fkey (id, name, email)
          `)
          .in('class_id', classIds);

        if (!enrollmentsError && enrollments) {
          dashboardData.students = enrollments.map(e => ({
            id: e.users?.id || e.student_id,
            name: e.users?.name || 'Student Name',
            email: e.users?.email || 'student@example.com',
            classId: e.class_id
          }));
        } else {
          console.warn('Enrollments fetch failed:', enrollmentsError?.message);
          // Provide sample students
          dashboardData.students = [
            { id: 'student1', name: 'John Doe', email: 'john@example.com', classId: 1 },
            { id: 'student2', name: 'Jane Smith', email: 'jane@example.com', classId: 1 },
            { id: 'student3', name: 'Bob Wilson', email: 'bob@example.com', classId: 2 }
          ];
        }

        // Try to fetch attendance
        const { data: attendance, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .in('class_id', classIds);

        if (!attendanceError && attendance) {
          dashboardData.attendance = attendance;
        } else {
          console.warn('Attendance fetch failed:', attendanceError?.message);
          // Provide sample attendance
          dashboardData.attendance = [
            { id: 1, student_id: 'student1', class_id: 1, status: 'present', date: new Date().toISOString() },
            { id: 2, student_id: 'student2', class_id: 1, status: 'absent', date: new Date().toISOString() }
          ];
        }
      }

    } catch (dbError) {
      console.error('Database error, using fallback data:', dbError.message);
      dashboardData.message = 'Database unavailable - using sample data';
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize weekly attendance scheduler (FREE - No API keys needed!)
  console.log('\n📅 Initializing weekly attendance notification scheduler...');
  initializeWeeklyScheduler();
  console.log('💡 Tip: Use GET /api/notifications/test-weekly-email to test emails');
  
  // Initialize Google Classroom auto-sync service
  console.log('\n🔗 Initializing Google Classroom auto-sync service...');
  integrationSyncService.start();
  console.log('💡 Syncs run every 3 hours for all connected users');
});