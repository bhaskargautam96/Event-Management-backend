-- Migration: Add specifications and features columns to events table

-- Add specifications column (JSONB for flexible data structure)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

-- Add features column (JSONB array for listing features)
ALTER TABLE events
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Create index for features array search
CREATE INDEX IF NOT EXISTS idx_events_features ON events USING gin(features);

-- Sample JSONB structure comments:
-- specifications: {"capacity": "1000 people", "duration": "3 hours", "ageLimit": "18+", "dressCode": "Formal"}
-- features: ["Live Music", "Food & Beverages", "Networking Sessions", "Workshops", "Photo Booth"]
