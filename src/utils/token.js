import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
       
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

      
        user.refreshToken = refreshToken;


        // Save the user with the refresh token
        await user.save({ validateBeforeSave: false });

        // Return tokens
        return { accessToken, refreshToken };
    } catch (error) {
        // Log the error for better debugging
        console.error("Error occurred while generating tokens:", error);
        throw new ApiError(500, "Something went wrong while registering refresh and access tokens");
    }
};

export { generateAccessAndRefreshToken };
