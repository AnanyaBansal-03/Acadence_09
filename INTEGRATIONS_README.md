# 🔗 Acadence Integrations Module

## Overview

The Integrations Module allows Acadence to connect with external academic platforms, creating a unified hub for all student activities.

## Quick Start

### 1. Test Setup
```bash
cd backend
node scripts/testIntegrationSetup.js
```

### 2. Setup Google Classroom
Follow: [`GOOGLE_CLASSROOM_INTEGRATION_GUIDE.md`](../GOOGLE_CLASSROOM_INTEGRATION_GUIDE.md)

### 3. Start Services
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ACADENCE PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Student   │  │   Teacher   │  │    Admin    │         │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │         │
│  └──────┬──────┘  └─────────────┘  └─────────────┘         │
│         │                                                     │
│         │  ┌─────────────────────────────────────┐          │
│         └─→│   Integrations Module                │          │
│            ├─────────────────────────────────────┤          │
│            │  • Google Classroom                  │          │
│            │  • GitHub (coming soon)              │          │
│            │  • Zoom (coming soon)                │          │
│            │  • Notion (coming soon)              │          │
│            │  • Microsoft Teams (coming soon)     │          │
│            │  • Moodle (coming soon)              │          │
│            └────────────┬─────────────────────────┘          │
│                         │                                     │
│            ┌────────────▼─────────────────────────┐          │
│            │   Integration Sync Service           │          │
│            │   (Runs every 3 hours)               │          │
│            └────────────┬─────────────────────────┘          │
│                         │                                     │
│            ┌────────────▼─────────────────────────┐          │
│            │   Supabase Database                  │          │
│            │   • user_integrations                │          │
│            │   • external_assignments             │          │
│            │   • external_courses                 │          │
│            │   • integration_sync_logs            │          │
│            └──────────────────────────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ OAuth2 / APIs
                         ▼
        ┌────────────────────────────────────┐
        │   External Platforms                │
        ├────────────────────────────────────┤
        │  📚 Google Classroom                │
        │  🐙 GitHub                          │
        │  📹 Zoom                            │
        │  📝 Notion                          │
        │  💼 Microsoft Teams                 │
        │  🎓 Moodle                          │
        └────────────────────────────────────┘
```

## Features

### ✅ Currently Available
- **Google Classroom Integration**
  - OAuth2 authentication
  - Course synchronization
  - Assignment tracking
  - Due date management
  - Auto-sync every 3 hours
  - Manual sync trigger
  - Connection status monitoring

### 🚧 Coming Soon
- GitHub integration (repos, commits, PRs)
- Zoom integration (meetings, recordings)
- Notion integration (notes, tasks)
- Microsoft Teams integration
- Moodle integration

## File Structure

```
backend/
├── routes/
│   └── integrations.js              # Integration API routes
├── services/
│   ├── googleClassroomService.js    # Google Classroom API wrapper
│   └── integrationSyncService.js    # Auto-sync background service
└── scripts/
    ├── createIntegrationsTables.sql # Database schema
    └── testIntegrationSetup.js      # Setup verification script

frontend/
└── src/
    └── components/
        └── student/
            ├── StudentIntegrations.jsx           # Main integrations page
            └── GoogleClassroomIntegration.jsx    # Google Classroom UI
```

## API Endpoints

### Google Classroom

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/google-classroom/auth` | Get OAuth URL |
| GET | `/api/integrations/google-classroom/callback` | OAuth callback |
| POST | `/api/integrations/google-classroom/sync` | Manual sync |
| GET | `/api/integrations/google-classroom/status` | Connection status |
| DELETE | `/api/integrations/google-classroom/disconnect` | Disconnect |
| GET | `/api/integrations/google-classroom/assignments` | Get assignments |
| GET | `/api/integrations/google-classroom/courses` | Get courses |

### General

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/all` | Get all user's integrations |

## Database Schema

### user_integrations
Stores OAuth tokens and connection status

### external_assignments
Stores synced assignments from external platforms

### external_courses
Stores synced courses from external platforms

### integration_sync_logs
Tracks all sync operations for auditing

## Configuration

### Environment Variables
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-classroom/callback
FRONTEND_URL=http://localhost:5173
```

## Security

- ✅ OAuth2 secure authentication
- ✅ Encrypted token storage
- ✅ Automatic token refresh
- ✅ HTTPS in production
- ✅ JWT-based API authentication
- ✅ Rate limiting ready

## Monitoring

### Check Sync Status
```sql
SELECT * FROM integration_sync_logs 
ORDER BY created_at DESC LIMIT 10;
```

### Active Integrations
```sql
SELECT COUNT(*) FROM user_integrations 
WHERE is_active = true;
```

### Sync Success Rate
```sql
SELECT 
  sync_status,
  COUNT(*) as count
FROM integration_sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY sync_status;
```

## Adding New Integrations

### Step 1: Create Service
```javascript
// backend/services/[platform]Service.js
class PlatformService {
  getAuthUrl() { /* ... */ }
  getTokens(code) { /* ... */ }
  fetchData() { /* ... */ }
}
```

### Step 2: Add Routes
```javascript
// backend/routes/integrations.js
router.get('/[platform]/auth', authMiddleware, async (req, res) => {
  // OAuth flow
});
```

### Step 3: Create Frontend Component
```jsx
// frontend/src/components/student/[Platform]Integration.jsx
const PlatformIntegration = () => {
  // UI component
};
```

### Step 4: Update Integration List
```javascript
// frontend/src/components/student/StudentIntegrations.jsx
const availableIntegrations = [
  {
    id: '[platform]',
    name: 'Platform Name',
    status: 'available',
    component: PlatformIntegration
  }
];
```

## Troubleshooting

### Common Issues

**OAuth Error: Invalid Redirect URI**
- Check Google Cloud Console redirect URIs
- Ensure exact match including protocol

**No Data Syncing**
- Check sync logs: `SELECT * FROM integration_sync_logs`
- Verify token hasn't expired
- Check platform API status

**Service Not Starting**
- Run test script: `node scripts/testIntegrationSetup.js`
- Check environment variables
- Verify database tables exist

## Support

See detailed guides:
- [`GOOGLE_CLASSROOM_INTEGRATION_GUIDE.md`](../GOOGLE_CLASSROOM_INTEGRATION_GUIDE.md)
- [`INTEGRATION_SUMMARY.md`](../INTEGRATION_SUMMARY.md)

## License

Part of Acadence Platform
