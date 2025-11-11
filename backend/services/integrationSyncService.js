const cron = require('node-cron');
const supabase = require('../db');
const googleClassroomService = require('./googleClassroomService');

/**
 * Google Classroom Auto-Sync Service
 * Automatically syncs data for all connected users every 3 hours
 */

class IntegrationSyncService {
  constructor() {
    this.isRunning = false;
    this.syncJob = null;
  }

  /**
   * Start the auto-sync scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Integration sync service is already running');
      return;
    }

    // Run every 3 hours: '0 */3 * * *'
    // For testing, use '*/5 * * * *' (every 5 minutes)
    this.syncJob = cron.schedule('0 */3 * * *', async () => {
      console.log('🔄 Starting scheduled Google Classroom sync...');
      await this.syncAllUsers();
    });

    this.isRunning = true;
    console.log('✅ Integration auto-sync service started (runs every 3 hours)');
  }

  /**
   * Stop the auto-sync scheduler
   */
  stop() {
    if (this.syncJob) {
      this.syncJob.stop();
      this.isRunning = false;
      console.log('⏹️  Integration auto-sync service stopped');
    }
  }

  /**
   * Sync Google Classroom data for all active integrations
   */
  async syncAllUsers() {
    try {
      // Get all active Google Classroom integrations
      const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select('id, user_id, access_token, refresh_token, token_expiry')
        .eq('platform', 'google_classroom')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error fetching integrations:', error);
        return;
      }

      if (!integrations || integrations.length === 0) {
        console.log('ℹ️  No active Google Classroom integrations found');
        return;
      }

      console.log(`📊 Found ${integrations.length} active integrations to sync`);

      let successCount = 0;
      let failureCount = 0;

      // Sync each user's data
      for (const integration of integrations) {
        try {
          await this.syncUserData(integration);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to sync user ${integration.user_id}:`, error.message);
          failureCount++;
        }
      }

      console.log(`✅ Sync completed: ${successCount} successful, ${failureCount} failed`);
    } catch (error) {
      console.error('❌ Error in syncAllUsers:', error);
    }
  }

  /**
   * Sync Google Classroom data for a specific user
   * @param {Object} integration - User integration record
   */
  async syncUserData(integration) {
    const { id: integrationId, user_id: userId, access_token, refresh_token, token_expiry } = integration;

    try {
      // Check if token is expired and refresh if needed
      const now = new Date();
      let currentAccessToken = access_token;

      if (new Date(token_expiry) <= now) {
        console.log(`🔄 Refreshing token for user ${userId}...`);
        const newTokens = await googleClassroomService.refreshAccessToken(refresh_token);
        
        // Update tokens in database
        await supabase
          .from('user_integrations')
          .update({
            access_token: newTokens.access_token,
            token_expiry: new Date(Date.now() + newTokens.expires_in * 1000),
            updated_at: new Date()
          })
          .eq('id', integrationId);

        currentAccessToken = newTokens.access_token;
      }

      // Set credentials for API calls
      googleClassroomService.setCredentials({
        access_token: currentAccessToken,
        refresh_token: refresh_token
      });

      // Start sync log
      const { data: syncLog, error: syncLogError } = await supabase
        .from('integration_sync_logs')
        .insert({
          integration_id: integrationId,
          user_id: userId,
          platform: 'google_classroom',
          sync_status: 'started'
        })
        .select()
        .single();

      if (syncLogError) throw syncLogError;

      // Fetch courses
      const courses = await googleClassroomService.getCourses();
      
      // Store courses
      for (const course of courses) {
        const formattedCourse = googleClassroomService.formatCourseForDB(course, userId);
        
        await supabase
          .from('external_courses')
          .upsert({
            ...formattedCourse,
            integration_id: integrationId,
            synced_at: new Date()
          }, {
            onConflict: 'user_id,source,external_id'
          });
      }

      // Fetch all coursework
      const allCourseWork = await googleClassroomService.getAllCourseWork();
      
      // Store assignments
      for (const work of allCourseWork) {
        const formattedWork = googleClassroomService.formatCourseWorkForDB(work, userId);
        
        await supabase
          .from('external_assignments')
          .upsert({
            ...formattedWork,
            integration_id: integrationId,
            synced_at: new Date()
          }, {
            onConflict: 'user_id,source,external_id'
          });
      }

      // Update integration last_synced
      await supabase
        .from('user_integrations')
        .update({ 
          last_synced: new Date(),
          updated_at: new Date()
        })
        .eq('id', integrationId);

      // Complete sync log
      await supabase
        .from('integration_sync_logs')
        .update({
          sync_status: 'success',
          items_synced: allCourseWork.length,
          sync_completed: new Date()
        })
        .eq('id', syncLog.id);

      console.log(`✅ Successfully synced ${allCourseWork.length} items for user ${userId}`);
    } catch (error) {
      // Log sync failure
      try {
        await supabase
          .from('integration_sync_logs')
          .insert({
            integration_id: integrationId,
            user_id: userId,
            platform: 'google_classroom',
            sync_status: 'failed',
            error_message: error.message,
            sync_started: new Date(),
            sync_completed: new Date()
          });
      } catch (logError) {
        console.error('Failed to log sync error:', logError);
      }

      throw error;
    }
  }

  /**
   * Manually trigger sync for a specific user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Sync result
   */
  async syncUser(userId) {
    try {
      const { data: integration, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'google_classroom')
        .eq('is_active', true)
        .single();

      if (error || !integration) {
        throw new Error('No active Google Classroom integration found');
      }

      await this.syncUserData(integration);
      return { success: true, message: 'Sync completed successfully' };
    } catch (error) {
      console.error('Error in manual sync:', error);
      return { success: false, message: error.message };
    }
  }
}

// Create singleton instance
const integrationSyncService = new IntegrationSyncService();

module.exports = integrationSyncService;
