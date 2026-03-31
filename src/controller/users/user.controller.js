import User from "../../model/user/user.schema.js";
import ApiResponse from "../../utils/ApiResponse.js";

export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.user;
    let fullDetails;
    const user = await User.findById(id)
      .select("-password -refreshTokens")
      .lean();
    fullDetails = {
      ...user,
      isLoggedIn: true,
    };
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    return res.status(200).json(
      new ApiResponse("Authenticated user", {
        user: {
          user: fullDetails,
        },
      }),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status, isVerified ,role:filterRole} = req.query;
    const { role } = req.user;
    if (!req.user && !["SUPERADMIN","ADMIN"].includes(role)) {
      return res.status(403).json({
        message: "Forbidden: Admins only",
      });
    }
    
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    let filter = {};
    const searchTerm = String(search || "").trim();
    if (searchTerm) {
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
        { role: { $regex: searchTerm, $options: "i" } },
      ];
    }
    // if SUPERADMIN or ALL THEN GET ALL USERS INCLUDING DELETED ONES OTHERWISE GET ONLY NON-DELETED USERS
    if (["SUPERADMIN", "ALL"].includes(role)) {
      // find role based on user role
      filter.isDelete = { $in: [true, false] };
    } else {
      filter.isDelete = false;
    }
    // Only get active users
    filter.isActive = true;
    // Add status filter if provided
    if (status && status !== "ALL") {
      filter.isActive = status=== "active" ? true : false;
    }
    // Add role filter if provided
    if (filterRole && filterRole !== "ALL") {
      filter.role = filterRole;
    }
    // Add isVerified filter if provided
    if (isVerified !== undefined && isVerified !== null) {
      filter.isVerified = isVerified === "true" || isVerified === true;
    }

    console.log("User filter:", filter,status,filterRole,isVerified);
    
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-password -refreshTokens")
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(filter),
    ]);
    
    return res.status(200).json(
      new ApiResponse("All users retrieved successfully", {
        users,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNumber),
        },
      }),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllUsersByRole = async (req, res) => {
  try {
    const { search, page = 1, limit = 10, isActive, role, status, isVerified } = req.query;

    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    const searchTerm = String(search || "").trim();
    
    const query = {
      isDelete: false,
      ...(isActive !== undefined && { isActive: isActive === "true" || isActive === true }),
      ...(role !== "ALL" && role && { role }),
      ...(status && status !== "ALL" && { status }),
      ...(isVerified !== undefined && isVerified !== null && { isVerified: isVerified === "true" || isVerified === true }),
      ...(searchTerm && {
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { phone: { $regex: searchTerm, $options: "i" } },
        ],
      }),
    };
    
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select("-password -refreshTokens")
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(query),
    ]);
    
    return res.status(200).json(
      new ApiResponse(`${role} users retrieved successfully`, {
        users,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNumber),
        },
      }),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
