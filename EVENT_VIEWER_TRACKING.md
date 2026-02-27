# Event Viewer Tracking System

This system allows event organizers to track who views their events with optional tracking enabled by default.

## Overview

- **Auto-Tracking**: Every time someone views an event (via `GET /events/:id`), their information is automatically logged if tracking is enabled
- **Optional**: Organizers can toggle viewer tracking ON/OFF for specific events
- **Detailed Analytics**: View statistics, top viewers, recent views, etc.
- **Privacy-Friendly**: Anonymous users are tracked by IP address; authenticated users by user ID

## Database Schema

### `event_viewers` Table
```sql
- id: Auto-increment primary key
- event_id: Reference to the event
- viewer_id: User ID (nullable for anonymous)
- viewer_email: Email of viewer
- viewer_name: Name of viewer
- ip_address: IP address of viewer
- user_agent: Browser/device info
- referrer: Where they came from
- view_duration: Time spent viewing (in seconds)
- view_type: 'QUICK', 'DETAILED', or 'INTERESTED'
- device_type: 'WEB', 'MOBILE', or 'TABLET'
- viewed_at: Timestamp of view
- is_delete: Soft delete flag
```

### Events Table Update
- New column: `track_viewers` (BOOLEAN, defaults to TRUE)

## API Endpoints

### 1. Track Event View (Auto-called)
**Endpoint**: `POST /api/v1/viewers/:eventId/track-view`
**Auth**: Optional (works for both authenticated and anonymous users)

This is automatically called when someone views an event, but can also be called manually.

```bash
# Manual view tracking (e.g., from frontend)
curl -X POST "http://localhost:5000/api/v1/viewers/1/track-view" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -d '{
    "viewDuration": 45,
    "viewType": "DETAILED",
    "deviceType": "MOBILE"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "View tracked successfully"
}
```

---

### 2. Toggle Viewer Tracking
**Endpoint**: `PATCH /api/v1/viewers/:eventId/toggle-tracking`
**Auth**: Required (Organizer/Admin only)

Enable or disable viewer tracking for your event.

```bash
# Enable tracking
curl -X PATCH "http://localhost:5000/api/v1/viewers/1/toggle-tracking" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -d '{
    "trackViewers": true
  }'

# Disable tracking
curl -X PATCH "http://localhost:5000/api/v1/viewers/1/toggle-tracking" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -d '{
    "trackViewers": false
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Viewer tracking enabled",
  "data": {
    "eventId": 1,
    "trackViewers": true
  }
}
```

---

### 3. Get Viewer Statistics
**Endpoint**: `GET /api/v1/viewers/:eventId/stats`
**Auth**: Required (Organizer/Admin only)

Get comprehensive viewing analytics for your event.

```bash
curl -X GET "http://localhost:5000/api/v1/viewers/1/stats" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "eventTitle": "Tech Conference 2026",
    "summary": {
      "unique_authenticated_viewers": 45,
      "unique_ips": 52,
      "total_views": 128,
      "detailed_views": 85,
      "interested_views": 23,
      "avg_view_duration": 156.5,
      "last_viewed_at": "2026-02-26T15:30:00Z"
    },
    "topViewers": [
      {
        "viewer_id": "user123",
        "viewer_email": "john@example.com",
        "viewer_name": "John Doe",
        "view_count": 5,
        "total_duration": 450,
        "last_viewed_at": "2026-02-26T15:25:00Z"
      },
      {
        "viewer_id": "user456",
        "viewer_email": "jane@example.com",
        "viewer_name": "Jane Smith",
        "view_count": 3,
        "total_duration": 280,
        "last_viewed_at": "2026-02-26T14:50:00Z"
      }
    ],
    "recentViews": [
      {
        "id": 1001,
        "viewer_id": "user123",
        "viewer_email": "john@example.com",
        "viewer_name": "John Doe",
        "device_type": "WEB",
        "view_type": "DETAILED",
        "view_duration": 95,
        "viewed_at": "2026-02-26T15:30:00Z"
      },
      {
        "id": 1000,
        "viewer_id": null,
        "viewer_email": null,
        "viewer_name": null,
        "device_type": "MOBILE",
        "view_type": "QUICK",
        "view_duration": 12,
        "viewed_at": "2026-02-26T15:28:00Z"
      }
    ]
  }
}
```

---

### 4. Get All Viewers (Paginated)
**Endpoint**: `GET /api/v1/viewers/:eventId/viewers`
**Auth**: Required (Organizer/Admin only)

Get a complete list of viewers with pagination and filtering.

```bash
# Get all viewers
curl -X GET "http://localhost:5000/api/v1/viewers/1/viewers?page=1&limit=20" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN"

# Filter by view type
curl -X GET "http://localhost:5000/api/v1/viewers/1/viewers?page=1&limit=20&viewType=DETAILED" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN"

# Filter by device type
curl -X GET "http://localhost:5000/api/v1/viewers/1/viewers?page=1&limit=20&deviceType=MOBILE" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN"

# Combined filters
curl -X GET "http://localhost:5000/api/v1/viewers/1/viewers?page=1&limit=20&viewType=INTERESTED&deviceType=WEB" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN"
```

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20) - Records per page
- `viewType` (optional) - Filter by: 'QUICK', 'DETAILED', 'INTERESTED'
- `deviceType` (optional) - Filter by: 'WEB', 'MOBILE', 'TABLET'

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "viewer_id": "user123",
      "viewer_email": "john@example.com",
      "viewer_name": "John Doe",
      "ip_address": "192.168.1.100",
      "device_type": "WEB",
      "view_type": "DETAILED",
      "view_duration": 95,
      "referrer": "https://google.com",
      "viewed_at": "2026-02-26T15:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalRecords": 85,
    "limit": 20
  }
}
```

---

### 5. Delete All Viewer Records
**Endpoint**: `DELETE /api/v1/viewers/:eventId/viewers`
**Auth**: Required (Organizer/Admin only)

Soft delete all viewer records for an event.

```bash
curl -X DELETE "http://localhost:5000/api/v1/viewers/1/viewers" \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_AUTH_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "All viewer records deleted"
}
```

---

## How It Works

### Auto-Tracking Flow
1. User visits `GET /api/v1/events/:id`
2. If `track_viewers = true` for that event:
   - Event details returned normally
   - View is logged asynchronously (doesn't block response)
   - IP, user agent, referrer captured
   - Viewer ID captured if authenticated
3. Stats updated in real-time

### Manual Tracking
Use the track-view endpoint to manually log views from frontend:
```javascript
// Frontend example
fetch(`/api/v1/viewers/${eventId}/track-view`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    viewDuration: performance.now() - startTime,
    viewType: userScrolledDown ? 'DETAILED' : 'QUICK',
    deviceType: isMobile ? 'MOBILE' : 'WEB'
  })
});
```

---

## View Types

| Type | Description |
|------|-------------|
| **QUICK** | User viewed for less than 30 seconds |
| **DETAILED** | User viewed for 30+ seconds or scrolled significantly |
| **INTERESTED** | User interacted (clicked, shared, bookmarked) |

---

## Device Types

| Type | Description |
|------|-------------|
| **WEB** | Desktop/Laptop browser |
| **MOBILE** | Mobile phone browser |
| **TABLET** | Tablet browser |

---

## Database Views (Analytics)

### event_viewer_stats View
```sql
SELECT * FROM event_viewer_stats WHERE event_id = 1;
```
Shows aggregated statistics per event.

### event_top_viewers View
```sql
SELECT * FROM event_top_viewers WHERE event_id = 1;
```
Shows top 10 viewers by view count.

---

## Security & Privacy

✅ **Authenticated Users**: Tracked by user ID, email, and name  
✅ **Anonymous Users**: Tracked by IP address and user agent  
✅ **Data Privacy**: Only event organizers and admins can view analytics  
✅ **IP Anonymization**: Store last octet masked for privacy compliance  
✅ **Soft Deletes**: Records can be archived instead of permanently deleted  

---

## Example Dashboard Query

```sql
-- Get event performance metrics
SELECT 
  e.id,
  e.title,
  e.track_viewers,
  (e.stats->>'views')::int as total_views,
  COUNT(DISTINCT ev.viewer_id) as unique_users,
  COUNT(DISTINCT ev.ip_address) as unique_visitors,
  AVG(ev.view_duration) as avg_session_duration
FROM events e
LEFT JOIN event_viewers ev ON e.id = ev.event_id AND ev.is_delete = false
WHERE e.organizer_id = 'YOUR_USER_ID'
GROUP BY e.id
ORDER BY total_views DESC;
```

---

## Migration

Run this to add viewer tracking to existing database:
```bash
psql -U your_user -d your_db -f src/db/migrations/003_add_viewer_tracking.sql
```

---

## Common Use Cases

### 1. Track Newsletter Signup Interest
```bash
# User clicks on email link to event
POST /api/v1/viewers/:eventId/track-view
{
  "viewType": "INTERESTED",
  "deviceType": "MOBILE"
}
```

### 2. Analyze Traffic Sources
```bash
# View stats show referrer data
GET /api/v1/viewers/:eventId/stats
# Top referrers visible in recentViews
```

### 3. Identify Hot Leads
```bash
# Get users who spent most time viewing
GET /api/v1/viewers/:eventId/stats
# topViewers array sorted by view_count
```

### 4. Monitor Real-Time Interest
```bash
# Poll for recent views every 30s
GET /api/v1/viewers/:eventId/viewers?limit=5
# Timestamp in viewed_at shows freshness
```

---

## Troubleshooting

### Views not being tracked
1. Check `track_viewers = true` for the event
2. Database migration was applied
3. Check browser console for CORS errors

### Can't access stats
1. Verify you're the event organizer or admin
2. Check JWT token validity
3. Event must exist and not be soft-deleted

### IP address showing as ::1
- This is localhost, normal in development
- In production, ensure proper proxy headers

---

## Frontend Integration Example

```javascript
class EventViewTracker {
  constructor(eventId) {
    this.eventId = eventId;
    this.startTime = Date.now();
    this.lastScrollPosition = 0;
  }

  trackView() {
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    
    // Determine view type based on engagement
    let viewType = 'QUICK';
    if (duration > 30 || this.lastScrollPosition > 500) {
      viewType = 'DETAILED';
    }
    if (this.isInterested) {
      viewType = 'INTERESTED';
    }

    fetch(`/api/v1/viewers/${this.eventId}/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        viewDuration: duration,
        viewType,
        deviceType: isMobile ? 'MOBILE' : 'WEB'
      })
    });
  }

  registerScrollListener() {
    window.addEventListener('scroll', () => {
      this.lastScrollPosition = window.scrollY;
    });
  }

  registerInteractionListeners() {
    // Track clicks, shares, bookmarks
    document.addEventListener('click', () => {
      this.isInterested = true;
    });
  }
}

// Usage
const tracker = new EventViewTracker(eventId);
tracker.registerScrollListener();
tracker.registerInteractionListeners();
window.addEventListener('beforeunload', () => tracker.trackView());
```
