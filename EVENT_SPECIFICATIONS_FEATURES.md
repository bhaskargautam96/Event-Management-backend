# Event Specifications & Features - API Examples

## Overview
Two new fields have been added to events:
- **specifications**: Object/dictionary with key technical details
- **features**: Array of highlight features

## Data Structure

### Specifications (Object)
```json
{
  "capacity": "1000 people",
  "duration": "3 hours",
  "ageLimit": "18+",
  "dressCode": "Formal",
  "parking": "Available",
  "accessibility": "Wheelchair accessible"
}
```

### Features (Array)
```json
[
  "Live Music",
  "Food & Beverages", 
  "Networking Sessions",
  "Workshops",
  "Photo Booth",
  "Gift Bags",
  "Valet Parking"
]
```

---

## CREATE EVENT with Specifications & Features

```bash
curl -X POST "http://localhost:5000/api/v1/events" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -F "title=Tech Conference 2026" \
  -F "description=Annual technology conference with industry experts" \
  -F "typeId=507f1f77bcf86cd799439011" \
  -F "subTypeId=507f1f77bcf86cd799439012" \
  -F "location={\"city\":\"San Francisco\",\"state\":\"California\",\"venue\":\"Convention Center\",\"address\":\"123 Main St\"}" \
  -F "eventDate=2026-05-15T10:00:00Z" \
  -F "eventTime=10:00 AM" \
  -F "duration=480" \
  -F "pricing={\"basePrice\":299.99,\"currency\":\"USD\",\"discountType\":\"percentage\",\"discountValue\":10}" \
  -F "capacity={\"total\":1000,\"available\":950}" \
  -F "contactDetails={\"email\":\"organizer@event.com\",\"phone\":\"1234567890\",\"website\":\"https://event.com\"}" \
  -F "amenities={\"wifi\":true,\"parking\":true,\"food\":true,\"transportation\":false}" \
  -F "specifications={\"capacity\":\"1000 people\",\"duration\":\"8 hours\",\"ageLimit\":\"18+\",\"dressCode\":\"Business Casual\",\"parking\":\"Complimentary\",\"accessibility\":\"Wheelchair accessible\"}" \
  -F "features=[\"Keynote Speakers\",\"Panel Discussions\",\"Live Music\",\"Networking Sessions\",\"Food & Beverages\",\"Workshops\",\"Photo Booth\",\"Gift Bags\",\"Valet Parking\"]" \
  -F "tags={\"workshop\":true,\"networking\":true}" \
  -F "bookingSettings={\"maxPerPerson\":5,\"requiresApproval\":false}" \
  -F "status=ACTIVE" \
  -F "images=@/path/to/event1.jpg" \
  -F "images=@/path/to/event2.jpg"
```

---

## UPDATE EVENT - Add/Update Specifications & Features

```bash
curl -X PUT "http://localhost:5000/api/v1/events/1" \
  -H "Cookie: token=YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Tech Conference 2026",
    "specifications": {
      "capacity": "1200 people",
      "duration": "10 hours",
      "ageLimit": "21+",
      "dressCode": "Smart Casual",
      "parking": "Valet Available",
      "accessibility": "Fully accessible",
      "language": "English",
      "certificate": "Provided"
    },
    "features": [
      "Industry Experts",
      "Hands-on Workshops",
      "Live Demos",
      "Product Launches",
      "Networking Lounge",
      "Premium Catering",
      "Entertainment",
      "Swag Bags"
    ]
  }'
```

---

## Example Response

When you GET an event, the response will now include parsed specifications and features:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Tech Conference 2026",
    "description": "Annual technology conference with industry experts",
    "type_id": "507f1f77bcf86cd799439011",
    "sub_type_id": "507f1f77bcf86cd799439012",
    "images": [
      {
        "url": "https://res.cloudinary.com/...",
        "publicId": "event-waale/events/...",
        "resourceType": "image"
      }
    ],
    "location": {
      "city": "San Francisco",
      "state": "California",
      "venue": "Convention Center",
      "address": "123 Main St"
    },
    "event_date": "2026-05-15T04:30:00.000Z",
    "event_time": "10:00 AM",
    "duration": 480,
    "pricing": {
      "basePrice": 299.99,
      "currency": "USD",
      "discountType": "percentage",
      "discountValue": 10
    },
    "capacity": {
      "total": 1000,
      "available": 950
    },
    "amenities": {
      "wifi": true,
      "parking": true,
      "food": true,
      "transportation": false
    },
    "specifications": {
      "capacity": "1000 people",
      "duration": "8 hours",
      "ageLimit": "18+",
      "dressCode": "Business Casual",
      "parking": "Complimentary",
      "accessibility": "Wheelchair accessible",
      "language": "English",
      "certificate": "Provided"
    },
    "features": [
      "Keynote Speakers",
      "Panel Discussions",
      "Live Music",
      "Networking Sessions",
      "Food & Beverages",
      "Workshops",
      "Photo Booth",
      "Gift Bags",
      "Valet Parking"
    ],
    "tags": {
      "workshop": true,
      "networking": true
    },
    "contact_details": {
      "email": "organizer@event.com",
      "phone": "1234567890",
      "website": "https://event.com"
    },
    "organizer_id": "6984e74c05fd547795b7f442",
    "organizer_role": "SUPERADMIN",
    "status": "ACTIVE",
    "booking_settings": {
      "maxPerPerson": 5,
      "requiresApproval": false
    },
    "stats": {
      "views": 0,
      "rating": 0,
      "bookings": 0,
      "reviewCount": 0
    },
    "is_featured": false,
    "is_premium": false,
    "is_delete": false,
    "metadata": {},
    "created_at": "2026-02-26T04:48:44.857Z",
    "updated_at": "2026-02-26T04:48:44.857Z"
  }
}
```

---

## Use Case Examples

### Wedding Event
```json
{
  "specifications": {
    "capacity": "300 guests",
    "duration": "6 hours",
    "ageLimit": "All ages welcome",
    "dressCode": "Formal/Black Tie",
    "parking": "500+ spaces",
    "venueType": "Indoor & Outdoor",
    "catering": "Full service buffet"
  },
  "features": [
    "Luxury Venue",
    "Professional Photography",
    "Live Band",
    "DJ Services",
    "Catering & Bar",
    "Floral Decorations",
    "Wedding Planner",
    "Photo Booth"
  ]
}
```

### Concert Event
```json
{
  "specifications": {
    "capacity": "5000 people",
    "duration": "4 hours",
    "ageLimit": "16+ (under 18 with guardian)",
    "dressCode": "Casual",
    "parking": "Offsite shuttle available",
    "venueType": "Outdoor amphitheater",
    "soundSystem": "Professional grade"
  },
  "features": [
    "International Artist",
    "Opening Acts",
    "VIP Lounge Access",
    "Meet & Greet",
    "Merchandise Store",
    "Food Trucks",
    "Premium Seating",
    "Light Show"
  ]
}
```

### Corporate Training
```json
{
  "specifications": {
    "capacity": "50 participants",
    "duration": "2 days (16 hours total)",
    "ageLimit": "Professional adults",
    "dressCode": "Business casual",
    "parking": "Included",
    "materials": "All provided",
    "certificate": "Official certificate upon completion"
  },
  "features": [
    "Expert Trainers",
    "Hands-on Labs",
    "Course Materials",
    "Certificate",
    "Lunch & Refreshments",
    "Networking Sessions",
    "Q&A Sessions",
    "Post-training Support"
  ]
}
```

### Sports Tournament
```json
{
  "specifications": {
    "capacity": "32 teams (512 players)",
    "duration": "3 days",
    "ageLimit": "18-35 years",
    "dressCode": "Sports attire",
    "parking": "Available",
    "equipment": "Balls and jerseys provided",
    "registration": "Required 2 weeks in advance"
  },
  "features": [
    "Professional Referees",
    "Live Streaming",
    "Medical Support",
    "Trophies & Medals",
    "Food Court",
    "Team Lounges",
    "Awards Ceremony",
    "After-party"
  ]
}
```

---

## Field Guidelines

### Specifications - Use for:
- Technical details
- Requirements
- Restrictions
- Capacity details
- Duration specifics
- Age limits
- Dress codes
- Accessibility info

### Features - Use for:
- Highlights
- What's included
- Benefits
- Attractions
- Services provided
- Entertainment
- Special offerings
- Unique selling points

---

## Benefits

✅ **Better Event Discovery**: Users can filter by specific features  
✅ **Clear Expectations**: Specifications provide detailed requirements  
✅ **Enhanced Marketing**: Features highlight what makes event special  
✅ **Improved SEO**: More structured data for search engines  
✅ **Better UX**: Frontend can display these in dedicated sections  

---

## Frontend Display Examples

### Card View
```html
<div class="event-card">
  <h3>Tech Conference 2026</h3>
  <div class="specs">
    <span>👥 {specifications.capacity}</span>
    <span>⏱️ {specifications.duration}</span>
    <span>🎂 {specifications.ageLimit}</span>
  </div>
  <div class="features">
    {features.map(f => <span class="badge">{f}</span>)}
  </div>
</div>
```

### Detail Page
```html
<section class="specifications">
  <h2>Event Details</h2>
  <dl>
    <dt>Capacity</dt>
    <dd>{specifications.capacity}</dd>
    
    <dt>Duration</dt>
    <dd>{specifications.duration}</dd>
    
    <dt>Age Limit</dt>
    <dd>{specifications.ageLimit}</dd>
  </dl>
</section>

<section class="features">
  <h2>What's Included</h2>
  <ul>
    {features.map(f => <li>✓ {f}</li>)}
  </ul>
</section>
```

---

## Database Schema

```sql
-- Specifications stored as JSONB object
specifications JSONB DEFAULT '{}'::jsonb

-- Features stored as JSONB array  
features JSONB DEFAULT '[]'::jsonb

-- Index for searching features
CREATE INDEX idx_events_features ON events USING gin(features);
```

---

## Notes

- Both fields are **optional** when creating events
- Specifications should be a **JSON object** (key-value pairs)
- Features should be a **JSON array** (list of strings)
- Both are parsed automatically in API responses
- GIN index on features enables fast array searches
