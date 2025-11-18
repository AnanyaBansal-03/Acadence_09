const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const googleClassroomService = require('../services/googleClassroomService');
const { supabase } = require('../services/emailService');

// Get synced assignments
router.get('/google-classroom/synced-assignments', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: assignments, error } = await supabase
      .from('external_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'google_classroom')
      .order('due_date', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      assignments: assignments || []
    });
  } catch (error) {
    console.error('Error fetching synced assignments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch assignments',
      assignments: []
    });
  }
});

// Sync assignments from Google Classroom
router.post('/google-classroom/sync', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if connected
    const { data: integration } = await supabase
      .from('integration_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'google_classroom')
      .eq('is_active', true)
      .single();

    if (!integration) {
      return res.status(400).json({
        success: false,
        message: 'Please connect to Google Classroom first'
      });
    }

    const result = await googleClassroomService.syncAssignments(userId);

    res.json({
      success: true,
      message: `Successfully synced ${result.syncedCount} assignments`,
      synced: result.syncedCount,
      total: result.totalAssignments
    });
  } catch (error) {
    console.error('Error syncing assignments:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to sync assignments'
    });
  }
});

// Get Google Classroom connection status
router.get('/google-classroom/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: integration, error } = await supabase
      .from('integration_tokens')
      .select('created_at, last_synced, is_active')
      .eq('user_id', userId)
      .eq('platform', 'google_classroom')
      .single();

    if (error || !integration || !integration.is_active) {
      return res.json({
        connected: false,
        message: 'Not connected to Google Classroom',
        lastSync: null
      });
    }

    res.json({
      connected: true,
      message: 'Connected to Google Classroom',
      connectedAt: integration.created_at,
      lastSync: integration.last_synced
    });
  } catch (error) {
    console.error('Error checking Google Classroom status:', error);
    res.status(500).json({ 
      connected: false,
      message: 'Failed to check status'
    });
  }
});

// Connect to Google Classroom - Get auth URL
router.get('/google-classroom/connect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const authUrl = googleClassroomService.getAuthUrl(userId);

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate authorization URL'
    });
  }
});

// OAuth callback
router.get('/google-classroom/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const userId = parseInt(state);

    if (!code || !userId) {
      return res.redirect(`${process.env.FRONTEND_URL}/student?error=invalid_callback`);
    }

    // Exchange code for tokens
    const tokens = await googleClassroomService.getTokensFromCode(code);

    // Store tokens in database
    await googleClassroomService.storeTokens(userId, tokens);

    // Redirect back to frontend
    res.redirect(`${process.env.FRONTEND_URL}/student?feature=integrations&connected=true`);
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    res.redirect(`${process.env.FRONTEND_URL}/student?feature=integrations&error=auth_failed`);
  }
});

// Disconnect from Google Classroom
router.post('/google-classroom/disconnect', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await googleClassroomService.disconnect(userId);

    res.json({
      success: true,
      message: 'Successfully disconnected from Google Classroom'
    });
  } catch (error) {
    console.error('Error disconnecting from Google Classroom:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to disconnect'
    });
  }
});

// Get courses
router.get('/google-classroom/courses', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const courses = await googleClassroomService.getCourses(userId);

    res.json({
      success: true,
      courses: courses
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to fetch courses',
      courses: []
    });
  }
});

module.exports = router;
