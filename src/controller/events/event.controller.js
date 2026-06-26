import cloudinary from "../../config/cloudinary.js";
import sql from "../../db/postgres.db.connection.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

/* ===============================================
   HELPER: Parse JSON string fields in event object
   =============================================== */
const parseEventFields = (event) => {
  if (!event) return event;
  
  const jsonFields = [
    'images',
    'location',
    'pricing',
    'capacity',
    'amenities',
    'specifications',
    'features',
    'tags',
    'contact_details',
    'booking_settings',
    'metadata'
  ];
  
  const parsed = { ...event };
  
  jsonFields.forEach((field) => {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try {
        parsed[field] = JSON.parse(parsed[field]);
      } catch (e) {
        // Keep original value if parsing fails
      }
    }
  });
  
  return parsed;
};

/* =================================================
   1️⃣ GET ALL EVENTS (WITH FILTERS & PAGINATION)
   ================================================= */
export const  getAllEvents = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      typeId,
      subTypeId,
      city,
      state,
      status,
      minPrice,
      maxPrice,
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const role = req.user?.role;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Build WHERE conditions
    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Admin/SuperAdmin can see all, others only active
    if (!["SUPERADMIN", "ADMIN"].includes(role)) {
      whereConditions.push(`is_delete = false`);
      whereConditions.push(`status = '1'`);
    }

    // Apply status filter if provided
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Search in title, description (using full-text search)
    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by category
    if (typeId) {
      whereConditions.push(`type_id = $${paramIndex}`);
      params.push(typeId);
      paramIndex++;
    }

    if (subTypeId) {
      whereConditions.push(`sub_type_id = $${paramIndex}`);
      params.push(subTypeId);
      paramIndex++;
    }

    // Filter by location
    if (city) {
      whereConditions.push(`location->>'city' ILIKE $${paramIndex}`);
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      whereConditions.push(`location->>'state' ILIKE $${paramIndex}`);
      params.push(`%${state}%`);
      paramIndex++;
    }

    // Price range filter
    if (minPrice) {
      whereConditions.push(`(pricing->>'basePrice')::numeric >= $${paramIndex}`);
      params.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      whereConditions.push(`(pricing->>'basePrice')::numeric <= $${paramIndex}`);
      params.push(parseFloat(maxPrice));
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = [
      "created_at",
      "updated_at",
      "event_date",
      "title",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";
    // Fetch events with pagination
    const eventsQuery = `
      SELECT * FROM events
      ${whereClause}
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex+1}
    `;
    params.push(limit, skip);
    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total FROM events
      ${whereClause}
    `;

    const [events, countResult] = await Promise.all([
      sql.unsafe(eventsQuery, params),
      sql.unsafe(countQuery, params.slice(0, -2)),
    ]);

    const totalRecords = parseInt(countResult[0].total);

    // Parse JSON string fields for each event
    const parsedEvents = events.map(parseEventFields);

    return res.status(200).json({
      success: true,
      data: parsedEvents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   2️⃣ GET SINGLE EVENT BY ID
===================================================== */
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await sql`
      SELECT * FROM events
      WHERE id = ${id}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Increment view count
    await sql`
      UPDATE events
      SET stats = jsonb_set(
        stats,
        '{views}',
        ((stats->>'views')::int + 1)::text::jsonb
      )
      WHERE id = ${id}
    `;

    // Auto-track viewer if tracking is enabled (non-blocking)
    if (event[0].track_viewers) {
      const viewerId = req.user?.id || null;
      const viewerEmail = req.user?.email || null;
      const viewerName = req.user?.name || null;
      const ipAddress = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];
      const userAgent = req.headers["user-agent"] || "";
      const referrer = req.headers.referer || null;

      // Track view asynchronously (don't block response)
      sql`
        INSERT INTO event_viewers (
          event_id,
          viewer_id,
          viewer_email,
          viewer_name,
          ip_address,
          user_agent,
          referrer,
          view_type
        ) VALUES (
          ${id},
          ${viewerId},
          ${viewerEmail},
          ${viewerName},
          ${ipAddress},
          ${userAgent},
          ${referrer},
          'DETAILED'
        )
      `.catch((err) => {
        console.error("View tracking error:", err.message);
        // Don't fail the request if tracking fails
      });
    }

    // Parse JSON string fields
    const parsedEvent = parseEventFields(event[0]);

    return res.status(200).json({
      success: true,
      data: parsedEvent,
    });
  } catch (error) {
    console.error("Get Event Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   3️⃣ CREATE EVENT (WITH MULTIPLE IMAGES)
===================================================== */
export const createEvent = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    // Parse JSON fields from request body
    const {
      title,
      description,
      typeId,
      subTypeId,
      eventDate,
      eventTime,
      duration,
    } = req.body;

    const location = req.body.location ? JSON.parse(req.body.location) : null;
    const pricing = req.body.pricing ? JSON.parse(req.body.pricing) : null;
    const capacity = req.body.capacity ? JSON.parse(req.body.capacity) : {};
    const contactDetails = req.body.contactDetails
      ? JSON.parse(req.body.contactDetails)
      : null;
    const bookingSettings = req.body.bookingSettings
      ? JSON.parse(req.body.bookingSettings)
      : {};
    const amenities = req.body.amenities ? JSON.parse(req.body.amenities) : [];
    const specifications = req.body.specifications ? JSON.parse(req.body.specifications) : {};
    const features = req.body.features ? JSON.parse(req.body.features) : [];
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};

    // Validate required fields
    if (!title || !description || !typeId || !location || !pricing || !contactDetails || !eventDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Handle multiple image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary({
          fileBuffer: file.buffer,
          folder: "event-waale/events",
          resourceType: "image",
        })
      );

      const uploadResults = await Promise.all(uploadPromises);

      uploadResults.forEach((result) => {
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      });
    }

    // Determine status based on role
    const eventStatus = ["ADMIN", "SUPERADMIN"].includes(role)
      ? "ACTIVE"
      : "PENDING_APPROVAL";

    // Insert event into database
    const event = await sql`
      INSERT INTO events (
        title,
        description,
        type_id,
        sub_type_id,
        images,
        location,
        event_date,
        event_time,
        duration,
        pricing,
        capacity,
        amenities,
        specifications,
        features,
        tags,
        contact_details,
        organizer_id,
        organizer_role,
        status,
        booking_settings,
        metadata
      ) VALUES (
        ${title},
        ${description},
        ${typeId},
        ${subTypeId || null},
        ${JSON.stringify(images)},
        ${JSON.stringify(location)},
        ${eventDate},
        ${eventTime || null},
        ${duration || 1},
        ${JSON.stringify(pricing)},
        ${JSON.stringify(capacity)},
        ${JSON.stringify(amenities)},
        ${JSON.stringify(specifications)},
        ${JSON.stringify(features)},
        ${JSON.stringify(tags)},
        ${JSON.stringify(contactDetails)},
        ${userId},
        ${role},
        ${eventStatus},
        ${JSON.stringify(bookingSettings)},
        ${JSON.stringify(metadata)}
      ) RETURNING *`;

    return res.status(201).json(
      new ApiResponse("Event created successfully", {
        data: parseEventFields(event[0]),
      })
    );
  } catch (error) {
    console.error("Create Event Error:", error);
    return res.status(500).json(
      new ApiError("Error creating event", {
        error: error.message,
      })
    );
  }
};

/* =====================================================
   4️⃣ UPDATE EVENT (WITH IMAGE REPLACEMENT)
===================================================== */
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    // Fetch existing event
    const existingEvent = await sql`
      SELECT * FROM events WHERE id = ${id}
    `;

    if (!existingEvent || existingEvent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const event = existingEvent[0];

    // Authorization: Only owner, admin, or superadmin can update
    if (
      event.organizer_id !== userId &&
      !["ADMIN", "SUPERADMIN"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // Build update object
    const updateFields = {};

    // Simple string/number fields
    if (req.body.title) updateFields.title = req.body.title;
    if (req.body.description) updateFields.description = req.body.description;
    if (req.body.typeId) updateFields.type_id = req.body.typeId;
    if (req.body.subTypeId) updateFields.sub_type_id = req.body.subTypeId;
    if (req.body.eventDate) updateFields.event_date = req.body.eventDate;
    if (req.body.eventTime) updateFields.event_time = req.body.eventTime;
    if (req.body.duration) updateFields.duration = parseInt(req.body.duration);
    if (req.body.status) updateFields.status = req.body.status;
    if (req.body.isFeatured !== undefined)
      updateFields.is_featured = req.body.isFeatured === "true";
    if (req.body.isPremium !== undefined)
      updateFields.is_premium = req.body.isPremium === "true";

    // Parse JSON fields if present
    if (req.body.location)
      updateFields.location = JSON.stringify(JSON.parse(req.body.location));
    if (req.body.pricing)
      updateFields.pricing = JSON.stringify(JSON.parse(req.body.pricing));
    if (req.body.capacity)
      updateFields.capacity = JSON.stringify(JSON.parse(req.body.capacity));
    if (req.body.contactDetails)
      updateFields.contact_details = JSON.stringify(
        JSON.parse(req.body.contactDetails)
      );
    if (req.body.bookingSettings)
      updateFields.booking_settings = JSON.stringify(
        JSON.parse(req.body.bookingSettings)
      );
    if (req.body.amenities)
      updateFields.amenities = JSON.stringify(JSON.parse(req.body.amenities));
    if (req.body.specifications)
      updateFields.specifications = JSON.stringify(JSON.parse(req.body.specifications));
    if (req.body.features)
      updateFields.features = JSON.stringify(JSON.parse(req.body.features));
    if (req.body.tags)
      updateFields.tags = JSON.stringify(JSON.parse(req.body.tags));
    if (req.body.metadata)
      updateFields.metadata = JSON.stringify(JSON.parse(req.body.metadata));

    // Handle new images upload
    if (req.files && req.files.length > 0) {
      let currentImages = event.images || [];

      // Option 1: Replace all images
      if (req.body.replaceAllImages === "true") {
        // Delete old images from Cloudinary
        if (currentImages.length > 0) {
          const deletePromises = currentImages.map((img) =>
            cloudinary.uploader.destroy(img.publicId)
          );
          await Promise.all(deletePromises);
        }

        // Upload new images
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary({
            fileBuffer: file.buffer,
            folder: "event-waale/events",
            resourceType: "image",
          })
        );

        const uploadResults = await Promise.all(uploadPromises);

        currentImages = uploadResults.map((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        }));
      } else {
        // Option 2: Add to existing images
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary({
            fileBuffer: file.buffer,
            folder: "event-waale/events",
            resourceType: "image",
          })
        );

        const uploadResults = await Promise.all(uploadPromises);

        const newImages = uploadResults.map((result) => ({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        }));

        currentImages = [...currentImages, ...newImages];
      }

      updateFields.images = JSON.stringify(currentImages);
    }

    // Build SQL UPDATE query dynamically
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updatedEvent = await sql`
      UPDATE events
      SET ${sql(updateFields)}
      WHERE id = ${id}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: parseEventFields(updatedEvent[0]),
    });
  } catch (error) {
    console.error("Update Event Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   5️⃣ DELETE SPECIFIC IMAGES FROM EVENT
===================================================== */
export const deleteEventImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { imagePublicIds } = req.body; // Array of publicIds to delete

    if (!imagePublicIds || !Array.isArray(imagePublicIds)) {
      return res.status(400).json({
        success: false,
        message: "imagePublicIds array is required",
      });
    }

    const existingEvent = await sql`
      SELECT * FROM events WHERE id = ${id}
    `;

    if (!existingEvent || existingEvent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const event = existingEvent[0];

    // Delete images from Cloudinary
    const deletePromises = imagePublicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId)
    );
    await Promise.all(deletePromises);

    // Remove images from database (filter out deleted images)
    const updatedImages = (event.images || []).filter(
      (img) => !imagePublicIds.includes(img.publicId)
    );

    const updatedEvent = await sql`
      UPDATE events
      SET images = ${JSON.stringify(updatedImages)}
      WHERE id = ${id}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Images deleted successfully",
      data: updatedEvent[0],
    });
  } catch (error) {
    console.error("Delete Images Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   6️⃣ DELETE EVENT (SOFT DELETE)
===================================================== */
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const existingEvent = await sql`
      SELECT * FROM events WHERE id = ${id}
    `;

    if (!existingEvent || existingEvent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const event = existingEvent[0];

    // Authorization check
    if (
      event.organizer_id !== userId &&
      !["ADMIN", "SUPERADMIN"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      });
    }

    // Soft delete
    await sql`
      UPDATE events
      SET is_delete = true, status = 'CANCELLED'
      WHERE id = ${id}
    `;

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   7️⃣ UPDATE EVENT STATUS (ADMIN ONLY)
===================================================== */
export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    if (!["ADMIN", "SUPERADMIN"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Only admins can update event status",
      });
    }

    const updatedEvent = await sql`
      UPDATE events
      SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedEvent || updatedEvent.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event status updated successfully",
      data: updatedEvent[0],
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   8️⃣ GET MY EVENTS (ORGANIZER)
===================================================== */
export const getMyEvents = async (req, res) => {
  try {
    const { id: userId } = req.user;
    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let whereConditions = [`organizer_id = $1`];
    let params = [userId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const eventsQuery = `
      SELECT * FROM events
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, skip);

    const countQuery = `
      SELECT COUNT(*) as total FROM events
      ${whereClause}
    `;

    const [events, countResult] = await Promise.all([
      sql.unsafe(eventsQuery, params),
      sql.unsafe(countQuery, params.slice(0, -2)),
    ]);

    const totalRecords = parseInt(countResult[0].total);

    // Parse JSON string fields for each event
    const parsedEvents = events.map(parseEventFields);

    return res.status(200).json({
      success: true,
      data: parsedEvents,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error("Get My Events Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
