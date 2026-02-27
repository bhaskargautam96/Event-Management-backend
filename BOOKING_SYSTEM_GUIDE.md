# Event Booking System - Complete Guide

## Overview
The booking system allows users to reserve specific dates/times for events. It includes slot availability checking, conflict prevention, and booking management.

---

## 🗄️ Database Setup

### Run Migrations
```bash
node src/db/migrations/runMigration.js
```

This creates:
- `events` table
- `event_bookings` table
- Indexes for performance
- Slot conflict checking function
- View for slot availability

---

## 📊 Database Schema

### Event Bookings Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| event_id | INTEGER | Foreign key to events |
| user_id | VARCHAR(50) | User MongoDB ID |
| user_name | VARCHAR(100) | Booking user name |
| user_email | VARCHAR(100) | Booking user email |
| user_phone | VARCHAR(20) | Booking user phone |
| booking_date | DATE | Reserved date |
| booking_time | VARCHAR(50) | Reserved time slot |
| duration | INTEGER | Duration in hours |
| guest_count | INTEGER | Number of guests |
| status | VARCHAR(20) | PENDING, CONFIRMED, CANCELLED, COMPLETED |
| payment_status | VARCHAR(20) | UNPAID, PARTIAL, PAID, REFUNDED |
| total_amount | DECIMAL(10,2) | Total booking amount |
| advance_paid | DECIMAL(10,2) | Advance payment amount |
| special_requirements | TEXT | Special requests |
| notes | TEXT | Additional notes |
| cancelled_at | TIMESTAMP | Cancellation time |
| cancellation_reason | TEXT | Reason for cancellation |
| is_delete | BOOLEAN | Soft delete flag |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

---

## 🎯 API Endpoints

### Base URL: `/api/v1/bookings`

---

### 1. **Check Slot Availability** (Public)
Check if a specific date/time slot is available for booking.

**Endpoint:** `GET /api/v1/bookings/check-availability`

**Query Parameters:**
- `eventId` (required) - Event ID
- `bookingDate` (required) - Date in YYYY-MM-DD format
- `bookingTime` (optional) - Time slot (e.g., "10:00 AM")

**Example:**
```bash
GET /api/v1/bookings/check-availability?eventId=1&bookingDate=2026-06-15&bookingTime=10:00
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "data": {
    "eventId": 1,
    "bookingDate": "2026-06-15",
    "bookingTime": "10:00",
    "bookedCount": 2,
    "maxCapacity": 5,
    "remainingSlots": 3,
    "status": "AVAILABLE"
  }
}
```

---

### 2. **Get Available Dates** (Public)
Get all available/booked dates for an event.

**Endpoint:** `GET /api/v1/bookings/available-dates/:eventId`

**Query Parameters:**
- `startDate` (optional) - Start date filter
- `endDate` (optional) - End date filter

**Example:**
```bash
GET /api/v1/bookings/available-dates/1?startDate=2026-06-01&endDate=2026-06-30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": 1,
    "eventTitle": "Grand Wedding Ceremony",
    "maxCapacity": 5,
    "slots": [
      {
        "date": "2026-06-15",
        "time": "10:00",
        "bookedCount": 2,
        "remainingSlots": 3,
        "status": "AVAILABLE",
        "isAvailable": true
      },
      {
        "date": "2026-06-16",
        "time": "14:00",
        "bookedCount": 5,
        "remainingSlots": 0,
        "status": "FULL",
        "isAvailable": false
      }
    ]
  }
}
```

---

### 3. **Create Booking** (Auth Required)
Create a new booking for an event.

**Endpoint:** `POST /api/v1/bookings`

**Headers:**
```
Cookie: accessToken=<your_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventId": 1,
  "bookingDate": "2026-06-15",
  "bookingTime": "10:00 AM",
  "duration": 6,
  "guestCount": 150,
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "userPhone": "+919876543210",
  "specialRequirements": "Vegetarian food only",
  "notes": "Anniversary celebration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 1,
    "event_id": 1,
    "user_id": "65d4f3e2a7b8c9d0e1f2g3h4",
    "booking_date": "2026-06-15",
    "booking_time": "10:00 AM",
    "status": "PENDING",
    "payment_status": "UNPAID",
    "total_amount": "500000.00",
    "advance_paid": "0.00",
    "created_at": "2026-02-26T10:30:00Z"
  },
  "message": "Your booking is pending approval from the organizer"
}
```

**Error Response (Slot Full):**
```json
{
  "success": false,
  "message": "This slot is already fully booked",
  "available": false
}
```

---

### 4. **Get My Bookings** (Auth Required)
Get all bookings made by the logged-in user.

**Endpoint:** `GET /api/v1/bookings/my-bookings`

**Headers:**
```
Cookie: accessToken=<your_token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status

**Example:**
```bash
GET /api/v1/bookings/my-bookings?page=1&limit=10&status=CONFIRMED
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "event_id": 1,
      "event_title": "Grand Wedding Ceremony",
      "event_images": [...],
      "event_location": {...},
      "booking_date": "2026-06-15",
      "booking_time": "10:00 AM",
      "status": "CONFIRMED",
      "payment_status": "PARTIAL",
      "total_amount": "500000.00",
      "advance_paid": "100000.00"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 25,
    "limit": 10
  }
}
```

---

### 5. **Get Single Booking** (Auth Required)
Get details of a specific booking.

**Endpoint:** `GET /api/v1/bookings/:bookingId`

**Headers:**
```
Cookie: accessToken=<your_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "event_id": 1,
    "event_title": "Grand Wedding Ceremony",
    "event_description": "...",
    "event_images": [...],
    "event_location": {...},
    "event_pricing": {...},
    "event_contact": {...},
    "booking_date": "2026-06-15",
    "booking_time": "10:00 AM",
    "duration": 6,
    "guest_count": 150,
    "status": "CONFIRMED",
    "payment_status": "UNPAID",
    "total_amount": "500000.00",
    "special_requirements": "Vegetarian food only",
    "created_at": "2026-02-26T10:30:00Z"
  }
}
```

---

### 6. **Cancel Booking** (Auth Required)
Cancel your own booking.

**Endpoint:** `PATCH /api/v1/bookings/:bookingId/cancel`

**Headers:**
```
Cookie: accessToken=<your_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "cancellationReason": "Change of plans"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": 1,
    "status": "CANCELLED",
    "cancelled_at": "2026-02-26T12:00:00Z",
    "cancellation_reason": "Change of plans"
  }
}
```

---

### 7. **Get Event Bookings** (Organizer/Admin)
Get all bookings for a specific event (only organizer or admin).

**Endpoint:** `GET /api/v1/bookings/event/:eventId`

**Headers:**
```
Cookie: accessToken=<your_token>
```

**Query Parameters:**
- `page`, `limit`, `status` (same as my-bookings)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": "...",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "user_phone": "+919876543210",
      "booking_date": "2026-06-15",
      "booking_time": "10:00 AM",
      "guest_count": 150,
      "status": "PENDING",
      "payment_status": "UNPAID",
      "total_amount": "500000.00",
      "created_at": "2026-02-26T10:30:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### 8. **Update Booking Status** (Organizer/Admin)
Approve, confirm, or complete a booking.

**Endpoint:** `PATCH /api/v1/bookings/:bookingId/status`

**Headers:**
```
Cookie: accessToken=<your_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Allowed Status Values:**
- `PENDING` - Awaiting approval
- `CONFIRMED` - Approved by organizer
- `CANCELLED` - Cancelled
- `COMPLETED` - Event completed

**Response:**
```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "id": 1,
    "status": "CONFIRMED",
    "updated_at": "2026-02-26T13:00:00Z"
  }
}
```

---

## 🔍 Slot Conflict Prevention

The system automatically prevents double-booking:

1. **Before Creating Booking:**
   - Checks if slot is available
   - Compares booked count vs max capacity
   - Returns error if slot is full

2. **Database Function:**
   ```sql
   check_slot_conflict(event_id, booking_date, booking_time, duration)
   ```
   Returns `true` if conflict exists

3. **Composite Index:**
   Fast lookup for date/time conflicts

---

## 📊 Slot Availability View

Query the availability view directly:

```sql
SELECT * FROM event_slot_availability
WHERE event_id = 1
AND event_date >= CURRENT_DATE;
```

---

## 🎯 Booking Flow

### For Users:
1. Browse events
2. Check slot availability
3. Create booking
4. Wait for approval (or auto-approved)
5. Make payment
6. Attend event
7. Can cancel if needed

### For Organizers:
1. Receive booking notification
2. Review booking details
3. Approve/reject booking
4. Track payment status
5. Complete booking after event
6. Manage cancellations

---

## 💡 Usage Examples

### Check if Date is Available
```javascript
// Frontend code
const response = await fetch(
  '/api/v1/bookings/check-availability?eventId=1&bookingDate=2026-06-15',
  { credentials: 'include' }
);
const data = await response.json();

if (data.available) {
  // Show booking form
} else {
  // Show "Fully booked" message
}
```

### Create Booking
```javascript
const bookingData = {
  eventId: 1,
  bookingDate: "2026-06-15",
  bookingTime: "10:00 AM",
  guestCount: 150,
  userName: "John Doe",
  userEmail: "john@example.com",
  userPhone: "+919876543210"
};

const response = await fetch('/api/v1/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData),
  credentials: 'include'
});
```

### Show Available Dates Calendar
```javascript
const response = await fetch(
  '/api/v1/bookings/available-dates/1?startDate=2026-06-01&endDate=2026-06-30'
);
const { data } = await response.json();

// data.slots contains all dates with availability status
// Use this to highlight available/unavailable dates in calendar
```

---

## 🔐 Authorization Matrix

| Endpoint | User | Organizer | Admin |
|----------|------|-----------|-------|
| Check availability | ✅ | ✅ | ✅ |
| Get available dates | ✅ | ✅ | ✅ |
| Create booking | ✅ | ✅ | ✅ |
| Get my bookings | ✅ | ✅ | ✅ |
| Get single booking | ✅ (own) | ✅ (event owner) | ✅ |
| Cancel own booking | ✅ | ✅ | ✅ |
| Get event bookings | ❌ | ✅ (own events) | ✅ |
| Update booking status | ❌ | ✅ (own events) | ✅ |

---

## 🚀 Testing the API

Use the provided Postman collection or test manually:

```bash
# 1. Check availability
curl "http://localhost:4000/api/v1/bookings/check-availability?eventId=1&bookingDate=2026-06-15"

# 2. Create booking (requires auth)
curl -X POST http://localhost:4000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{
    "eventId": 1,
    "bookingDate": "2026-06-15",
    "bookingTime": "10:00 AM",
    "guestCount": 150
  }'

# 3. Get my bookings
curl -X GET http://localhost:4000/api/v1/bookings/my-bookings \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

---

## 📝 Notes

- **Slot = Date + Time combination** for an event
- **Capacity** is defined per event (maxGuests)
- **Multiple bookings** allowed until capacity is reached
- **Soft delete** - cancelled bookings are marked, not deleted
- **Stats tracking** - booking count tracked on events table
- **Future dates only** - cannot book past dates
- **Auto-approval** - configurable per event

---

## 🐛 Troubleshooting

### "Slot is already fully booked"
- Check event capacity settings
- Verify existing bookings count
- Consider increasing capacity or adding more time slots

### "Event not found"
- Verify event ID
- Check if event is soft-deleted
- Ensure event status is ACTIVE

### "Not authorized"
- Verify user is logged in
- Check if user owns the booking/event
- Verify user role for admin actions

---

Your booking system is now ready! 🎉
