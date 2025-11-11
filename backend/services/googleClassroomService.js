const { google } = require('googleapis');
require('dotenv').config();

/**
 * Google Classroom Service
 * Handles all interactions with Google Classroom API
 */

class GoogleClassroomService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth2 authorization URL
   * @returns {string} Authorization URL
   */
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      'https://www.googleapis.com/auth/classroom.announcements.readonly',
      'https://www.googleapis.com/auth/classroom.rosters.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from OAuth callback
   * @returns {Object} Token information
   */
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  /**
   * Set credentials for API calls
   * @param {Object} tokens - Access and refresh tokens
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} New tokens
   */
  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user's Google Classroom courses
   * @returns {Array} List of courses
   */
  async getCourses() {
    try {
      const classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
      const response = await classroom.courses.list({
        courseStates: ['ACTIVE'],
        pageSize: 50
      });

      return response.data.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch Google Classroom courses');
    }
  }

  /**
   * Get coursework (assignments) for a specific course
   * @param {string} courseId - Course ID
   * @returns {Array} List of coursework
   */
  async getCourseWork(courseId) {
    try {
      const classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
      const response = await classroom.courses.courseWork.list({
        courseId: courseId,
        pageSize: 50
      });

      return response.data.courseWork || [];
    } catch (error) {
      console.error(`Error fetching coursework for course ${courseId}:`, error);
      throw new Error('Failed to fetch coursework');
    }
  }

  /**
   * Get all coursework across all active courses
   * @returns {Array} List of all coursework with course info
   */
  async getAllCourseWork() {
    try {
      const courses = await this.getCourses();
      const allCourseWork = [];

      for (const course of courses) {
        try {
          const courseWork = await this.getCourseWork(course.id);
          
          // Add course information to each assignment
          const enrichedCourseWork = courseWork.map(work => ({
            ...work,
            courseName: course.name,
            courseId: course.id,
            courseSection: course.section || null,
            courseRoom: course.room || null
          }));

          allCourseWork.push(...enrichedCourseWork);
        } catch (error) {
          console.error(`Skipping course ${course.id} due to error:`, error.message);
          // Continue with other courses even if one fails
        }
      }

      return allCourseWork;
    } catch (error) {
      console.error('Error fetching all coursework:', error);
      throw new Error('Failed to fetch all coursework');
    }
  }

  /**
   * Get student submissions for a coursework item
   * @param {string} courseId - Course ID
   * @param {string} courseWorkId - Coursework ID
   * @param {string} userId - Student user ID (optional)
   * @returns {Array} List of submissions
   */
  async getSubmissions(courseId, courseWorkId, userId = 'me') {
    try {
      const classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
      const response = await classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: courseWorkId,
        userId: userId
      });

      return response.data.studentSubmissions || [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw new Error('Failed to fetch submissions');
    }
  }

  /**
   * Get user profile information
   * @returns {Object} User profile
   */
  async getUserProfile() {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Format coursework for database storage
   * @param {Object} courseWork - Raw coursework from API
   * @param {number} userId - Acadence user ID
   * @returns {Object} Formatted assignment data
   */
  formatCourseWorkForDB(courseWork, userId) {
    return {
      user_id: userId,
      source: 'google_classroom',
      external_id: courseWork.id,
      course_id: courseWork.courseId,
      course_name: courseWork.courseName || 'Unknown Course',
      title: courseWork.title,
      description: courseWork.description || null,
      due_date: courseWork.dueDate ? this.parseDueDate(courseWork.dueDate, courseWork.dueTime) : null,
      status: courseWork.state === 'PUBLISHED' ? 'pending' : courseWork.state.toLowerCase(),
      points: courseWork.maxPoints || null,
      link: courseWork.alternateLink || null
    };
  }

  /**
   * Parse Google Classroom date format
   * @param {Object} dueDate - Date object from API
   * @param {Object} dueTime - Time object from API
   * @returns {Date} JavaScript Date object
   */
  parseDueDate(dueDate, dueTime) {
    if (!dueDate) return null;

    const { year, month, day } = dueDate;
    const hours = dueTime?.hours || 23;
    const minutes = dueTime?.minutes || 59;

    return new Date(year, month - 1, day, hours, minutes);
  }

  /**
   * Format course for database storage
   * @param {Object} course - Raw course from API
   * @param {number} userId - Acadence user ID
   * @returns {Object} Formatted course data
   */
  formatCourseForDB(course, userId) {
    return {
      user_id: userId,
      source: 'google_classroom',
      external_id: course.id,
      name: course.name,
      section: course.section || null,
      description: course.descriptionHeading || null,
      room: course.room || null,
      owner_id: course.ownerId,
      enrollment_code: course.enrollmentCode || null,
      course_state: course.courseState,
      alternate_link: course.alternateLink,
      teacher_group_email: course.teacherGroupEmail || null,
      course_group_email: course.courseGroupEmail || null
    };
  }
}

module.exports = new GoogleClassroomService();
