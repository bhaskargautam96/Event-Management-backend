-- Create event_bookings table to track slot bookings
CREATE TABLE IF NOT EXISTS event_bookings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- User who booked
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(100),
    user_phone VARCHAR(20),
    
    -- Booking details
    booking_date DATE NOT NULL,
    booking_time VARCHAR(50),
    duration INTEGER DEFAULT 1, -- in hours
    
    -- Number of guests
    guest_count INTEGER,
    
    -- Booking status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    
    -- Payment details
    payment_status VARCHAR(20) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED')),
    total_amount DECIMAL(10, 2),
    advance_paid DECIMAL(10, 2) DEFAULT 0,
    
    -- Additional info
    special_requirements TEXT,
    notes TEXT,
    
    -- Cancellation
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Soft delete
    is_delete BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON event_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON event_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON event_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON event_bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON event_bookings(created_at DESC);

-- Composite index for date and time slot checking
CREATE INDEX IF NOT EXISTS idx_bookings_event_date_time ON event_bookings(event_id, booking_date, booking_time) 
WHERE is_delete = false AND status NOT IN ('CANCELLED');

-- Create function to check slot conflicts
CREATE OR REPLACE FUNCTION check_slot_conflict(
    p_event_id INTEGER,
    p_booking_date DATE,
    p_booking_time VARCHAR,
    p_duration INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check if there's any non-cancelled booking on the same date/time
    SELECT COUNT(*) INTO conflict_count
    FROM event_bookings
    WHERE event_id = p_event_id
    AND booking_date = p_booking_date
    AND booking_time = p_booking_time
    AND status NOT IN ('CANCELLED')
    AND is_delete = false;
    
    -- Return true if conflict exists
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating
DROP TRIGGER IF EXISTS update_bookings_updated_at ON event_bookings;

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON event_bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for available slots (optional, for reporting)
CREATE OR REPLACE VIEW event_slot_availability AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.event_date,
    e.event_time,
    COALESCE(COUNT(eb.id) FILTER (WHERE eb.status NOT IN ('CANCELLED') AND eb.is_delete = false), 0) as booked_count,
    (e.capacity->>'maxGuests')::INTEGER as max_capacity,
    CASE 
        WHEN COALESCE(COUNT(eb.id) FILTER (WHERE eb.status NOT IN ('CANCELLED') AND eb.is_delete = false), 0) >= (e.capacity->>'maxGuests')::INTEGER 
        THEN 'FULL'
        ELSE 'AVAILABLE'
    END as availability_status
FROM events e
LEFT JOIN event_bookings eb ON e.id = eb.event_id
WHERE e.is_delete = false
GROUP BY e.id, e.title, e.event_date, e.event_time, e.capacity;
