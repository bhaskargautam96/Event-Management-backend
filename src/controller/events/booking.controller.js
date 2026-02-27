import sql from "../../db/postgres.db.connection.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

/* =====================================================
   1️⃣ CHECK SLOT AVAILABILITY
===================================================== */
export const checkSlotAvailability = async (req, res) => {
  try {
    const { eventId, bookingDate, bookingTime } = req.query;

    if (!eventId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "eventId and bookingDate are required",
      });
    }

    // Get event details
    const event = await sql`
      SELECT * FROM events WHERE id = ${eventId} AND is_delete = false
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const eventData = event[0];

    // Check if date is in the past
    const selectedDate = new Date(bookingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Cannot book dates in the past",
        available: false,
      });
    }

    // Check existing bookings for this slot
    const existingBookings = await sql`
      SELECT * FROM event_bookings
      WHERE event_id = ${eventId}
      AND booking_date = ${bookingDate}
      ${bookingTime ? sql`AND booking_time = ${bookingTime}` : sql``}
      AND status NOT IN ('CANCELLED')
      AND is_delete = false
    `;

    const bookedCount = existingBookings.length;
    const maxCapacity = eventData.capacity?.maxGuests || 1;

    const isAvailable = bookedCount < maxCapacity;

    return res.status(200).json({
      success: true,
      available: isAvailable,
      data: {
        eventId: parseInt(eventId),
        bookingDate,
        bookingTime,
        bookedCount,
        maxCapacity,
        remainingSlots: maxCapacity - bookedCount,
        status: isAvailable ? "AVAILABLE" : "FULL",
      },
    });
  } catch (error) {
    console.error("Check Slot Availability Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   2️⃣ GET AVAILABLE DATES FOR EVENT
===================================================== */
export const getAvailableDates = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;

    // Get event details
    const event = await sql`
      SELECT * FROM events WHERE id = ${eventId} AND is_delete = false
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const eventData = event[0];
    const maxCapacity = eventData.capacity?.maxGuests || 1;

    // Build date range query
    let dateFilter = sql`booking_date >= CURRENT_DATE`;
    
    if (startDate && endDate) {
      dateFilter = sql`booking_date BETWEEN ${startDate} AND ${endDate}`;
    } else if (startDate) {
      dateFilter = sql`booking_date >= ${startDate}`;
    }

    // Get booking counts per date
    const bookingStats = await sql`
      SELECT 
        booking_date,
        booking_time,
        COUNT(*) as booked_count,
        ${maxCapacity} as max_capacity,
        CASE 
          WHEN COUNT(*) >= ${maxCapacity} THEN 'FULL'
          ELSE 'AVAILABLE'
        END as status
      FROM event_bookings
      WHERE event_id = ${eventId}
      AND ${dateFilter}
      AND status NOT IN ('CANCELLED')
      AND is_delete = false
      GROUP BY booking_date, booking_time
      ORDER BY booking_date ASC, booking_time ASC
    `;

    return res.status(200).json({
      success: true,
      data: {
        eventId: parseInt(eventId),
        eventTitle: eventData.title,
        maxCapacity,
        slots: bookingStats.map(stat => ({
          date: stat.booking_date,
          time: stat.booking_time,
          bookedCount: parseInt(stat.booked_count),
          remainingSlots: maxCapacity - parseInt(stat.booked_count),
          status: stat.status,
          isAvailable: stat.status === 'AVAILABLE'
        })),
      },
    });
  } catch (error) {
    console.error("Get Available Dates Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   3️⃣ CREATE BOOKING
===================================================== */
export const createBooking = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      eventId,
      bookingDate,
      bookingTime,
      duration,
      guestCount,
      userName,
      userEmail,
      userPhone,
      specialRequirements,
      notes,
    } = req.body;

    // Validate required fields
    if (!eventId || !bookingDate) {
      return res.status(400).json({
        success: false,
        message: "eventId and bookingDate are required",
      });
    }

    // Get event details
    const event = await sql`
      SELECT * FROM events WHERE id = ${eventId} AND is_delete = false
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const eventData = event[0];

    // Check if event is bookable
    if (!eventData.booking_settings?.isBookingOpen) {
      return res.status(400).json({
        success: false,
        message: "Booking is not open for this event",
      });
    }

    // Check slot availability
    const existingBookings = await sql`
      SELECT * FROM event_bookings
      WHERE event_id = ${eventId}
      AND booking_date = ${bookingDate}
      ${bookingTime ? sql`AND booking_time = ${bookingTime}` : sql``}
      AND status NOT IN ('CANCELLED')
      AND is_delete = false
    `;

    const bookedCount = existingBookings.length;
    const maxCapacity = eventData.capacity?.maxGuests || 1;

    if (bookedCount >= maxCapacity) {
      return res.status(400).json({
        success: false,
        message: "This slot is already fully booked",
        available: false,
      });
    }

    // Calculate amount
    const basePrice = eventData.pricing?.basePrice || 0;
    const totalAmount = basePrice;
    const advancePayment = eventData.pricing?.advancePayment || 0;

    // Determine initial status
    const autoApprove = eventData.booking_settings?.autoApprove || false;
    const bookingStatus = autoApprove ? "CONFIRMED" : "PENDING";

    // Create booking
    const booking = await sql`
      INSERT INTO event_bookings (
        event_id,
        user_id,
        user_name,
        user_email,
        user_phone,
        booking_date,
        booking_time,
        duration,
        guest_count,
        status,
        payment_status,
        total_amount,
        advance_paid,
        special_requirements,
        notes
      ) VALUES (
        ${eventId},
        ${userId},
        ${userName || null},
        ${userEmail || null},
        ${userPhone || null},
        ${bookingDate},
        ${bookingTime || null},
        ${duration || eventData.duration || 1},
        ${guestCount || 1},
        ${bookingStatus},
        'UNPAID',
        ${totalAmount},
        0,
        ${specialRequirements || null},
        ${notes || null}
      )
      RETURNING *
    `;

    // Update event booking count
    await sql`
      UPDATE events
      SET stats = jsonb_set(
        stats,
        '{bookings}',
        ((stats->>'bookings')::int + 1)::text::jsonb
      )
      WHERE id = ${eventId}
    `;

    return res.status(201).json(
      new ApiResponse("Booking created successfully", {
        data: booking[0],
        message: autoApprove 
          ? "Your booking is confirmed!"
          : "Your booking is pending approval from the organizer",
      })
    );
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json(
      new ApiError("Error creating booking", {
        error: error.message,
      })
    );
  }
};

/* =====================================================
   4️⃣ GET USER BOOKINGS
===================================================== */
export const getUserBookings = async (req, res) => {
  try {
    const { id: userId } = req.user;
    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    let whereConditions = [`user_id = $1`, `is_delete = false`];
    let params = [userId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Get bookings with event details
    const bookingsQuery = `
      SELECT 
        eb.*,
        e.title as event_title,
        e.images as event_images,
        e.location as event_location,
        e.type_id,
        e.sub_type_id
      FROM event_bookings eb
      JOIN events e ON eb.event_id = e.id
      ${whereClause}
      ORDER BY eb.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, skip);

    const countQuery = `
      SELECT COUNT(*) as total FROM event_bookings
      ${whereClause}
    `;

    const [bookings, countResult] = await Promise.all([
      sql.unsafe(bookingsQuery, params),
      sql.unsafe(countQuery, params.slice(0, -2)),
    ]);

    const totalRecords = parseInt(countResult[0].total);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error("Get User Bookings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   5️⃣ GET EVENT BOOKINGS (ORGANIZER/ADMIN)
===================================================== */
export const getEventBookings = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { role, id: userId } = req.user;
    let { page = 1, limit = 10, status } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Check if user is authorized to view these bookings
    const event = await sql`
      SELECT * FROM events WHERE id = ${eventId}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const eventData = event[0];

    if (
      eventData.organizer_id !== userId &&
      !["ADMIN", "SUPERADMIN"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these bookings",
      });
    }

    let whereConditions = [`event_id = $1`, `is_delete = false`];
    let params = [eventId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const bookingsQuery = `
      SELECT * FROM event_bookings
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, skip);

    const countQuery = `
      SELECT COUNT(*) as total FROM event_bookings
      ${whereClause}
    `;

    const [bookings, countResult] = await Promise.all([
      sql.unsafe(bookingsQuery, params),
      sql.unsafe(countQuery, params.slice(0, -2)),
    ]);

    const totalRecords = parseInt(countResult[0].total);

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Event Bookings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   6️⃣ UPDATE BOOKING STATUS (ORGANIZER/ADMIN)
===================================================== */
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    // Get booking details
    const booking = await sql`
      SELECT eb.*, e.organizer_id
      FROM event_bookings eb
      JOIN events e ON eb.event_id = e.id
      WHERE eb.id = ${bookingId}
    `;

    if (!booking || booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const bookingData = booking[0];

    // Authorization check
    if (
      bookingData.organizer_id !== userId &&
      !["ADMIN", "SUPERADMIN"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    // Update booking status
    const updatedBooking = await sql`
      UPDATE event_bookings
      SET status = ${status},
          ${status === 'CANCELLED' ? sql`cancelled_at = CURRENT_TIMESTAMP` : sql``}
      WHERE id = ${bookingId}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking[0],
    });
  } catch (error) {
    console.error("Update Booking Status Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   7️⃣ CANCEL BOOKING (USER)
===================================================== */
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { cancellationReason } = req.body;
    const { id: userId } = req.user;

    // Get booking
    const booking = await sql`
      SELECT * FROM event_bookings WHERE id = ${bookingId}
    `;

    if (!booking || booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const bookingData = booking[0];

    // Check if user owns this booking
    if (bookingData.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Check if already cancelled
    if (bookingData.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // Cancel booking
    const updatedBooking = await sql`
      UPDATE event_bookings
      SET 
        status = 'CANCELLED',
        cancelled_at = CURRENT_TIMESTAMP,
        cancellation_reason = ${cancellationReason || null}
      WHERE id = ${bookingId}
      RETURNING *
    `;

    // Decrement booking count on event
    await sql`
      UPDATE events
      SET stats = jsonb_set(
        stats,
        '{bookings}',
        ((stats->>'bookings')::int - 1)::text::jsonb
      )
      WHERE id = ${bookingData.event_id}
    `;

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking[0],
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   8️⃣ GET SINGLE BOOKING
===================================================== */
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { id: userId, role } = req.user;

    const booking = await sql`
      SELECT 
        eb.*,
        e.title as event_title,
        e.description as event_description,
        e.images as event_images,
        e.location as event_location,
        e.pricing as event_pricing,
        e.contact_details as event_contact,
        e.organizer_id
      FROM event_bookings eb
      JOIN events e ON eb.event_id = e.id
      WHERE eb.id = ${bookingId}
    `;

    if (!booking || booking.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const bookingData = booking[0];

    // Authorization check: user owns booking OR is organizer OR is admin
    if (
      bookingData.user_id !== userId &&
      bookingData.organizer_id !== userId &&
      !["ADMIN", "SUPERADMIN"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    return res.status(200).json({
      success: true,
      data: bookingData,
    });
  } catch (error) {
    console.error("Get Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
