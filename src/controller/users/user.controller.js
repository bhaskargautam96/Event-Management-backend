import User from "../../model/user/user.schema.js";
import ApiResponse from "../../utils/ApiResponse.js";

export const getUserDetail = async (req, res) => {
  try {
    const { id } = req.user;
    let fullDetails;
    const user = await User.findById(id)
      .select("-password -refreshTokens")
      .lean();
     fullDetails={
        ...user,
        isLoggedIn:true
    }
    if(!user){
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
