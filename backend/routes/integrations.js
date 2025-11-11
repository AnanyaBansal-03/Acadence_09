const express = require('express');
const router = express.Router();
const supabase = require('../db');
const googleClassroomService = require('../services/googleClassroomService');
const { verifyToken } = require('../middleware/authMiddleware');
require('dotenv').config();

/**
 * @route   GET /api/integrations/google-classroom/auth
 * @desc    Get Google OAuth authorization URL
 * @access  Private
 */
router.get('/google-classroom/auth', verifyToken, async (req, res) => {
  try {
    const authUrl = googleClassroomService.getAuthUrl();
    
    // Store user ID in session or temporary storage to retrieve after OAuth callback
    // For simplicity, we'll pass it as state parameter
    const stateParam = Buffer.from(JSON.stringify({ 
      userId: req.user.id 
    })).toString('base64');
    
    const urlWithState = `${authUrl}&state=${stateParam}`;
    
    res.json({ authUrl: urlWithState });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ message: 'Failed to generate authorization URL' });
  }
});

/**
 * @route   GET /api/integrations/google-classroom/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (but requires valid code and state)
 */
router.get('/google-classroom/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/student/integrations?error=access_denied`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL}/student/integrations?error=invalid_request`);
  }

  try {
    // Decode state to get user ID
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const tokens = await googleClassroomService.getTokensFromCode(code);

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Store tokens in database
    const { data: existingIntegration, error: selectError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google_classroom')
      .single();

    if (existingIntegration) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || existingIntegration.refresh_token,
          token_expiry: tokenExpiry,
          is_active: true,
          updated_at: new Date()
        })
        .eq('id', existingIntegration.id);

      if (updateError) throw updateError;
    } else {
      // Create new integration
      const { error: insertError } = await supabase
        .from('user_integrations')
        .insert({
          user_id: userId,
          platform: 'google_classroom',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: tokenExpiry,
          is_active: true
        });

      if (insertError) throw insertError;
    }

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/student/integrations?status=connected`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/student/integrations?error=connection_failed`);
  }
});

/**
 * @route   POST /api/integrations/google-classroom/sync
 * @desc    Manually trigger Google Classroom data sync
 * @access  Private
 */
router.post('/google-classroom/sync', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's integration
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google_classroom')
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return res.status(404).json({ message: 'Google Classroom not connected' });
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    if (new Date(integration.token_expiry) <= now) {
      const newTokens = await googleClassroomService.refreshAccessToken(integration.refresh_token);
      
      // Update tokens in database
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          access_token: newTokens.access_token,
          token_expiry: new Date(Date.now() + newTokens.expires_in * 1000),
          updated_at: new Date()
        })
        .eq('id', integration.id);

      if (updateError) throw updateError;

      integration.access_token = newTokens.access_token;
    }

    // Set credentials for API calls
    googleClassroomService.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token
    });

    // Start sync log
    const { data: syncLog, error: syncLogError } = await supabase
      .from('integration_sync_logs')
      .insert({
        integration_id: integration.id,
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
          integration_id: integration.id,
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
          integration_id: integration.id,
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
      .eq('id', integration.id);

    // Complete sync log
    await supabase
      .from('integration_sync_logs')
      .update({
        sync_status: 'success',
        items_synced: allCourseWork.length,
        sync_completed: new Date()
      })
      .eq('id', syncLog.id);

    res.json({
      message: 'Sync completed successfully',
      coursesCount: courses.length,
      assignmentsCount: allCourseWork.length
    });
  } catch (error) {
    console.error('Error syncing Google Classroom:', error);
    res.status(500).json({ 
      message: 'Failed to sync Google Classroom data',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/integrations/google-classroom/status
 * @desc    Get Google Classroom connection status
 * @access  Private
 */
router.get('/google-classroom/status', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google_classroom')
      .single();

    if (error || !integration) {
      return res.json({ 
        connected: false,
        platform: 'google_classroom'
      });
    }

    res.json({
      connected: true,
      platform: 'google_classroom',
      lastSynced: integration.last_synced,
      isActive: integration.is_active
    });
  } catch (error) {
    console.error('Error checking integration status:', error);
    res.status(500).json({ message: 'Failed to check connection status' });
  }
});

/**
 * @route   DELETE /api/integrations/google-classroom/disconnect
 * @desc    Disconnect Google Classroom integration
 * @access  Private
 */
router.delete('/google-classroom/disconnect', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Deactivate integration (soft delete)
    const { error } = await supabase
      .from('user_integrations')
      .update({ 
        is_active: false,
        updated_at: new Date()
      })
      .eq('user_id', userId)
      .eq('platform', 'google_classroom');

    if (error) throw error;

    res.json({ message: 'Google Classroom disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Classroom:', error);
    res.status(500).json({ message: 'Failed to disconnect Google Classroom' });
  }
});

/**
 * @route   GET /api/integrations/google-classroom/assignments
 * @desc    Get all synced Google Classroom assignments
 * @access  Private
 */
router.get('/google-classroom/assignments', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: assignments, error } = await supabase
      .from('external_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'google_classroom')
      .order('due_date', { ascending: true });

    if (error) throw error;

    res.json({ assignments: assignments || [] });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

/**
 * @route   GET /api/integrations/google-classroom/courses
 * @desc    Get all synced Google Classroom courses
 * @access  Private
 */
router.get('/google-classroom/courses', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: courses, error } = await supabase
      .from('external_courses')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'google_classroom')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({ courses: courses || [] });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

/**
 * @route   GET /api/integrations/all
 * @desc    Get all connected integrations for user
 * @access  Private
 */
router.get('/all', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select('platform, is_active, last_synced, created_at')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    res.json({ integrations: integrations || [] });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ message: 'Failed to fetch integrations' });
  }
});

module.exports = router;
