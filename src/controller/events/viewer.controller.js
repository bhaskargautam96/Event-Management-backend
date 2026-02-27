import sql from "../../db/postgres.db.connection.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";

/* =====================================================
   1️⃣ TRACK EVENT VIEW 
===================================================== */
export const trackEventView = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { viewDuration = 0, viewType = "QUICK", deviceType = "WEB" } = req.body;
    
    // Get user info from request
    const viewerId = req.user?.id || null;
    const viewerEmail = req.user?.email || null;
    const viewerName = req.user?.name || null;
    
    // Get request headers for browser/device info
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];
    const userAgent = req.headers["user-agent"] || "";
    const referrer = req.headers.referer || null;

    // Check if event exists and tracking is enabled
    const event = await sql`
      SELECT id, track_viewers FROM events WHERE id = ${eventId}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event[0].track_viewers) {
      return res.status(200).json({
        success: true,
        message: "Viewer tracking is disabled for this event",
      });
    }

    // Insert viewer record
    await sql`
      INSERT INTO event_viewers (
        event_id,
        viewer_id,
        viewer_email,
        viewer_name,
        ip_address,
        user_agent,
        referrer,
        view_duration,
        view_type,
        device_type
      ) VALUES (
        ${eventId},
        ${viewerId},
        ${viewerEmail},
        ${viewerName},
        ${ipAddress},
        ${userAgent},
        ${referrer},
        ${viewDuration},
        ${viewType},
        ${deviceType}
      )
    `;

    return res.status(200).json({
      success: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("Track View Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   2️⃣ GET VIEWER STATISTICS 
===================================================== */
export const getViewerStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { role, id: userId } = req.user;

    // Verify event exists and user is the organizer or admin
    const event = await sql`
      SELECT id, organizer_id, title FROM events WHERE id = ${eventId}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check authorization
    if (event[0].organizer_id !== userId && !["ADMIN", "SUPERADMIN"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this event's statistics",
      });
    }

    // Get viewer statistics
    const stats = await sql`
      SELECT 
        event_id,
        COUNT(DISTINCT CASE WHEN viewer_id IS NOT NULL THEN viewer_id END) as unique_authenticated_viewers,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(*) as total_views,
        COUNT(CASE WHEN view_type = 'DETAILED' THEN 1 END) as detailed_views,
        COUNT(CASE WHEN view_type = 'INTERESTED' THEN 1 END) as interested_views,
        ROUND(AVG(view_duration)::numeric, 2) as avg_view_duration,
        MAX(viewed_at) as last_viewed_at
      FROM event_viewers
      WHERE event_id = ${eventId} AND is_delete = false
      GROUP BY event_id
    `;

    // Get top viewers
    const topViewers = await sql`
      SELECT 
        viewer_id,
        viewer_email,
        viewer_name,
        COUNT(*) as view_count,
        SUM(view_duration) as total_duration,
        MAX(viewed_at) as last_viewed_at
      FROM event_viewers
      WHERE event_id = ${eventId} 
        AND viewer_id IS NOT NULL 
        AND is_delete = false
      GROUP BY viewer_id, viewer_email, viewer_name
      ORDER BY view_count DESC
      LIMIT 10
    `;

    // Get recent views
    const recentViews = await sql`
      SELECT 
        id,
        viewer_id,
        viewer_email,
        viewer_name,
        device_type,
        view_type,
        view_duration,
        viewed_at
      FROM event_viewers
      WHERE event_id = ${eventId} AND is_delete = false
      ORDER BY viewed_at DESC
      LIMIT 20
    `;

    return res.status(200).json({
      success: true,
      data: {
        eventTitle: event[0].title,
        summary: stats[0] || {
          unique_authenticated_viewers: 0,
          unique_ips: 0,
          total_views: 0,
          detailed_views: 0,
          interested_views: 0,
          avg_view_duration: 0,
          last_viewed_at: null,
        },
        topViewers,
        recentViews,
      },
    });
  } catch (error) {
    console.error("Get Viewer Stats Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   3️⃣ TOGGLE VIEWER TRACKING 
===================================================== */
export const toggleViewerTracking = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { trackViewers } = req.body;
    const { role, id: userId } = req.user;

    // Verify event exists and user is the organizer or admin
    const event = await sql`
      SELECT id, organizer_id FROM events WHERE id = ${eventId}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check authorization
    if (event[0].organizer_id !== userId && !["ADMIN", "SUPERADMIN"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      });
    }

    // Update tracking setting
    const updatedEvent = await sql`
      UPDATE events
      SET track_viewers = ${trackViewers}
      WHERE id = ${eventId}
      RETURNING id, track_viewers
    `;

    return res.status(200).json({
      success: true,
      message: `Viewer tracking ${trackViewers ? "enabled" : "disabled"}`,
      data: {
        eventId: updatedEvent[0].id,
        trackViewers: updatedEvent[0].track_viewers,
      },
    });
  } catch (error) {
    console.error("Toggle Tracking Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   4️⃣ GET ALL VIEWERS FOR EVENT 
===================================================== */
export const getEventViewers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { role, id: userId } = req.user;
    let { page = 1, limit = 20, viewType, deviceType } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Verify event exists and user is authorized
    const event = await sql`
      SELECT id, organizer_id FROM events WHERE id = ${eventId}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check authorization
    if (event[0].organizer_id !== userId && !["ADMIN", "SUPERADMIN"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this event's viewers",
      });
    }

    // Build WHERE conditions
    let whereConditions = [`event_id = ${eventId}`, `is_delete = false`];
    let params = [];
    let paramIndex = 1;

    if (viewType) {
      whereConditions.push(`view_type = $${paramIndex}`);
      params.push(viewType);
      paramIndex++;
    }

    if (deviceType) {
      whereConditions.push(`device_type = $${paramIndex}`);
      params.push(deviceType);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get paginated viewers
    const viewers = await sql.unsafe(`
      SELECT 
        id,
        viewer_id,
        viewer_email,
        viewer_name,
        ip_address,
        device_type,
        view_type,
        view_duration,
        referrer,
        viewed_at
      FROM event_viewers
      WHERE ${whereClause}
      ORDER BY viewed_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limit, skip]);

    // Get total count
    const countResult = await sql.unsafe(`
      SELECT COUNT(*) as total FROM event_viewers
      WHERE ${whereClause}
    `, params);

    const totalRecords = parseInt(countResult[0].total);

    return res.status(200).json({
      success: true,
      data: viewers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error("Get Event Viewers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   5️⃣ DELETE VIEWER RECORDS (SOFT DELETE) 
===================================================== */
export const deleteViewerRecords = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { role, id: userId } = req.user;

    // Verify event exists and user is authorized
    const event = await sql`
      SELECT id, organizer_id FROM events WHERE id = ${eventId}
    `;

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check authorization
    if (event[0].organizer_id !== userId && !["ADMIN", "SUPERADMIN"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete viewers",
      });
    }

    // Soft delete all viewer records
    await sql`
      UPDATE event_viewers
      SET is_delete = true
      WHERE event_id = ${eventId}
    `;

    return res.status(200).json({
      success: true,
      message: "All viewer records deleted",
    });
  } catch (error) {
    console.error("Delete Viewers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
