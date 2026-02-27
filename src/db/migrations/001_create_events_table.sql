-- Create events table in PostgreSQL
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- Category references (store as integers or UUIDs)
    type_id VARCHAR(50) NOT NULL,
    sub_type_id VARCHAR(50),
    
    -- Images stored as JSONB array
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Location stored as JSONB
    location JSONB NOT NULL,
    
    -- Event timing
    event_date TIMESTAMP NOT NULL,
    event_time VARCHAR(50),
    duration INTEGER DEFAULT 1,
    
    -- Pricing stored as JSONB
    pricing JSONB NOT NULL,
    
    -- Capacity stored as JSONB
    capacity JSONB DEFAULT '{}'::jsonb,
    
    -- Amenities array stored as JSONB
    amenities JSONB DEFAULT '[]'::jsonb,
    
    -- Specifications stored as JSONB
    specifications JSONB DEFAULT '{}'::jsonb,
    
    -- Features array stored as JSONB
    features JSONB DEFAULT '[]'::jsonb,
    
    -- Tags array stored as JSONB
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- Contact details stored as JSONB
    contact_details JSONB NOT NULL,
    
    -- Organizer reference
    organizer_id VARCHAR(50) NOT NULL,
    organizer_role VARCHAR(20) NOT NULL CHECK (organizer_role IN ('ORGANIZER', 'ADMIN', 'SUPERADMIN')),
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING_APPROVAL' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'PENDING_APPROVAL')),
    
    -- Booking settings stored as JSONB
    booking_settings JSONB DEFAULT '{}'::jsonb,
    
    -- Stats stored as JSONB
    stats JSONB DEFAULT '{"views": 0, "bookings": 0, "rating": 0, "reviewCount": 0}'::jsonb,
    
    -- Featured/Premium flags
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    
    -- Soft delete
    is_delete BOOLEAN DEFAULT FALSE,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_type_id ON events(type_id);
CREATE INDEX IF NOT EXISTS idx_events_sub_type_id ON events(sub_type_id);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_delete ON events(is_delete);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_city ON events((location->>'city'));
CREATE INDEX IF NOT EXISTS idx_events_state ON events((location->>'state'));

-- Create GIN index for full-text search on title and description
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || description));

-- Create GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING gin(tags);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_events_updated_at ON events;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Sample JSONB structure comments:
-- images: [{"url": "https://...", "publicId": "abc123", "resourceType": "image"}]
-- location: {"address": "...", "city": "...", "state": "...", "pincode": "...", "coordinates": {"latitude": 0, "longitude": 0}}
-- pricing: {"basePrice": 10000, "currency": "INR", "isNegotiable": true, "advancePayment": 2000}
-- capacity: {"minGuests": 10, "maxGuests": 100}
-- contact_details: {"name": "...", "phone": "...", "email": "...", "whatsapp": "..."}
-- booking_settings: {"isBookingOpen": true, "autoApprove": false, "cancellationPolicy": "..."}
