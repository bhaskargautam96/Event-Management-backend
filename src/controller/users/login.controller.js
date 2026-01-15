import asyncHandler from "../../middleware/asycnHandler.middleware";


export const loginController = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new ApiError(400, "All fields are required");
    }
});