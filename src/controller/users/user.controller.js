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
    const { search, page, limit } = req.params;
    const { role } = req.user;
    if (!req.user || role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: Admins only",
      });
    }
    let filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      filter.skip = skip;
      filter.limit = parseInt(limit);
    }
    // if SUPERADMIN THEN GET ALL USERS INCLUDING DELETED ONES OTHERWISE GET ONLY NON-DELETED USERS
    if (["SUPERADMIN"].includes(role)) {
      // find role based on user role
      filter.isDelete = { $in: [true, false] };
    }
    const users = await User.find(filter)
      .select("-password -refreshTokens")
      .lean();
    return res.status(200).json(
      new ApiResponse("All users retrieved successfully", {
        users,
      }),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
