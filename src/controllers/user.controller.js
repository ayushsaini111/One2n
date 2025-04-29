// signup.controller.js

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signupSchema, loginSchema ,sendOtpSchema,verifyOtpSchema} from "../validators/auth.validator.js";
import { generateAccessAndRefreshToken } from "../utils/token.js";
import { sendOTPEmail,generateOTP } from "../controllers/auth.controller.js";
import bcrypt from "bcryptjs";

const registerUser = asyncHandler(async (req, res) => {
    // Validate request body using Zod
    const parsedData = signupSchema.safeParse(req.body);

    if (!parsedData.success) {
        // If validation fails, throw an error with validation issues
        throw new ApiError(400, "Invalid input", parsedData.error.errors);
    }

    const { firstName, lastName, email, password } = parsedData.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email, authProvider: "local" });
    if (existingUser) {
        throw new ApiError(409, "User already exists with this email");
    }

    const username = `${firstName}${lastName}`;

    // Create new user
    const newUser = await User.create({
        firstName,
        lastName,
        username,
        email,
        password,
        authProvider: "local",
        isVerified: false,
    });
    console.log("New user created:", newUser);
    // Generate tokens
    
    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expiry time (10 minutes)
    const otpHash = await bcrypt.hash(otp, 10);
    // Store OTP and expiry in the user model
    newUser.otp = otpHash;
    newUser.otpExpiry = otpExpiry;
    await newUser.save();
    
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(newUser._id);
    // Send OTP email
    try {
        // await sendOTPEmail(email, otp); // Send OTP via email
        console.log("OTP sent to email");
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to send OTP. Please try again later.", [error.message]));
    }
    
    // Prepare response
    const userResponse = await User.findById(newUser._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, {
            user: userResponse,
            accessToken,
            refreshToken,
        }, "User registered & OTP sent successfully. Please verify your email."));
});

const verifyOTP = asyncHandler(async (req, res) => {
    // Validate request body using Zod schema
    const parsedData = verifyOtpSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid input", parsedData.error.errors));
    }

    const { email, otp } = parsedData.data;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User not found !"));
    }

    // Check if OTP is correct
    if (user.otp !== otp) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid OTP"));
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiry) {
        return res.status(400).json(new ApiResponse(400, null, "OTP has expired"));
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = null; // Clear OTP
    user.otpExpiry = null; // Clear OTP expiry
    await user.save();
console.log("User register verified successfully:", user);
    return res.status(200).json(new ApiResponse(200, null, "Email verified successfully"));
});


const loginUser = asyncHandler(async (req, res) => {
    // Validate input with Zod
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json(new ApiResponse(400, null, "Invalid input", parsedData.error.errors));
    }

    const { email, password } = parsedData.data;

    // Find the user by email
    const user = await User.findOne({ email, authProvider: "local" });
    if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Check password validity
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        return res.status(401).json(new ApiResponse(401, null, "Invalid credentials"));
    }

    // Generate OTP and set expiry time
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
    const otpHash = await bcrypt.hash(otp, 10);
    // Store OTP and expiry time in the user model
    user.otp = otpHash;
    user.otpExpiry = otpExpiry;

    const loggedInUser = await user.save();

    // Send OTP email
    try {
        // await sendOTPEmail(email, otp);
        console.log("login OTP sent to email:", email);

        
       
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to send OTP. Please try again later.", [error.message]));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(loggedInUser._id);

    // Save the refresh token to the user (optional for persistence)
    loggedInUser.refreshToken = refreshToken;
    await loggedInUser.save();

    // Set cookies with the tokens
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Set to true in production
        sameSite: "None", // Required for cross-origin cookies
    };

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "OTP sent to email. Please verify."));
});


const logoutUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1, // This removes the refreshToken field
        },
      },
      { new: true }
    );
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out"));
  });
  
  
const refreshAccessToken=asyncHandler(async(req,res)=>{

    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorised request")
    }
    
    try {
        const decodedToken=jwt.verify(incomingRefreshToken,REFRESH_TOKEN_SECRET)
        
        const user =await User.findById(decodedToken?._id)
        
        if(!user){    
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if (incomingRefreshToken !==user?.refreshToken) {
            throw new ApiError(401,"Refresh token is rxpired or used")
        }
    
        const options ={
            http:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken}=await gernerateAccessAndRefreshTokens(user.id)
    
        return res 
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,"Invalid refresh token")
        
    }

})

export { registerUser, loginUser, verifyOTP,logoutUser ,refreshAccessToken};