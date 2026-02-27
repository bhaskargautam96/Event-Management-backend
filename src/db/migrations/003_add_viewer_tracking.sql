-- Migration: Add viewer tracking for events

-- 1. Add track_viewers flag to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS track_viewers BOOLEAN DEFAULT TRUE;

-- 2. Create event_viewers table to track who viewed the event
CREATE TABLE IF NOT EXISTS event_viewers (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Viewer details
    viewer_id VARCHAR(50), -- NULL for anonymous users
    viewer_email VARCHAR(100),
    viewer_name VARCHAR(100),
    
    -- Tracking info
    ip_address VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    referrer TEXT,
    
    -- View details
    view_duration INTEGER DEFAULT 0, -- in seconds
    view_type VARCHAR(20) DEFAULT 'QUICK' CHECK (view_type IN ('QUICK', 'DETAILED', 'INTERESTED')),
    
    -- Device info
    device_type VARCHAR(20) DEFAULT 'WEB' CHECK (device_type IN ('WEB', 'MOBILE', 'TABLET')),
    
    -- Timestamps
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    is_delete BOOLEAN DEFAULT FALSE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_viewers_event_id ON event_viewers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_viewers_viewer_id ON event_viewers(viewer_id);
CREATE INDEX IF NOT EXISTS idx_event_viewers_viewed_at ON event_viewers(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_viewers_event_date ON event_viewers(event_id, viewed_at DESC);

-- Composite index to get unique viewers per event
CREATE INDEX IF NOT EXISTS idx_event_viewers_unique ON event_viewers(event_id, viewer_id, viewed_at) 
WHERE is_delete = false;

-- Create view for viewer statistics
CREATE OR REPLACE VIEW event_viewer_stats AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    COUNT(DISTINCT CASE WHEN ev.viewer_id IS NOT NULL THEN ev.viewer_id END) as unique_authenticated_viewers,
    COUNT(DISTINCT ev.ip_address) as unique_ips,
    COUNT(ev.id) as total_views,
    COUNT(CASE WHEN ev.view_type = 'DETAILED' THEN 1 END) as detailed_views,
    COUNT(CASE WHEN ev.view_type = 'INTERESTED' THEN 1 END) as interested_views,
    AVG(ev.view_duration) as avg_view_duration,
    MAX(ev.viewed_at) as last_viewed_at
FROM events e
LEFT JOIN event_viewers ev ON e.id = ev.event_id AND ev.is_delete = false
WHERE e.is_delete = false
GROUP BY e.id, e.title;

-- Create view for top viewers (power users)
CREATE OR REPLACE VIEW event_top_viewers AS
SELECT 
    event_id,
    viewer_id,
    viewer_email,
    COUNT(*) as view_count,
    SUM(view_duration) as total_duration,
    MAX(viewed_at) as last_viewed_at
FROM event_viewers
WHERE viewer_id IS NOT NULL 
    AND is_delete = false
GROUP BY event_id, viewer_id, viewer_email
ORDER BY view_count DESC;
