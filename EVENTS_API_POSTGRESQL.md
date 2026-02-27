# Events API - PostgreSQL Documentation

## Database Setup

### 1. Run Migration

Run the following command to create the events table:

```bash
node src/db/migrations/runMigration.js
```

This will create:
- `events` table with all necessary columns
- Indexes for better query performance
- Full-text search indexes
- Auto-update trigger for `updated_at` column

---

## Database Schema

### Events Table Structure

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Auto-incrementing ID |
| title | VARCHAR(200) | Event title |
| description | TEXT | Event description |
| type_id | VARCHAR(50) | Reference to event type (from MongoDB) |
| sub_type_id | VARCHAR(50) | Reference to event subtype (from MongoDB) |
| images | JSONB | Array of image objects |
| location | JSONB | Location details |
| event_date | TIMESTAMP | Event date |
| event_time | VARCHAR(50) | Event time |
| duration | INTEGER | Duration in hours |
| pricing | JSONB | Pricing details |
| capacity | JSONB | Capacity details |
| amenities | JSONB | Array of amenities |
| tags | JSONB | Array of tags |
| contact_details | JSONB | Contact information |
| organizer_id | VARCHAR(50) | Reference to user (from MongoDB) |
| organizer_role | VARCHAR(20) | Role: ORGANIZER, ADMIN, SUPERADMIN |
| status | VARCHAR(20) | DRAFT, ACTIVE, COMPLETED, CANCELLED, PENDING_APPROVAL |
| booking_settings | JSONB | Booking settings |
| stats | JSONB | Statistics (views, bookings, rating) |
| is_featured | BOOLEAN | Featured flag |
| is_premium | BOOLEAN | Premium flag |
| is_delete | BOOLEAN | Soft delete flag |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

## API Endpoints

### Base URL: `/api/v1/events`

### 1. **GET** `/api/v1/events` - Get All Events
**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in title/description
- `typeId` - Filter by event type
- `subTypeId` - Filter by event subtype
- `city` - Filter by city
- `state` - Filter by state
- `status` - Filter by status
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `sortBy` - Sort field (default: created_at)
- `sortOrder` - Sort order: asc/desc (default: desc)

**Example:**
```bash
GET /api/v1/events?city=Mumbai&minPrice=10000&maxPrice=50000&page=1&limit=10
```

---

### 2. **GET** `/api/v1/events/:id` - Get Single Event
**Parameters:**
- `id` - Event ID (integer)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Grand Wedding Ceremony",
    "description": "...",
    "images": [...],
    "location": {...},
    "pricing": {...},
    ...
  }
}
```

---

### 3. **POST** `/api/v1/events` - Create Event (Auth Required)
**Headers:**
- `Cookie: accessToken=<token>`

**Content-Type:** `multipart/form-data`

**Form Data:**
```javascript
{
  "title": "Grand Wedding Ceremony",
  "description": "Traditional wedding with modern amenities",
  "typeId": "65d4f3e2a7b8c9d0e1f2g3h4", // MongoDB ObjectId as string
  "subTypeId": "65d4f3e2a7b8c9d0e1f2g3h5",
  "eventDate": "2026-06-15",
  "eventTime": "18:00",
  "duration": 6,
  
  "location": JSON.stringify({
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "coordinates": {
      "latitude": 19.0760,
      "longitude": 72.8777
    }
  }),
  
  "pricing": JSON.stringify({
    "basePrice": 500000,
    "currency": "INR",
    "isNegotiable": true,
    "advancePayment": 100000
  }),
  
  "capacity": JSON.stringify({
    "minGuests": 100,
    "maxGuests": 500
  }),
  
  "contactDetails": JSON.stringify({
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "whatsapp": "+919876543210"
  }),
  
  "amenities": JSON.stringify([
    "Catering",
    "Decoration",
    "Photography"
  ]),
  
  "tags": JSON.stringify([
    "wedding",
    "luxury",
    "traditional"
  ]),
  
  "images": [<file1>, <file2>, <file3>]  // Multiple files (max 10)
}
```

---

### 4. **PUT** `/api/v1/events/:id` - Update Event (Auth Required)
**Headers:**
- `Cookie: accessToken=<token>`

**Content-Type:** `multipart/form-data`

**Form Data:**
```javascript
{
  "title": "Updated Title",
  "description": "Updated description",
  "replaceAllImages": "false", // "true" to replace all images, "false" to add
  "images": [<new_files>],
  
  // Any other fields from create
}
```

---

### 5. **DELETE** `/api/v1/events/:id/images` - Delete Specific Images
**Headers:**
- `Cookie: accessToken=<token>`

**Body:**
```json
{
  "imagePublicIds": [
    "event-waale/events/abc123",
    "event-waale/events/def456"
  ]
}
```

---

### 6. **DELETE** `/api/v1/events/:id` - Delete Event (Soft Delete)
**Headers:**
- `Cookie: accessToken=<token>`

---

### 7. **PATCH** `/api/v1/events/:id/status` - Update Status (Admin Only)
**Headers:**
- `Cookie: accessToken=<token>`

**Body:**
```json
{
  "status": "ACTIVE"
}
```

---

### 8. **GET** `/api/v1/events/my/events` - Get My Events
**Headers:**
- `Cookie: accessToken=<token>`

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `status` - Filter by status

---

## JSONB Field Structures

### Images Array
```json
[
  {
    "url": "https://res.cloudinary.com/...",
    "publicId": "event-waale/events/abc123",
    "resourceType": "image"
  }
]
```

### Location Object
```json
{
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "coordinates": {
    "latitude": 19.0760,
    "longitude": 72.8777
  }
}
```

### Pricing Object
```json
{
  "basePrice": 500000,
  "currency": "INR",
  "isNegotiable": true,
  "advancePayment": 100000
}
```

### Capacity Object
```json
{
  "minGuests": 100,
  "maxGuests": 500
}
```

### Contact Details Object
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "email": "john@example.com",
  "whatsapp": "+919876543210"
}
```

### Booking Settings Object
```json
{
  "isBookingOpen": true,
  "autoApprove": false,
  "cancellationPolicy": "50% refund if cancelled 30 days before event"
}
```

### Stats Object
```json
{
  "views": 120,
  "bookings": 5,
  "rating": 4.5,
  "reviewCount": 10
}
```

---

## Indexes

The following indexes are created for better performance:

1. `idx_events_type_id` - On type_id
2. `idx_events_sub_type_id` - On sub_type_id
3. `idx_events_organizer_id` - On organizer_id
4. `idx_events_status` - On status
5. `idx_events_is_delete` - On is_delete
6. `idx_events_event_date` - On event_date
7. `idx_events_created_at` - On created_at (DESC)
8. `idx_events_city` - On location->>'city'
9. `idx_events_state` - On location->>'state'
10. `idx_events_search` - GIN index for full-text search
11. `idx_events_tags` - GIN index for tags array search

---

## Notes

- **Hybrid System**: Users, Types, and SubTypes still use MongoDB, Events use PostgreSQL
- **References**: `type_id`, `sub_type_id`, `organizer_id` store MongoDB ObjectIds as strings
- **JSONB**: PostgreSQL's JSONB type allows flexible schema and efficient querying
- **Images**: Stored as JSONB array, actual files on Cloudinary
- **Soft Delete**: `is_delete` flag instead of hard deletion
- **Auto-Timestamps**: `updated_at` automatically updates via trigger
- **Full-text Search**: Efficient search on title and description using GIN index

---

## Example Queries

### Search events in Mumbai with price range
```sql
SELECT * FROM events
WHERE location->>'city' ILIKE '%Mumbai%'
AND (pricing->>'basePrice')::numeric BETWEEN 10000 AND 50000
AND is_delete = false
AND status = 'ACTIVE'
ORDER BY created_at DESC;
```

### Get events with specific tag
```sql
SELECT * FROM events
WHERE tags @> '["wedding"]'::jsonb
AND is_delete = false;
```

### Full-text search
```sql
SELECT * FROM events
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('wedding & luxury')
AND is_delete = false;
```

---

## Migration Rollback

To drop the events table and start over:

```sql
DROP TABLE IF EXISTS events CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```
