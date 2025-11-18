const { google } = require('googleapis');
const { supabase } = require('./emailService');

class GoogleClassroomService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Generate auth URL for user to connect
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
      'https://www.googleapis.com/auth/classroom.announcements.readonly',
      'https://www.googleapis.com/auth/classroom.rosters.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId.toString() // Pass user ID to identify after callback
    });
  }

  // Exchange code for tokens
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Get user's Google Classroom courses
  async getCourses(userId) {
    try {
      // Get user's tokens from database
      const { data: integration, error } = await supabase
        .from('integration_tokens')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google_classroom')
        .eq('is_active', true)
        .single();

      if (error || !integration) {
        throw new Error('Google Classroom not connected');
      }

      this.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token
      });

      const classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
      const response = await classroom.courses.list({
        pageSize: 20,
        courseStates: ['ACTIVE']
      });

      return response.data.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  // Get assignments (coursework) from a course
  async getCoursework(userId, courseId) {
    try {
      const { data: integration, error } = await supabase
        .from('integration_tokens')
        .select('access_token, refresh_token')
        .eq('user_id', userId)
        .eq('platform', 'google_classroom')
        .eq('is_active', true)
        .single();

      if (error || !integration) {
        throw new Error('Google Classroom not connected');
      }

      this.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token
      });

      const classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
      const response = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 50,
        orderBy: 'dueDate desc'
      });

      return response.data.courseWork || [];
    } catch (error) {
      console.error('Error fetching coursework:', error);
      throw error;
    }
  }

  // Get all assignments across all courses
  async getAllAssignments(userId) {
    try {
      const courses = await this.getCourses(userId);
      const allAssignments = [];

      for (const course of courses) {
        try {
          const coursework = await this.getCoursework(userId, course.id);
          coursework.forEach(work => {
            allAssignments.push({
              id: work.id,
              courseId: course.id,
              courseName: course.name,
              title: work.title,
              description: work.description || '',
              dueDate: work.dueDate ? this.formatDueDate(work.dueDate, work.dueTime) : null,
              maxPoints: work.maxPoints || 0,
              workType: work.workType || 'ASSIGNMENT',
              state: work.state,
              alternateLink: work.alternateLink,
              creationTime: work.creationTime,
              updateTime: work.updateTime
            });
          });
        } catch (error) {
          console.error(`Error fetching coursework for course ${course.id}:`, error);
        }
      }

      return allAssignments;
    } catch (error) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  }

  // Format due date
  formatDueDate(dueDate, dueTime) {
    try {
      const year = dueDate.year;
      const month = String(dueDate.month).padStart(2, '0');
      const day = String(dueDate.day).padStart(2, '0');
      
      if (dueTime) {
        const hours = String(dueTime.hours || 0).padStart(2, '0');
        const minutes = String(dueTime.minutes || 0).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:00Z`;
      }
      
      return `${year}-${month}-${day}T23:59:59Z`;
    } catch (error) {
      return null;
    }
  }

  // Sync assignments to local database
  async syncAssignments(userId) {
    try {
      const assignments = await this.getAllAssignments(userId);
      let syncedCount = 0;

      for (const assignment of assignments) {
        try {
          // Check if assignment already exists
          const { data: existing } = await supabase
            .from('external_assignments')
            .select('id')
            .eq('user_id', userId)
            .eq('source', 'google_classroom')
            .eq('google_id', assignment.id)
            .single();

          if (existing) {
            // Update existing
            await supabase
              .from('external_assignments')
              .update({
                title: assignment.title,
                description: assignment.description,
                due_date: assignment.dueDate,
                max_points: assignment.maxPoints,
                course_name: assignment.courseName,
                link: assignment.alternateLink,
                update_time: new Date().toISOString(),
                synced_at: new Date().toISOString()
              })
              .eq('id', existing.id);
          } else {
            // Insert new
            await supabase
              .from('external_assignments')
              .insert({
                user_id: userId,
                source: 'google_classroom',
                google_id: assignment.id,
                course_id: assignment.courseId,
                course_name: assignment.courseName,
                title: assignment.title,
                description: assignment.description,
                due_date: assignment.dueDate,
                max_points: assignment.maxPoints,
                work_type: assignment.workType,
                state: assignment.state,
                link: assignment.alternateLink
              });
          }
          syncedCount++;
        } catch (error) {
          console.error('Error syncing assignment:', error);
        }
      }

      // Update last sync time
      await supabase
        .from('integration_tokens')
        .update({ last_synced: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform', 'google_classroom');

      return { syncedCount, totalAssignments: assignments.length };
    } catch (error) {
      console.error('Error syncing assignments:', error);
      throw error;
    }
  }

  // Store tokens in database
  async storeTokens(userId, tokens) {
    try {
      const { data, error } = await supabase
        .from('integration_tokens')
        .upsert({
          user_id: userId,
          platform: 'google_classroom',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          is_active: true,
          last_synced: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  // Disconnect Google Classroom
  async disconnect(userId) {
    try {
      await supabase
        .from('integration_tokens')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('platform', 'google_classroom');

      return true;
    } catch (error) {
      console.error('Error disconnecting:', error);
      throw error;
    }
  }
}

module.exports = new GoogleClassroomService();
