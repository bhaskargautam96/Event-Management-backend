# Quick Start: Slot Availability Feature

## Setup (One Time)

### 1. Run Migration
```bash
node src/db/migrations/runMigration.js
```

---

## How It Works

### Slot Management
- **Slot** = Unique combination of `eventId` + `bookingDate` + `bookingTime`
- **Capacity** = `maxGuests` defined in event's capacity settings
- **Available** = When `bookedCount < maxCapacity`
- **Full** = When `bookedCount >= maxCapacity`

---

## API Quick Reference

### 1. Check if Date/Time is Available
```bash
GET /api/v1/bookings/check-availability?eventId=1&bookingDate=2026-06-15&bookingTime=10:00
```

**Response:**
```json
{
  "available": true,
  "remainingSlots": 3,
  "bookedCount": 2,
  "maxCapacity": 5,
  "status": "AVAILABLE"
}
```

---

### 2. Show Calendar with Available Dates
```bash
GET /api/v1/bookings/available-dates/1
```

**Response:**
```json
{
  "slots": [
    {
      "date": "2026-06-15",
      "time": "10:00",
      "isAvailable": true,
      "remainingSlots": 3
    },
    {
      "date": "2026-06-16",
      "time": "14:00",
      "isAvailable": false,
      "remainingSlots": 0
    }
  ]
}
```

---

### 3. Book a Slot
```bash
POST /api/v1/bookings
Content-Type: application/json
Cookie: accessToken=<token>

{
  "eventId": 1,
  "bookingDate": "2026-06-15",
  "bookingTime": "10:00 AM",
  "guestCount": 100
}
```

**Auto-checks availability before creating booking!**

---

## Frontend Integration Example

### React Component
```jsx
import { useState, useEffect } from 'react';

function EventBooking({ eventId }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState(null);
  
  // Check availability when date is selected
  const checkAvailability = async (date) => {
    const res = await fetch(
      `/api/v1/bookings/check-availability?eventId=${eventId}&bookingDate=${date}`
    );
    const data = await res.json();
    setAvailability(data);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    checkAvailability(date);
  };

  const createBooking = async () => {
    if (!availability?.available) {
      alert('This date is fully booked!');
      return;
    }

    const res = await fetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        eventId,
        bookingDate: selectedDate,
        guestCount: 100
      })
    });

    if (res.ok) {
      alert('Booking created!');
    }
  };

  return (
    <div>
      <input type="date" onChange={(e) => handleDateChange(e.target.value)} />
      
      {availability && (
        <div>
          {availability.available ? (
            <p>✅ Available! {availability.remainingSlots} slots left</p>
          ) : (
            <p>❌ Fully Booked</p>
          )}
        </div>
      )}

      <button onClick={createBooking} disabled={!availability?.available}>
        Book Now
      </button>
    </div>
  );
}
```

---

### Calendar with Available Dates
```jsx
function AvailabilityCalendar({ eventId }) {
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    fetch(`/api/v1/bookings/available-dates/${eventId}`)
      .then(res => res.json())
      .then(data => setSlots(data.data.slots));
  }, [eventId]);

  return (
    <div className="calendar">
      {slots.map(slot => (
        <div 
          key={`${slot.date}-${slot.time}`}
          className={slot.isAvailable ? 'available' : 'full'}
        >
          <div>{slot.date}</div>
          <div>{slot.time}</div>
          <div>{slot.remainingSlots} slots left</div>
        </div>
      ))}
    </div>
  );
}
```

---

## Database Query Examples

### Check how many bookings on a date
```sql
SELECT booking_date, COUNT(*) as bookings
FROM event_bookings
WHERE event_id = 1
AND booking_date = '2026-06-15'
AND status NOT IN ('CANCELLED')
AND is_delete = false
GROUP BY booking_date;
```

### Get all fully booked dates
```sql
SELECT * FROM event_slot_availability
WHERE availability_status = 'FULL'
AND event_id = 1;
```

### Manually check slot conflict
```sql
SELECT check_slot_conflict(1, '2026-06-15', '10:00', 6);
-- Returns true if conflict exists
```

---

## Conflict Prevention

✅ **Automatic checks:**
1. Slot availability checked before every booking
2. Capacity limit enforced
3. Cancelled bookings don't count towards capacity
4. Soft-deleted bookings don't count

✅ **Database-level:**
- Composite index on (event_id, booking_date, booking_time)
- SQL function for conflict checking
- Transaction safety

---

## Testing Scenarios

### Test 1: Book until full
```bash
# Event with maxCapacity = 3
POST /bookings → SUCCESS (bookedCount = 1)
POST /bookings → SUCCESS (bookedCount = 2)
POST /bookings → SUCCESS (bookedCount = 3)
POST /bookings → ERROR "Slot fully booked"
```

### Test 2: Cancel and rebook
```bash
POST /bookings → SUCCESS (bookedCount = 1)
PATCH /bookings/1/cancel → SUCCESS
GET /check-availability → available: true (bookedCount = 0)
POST /bookings → SUCCESS again
```

### Test 3: Past date validation
```bash
POST /bookings with bookingDate="2020-01-01"
→ ERROR "Cannot book dates in the past"
```

---

## Common Issues & Solutions

### Issue: "Always showing full"
**Solution:** Check event's `capacity.maxGuests` value
```sql
SELECT capacity FROM events WHERE id = 1;
-- Should return {"maxGuests": 100} or similar
```

### Issue: "Cancelled bookings still count"
**Solution:** Ensure status filter is applied
```sql
-- Correct query
SELECT * FROM event_bookings 
WHERE status NOT IN ('CANCELLED') AND is_delete = false;
```

### Issue: "Can't book same date multiple times"
**Solution:** This is by design! Each slot allows up to `maxCapacity` bookings.

---

## Status Flow

```
User Creates Booking
       ↓
   [PENDING] ← (if autoApprove = false)
       ↓
   [CONFIRMED] ← Organizer approves
       ↓
   [COMPLETED] ← After event
       
   [CANCELLED] ← User/Organizer cancels
```

---

## Key Features

✅ Real-time availability checking  
✅ Prevents double-booking  
✅ Calendar integration ready  
✅ Capacity management  
✅ Soft delete (history preserved)  
✅ Payment tracking  
✅ Auto-approval option  
✅ Multi-tenancy support  
✅ Fast queries (indexed)  

---

That's it! Your slot availability system is production-ready! 🚀
