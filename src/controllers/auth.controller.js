import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import transporter from "../config/nodemailer.js";
import axios from "axios";
import {User} from "../models/user.model.js";
import { generateAndSendToken } from "../utils/authTokens.js";
// import transporter from "../config/nodemailer.js";

export const sendAuthToken=asyncHandler(async (req, res) => {
  console.log("uuuuuuuuuu",req.user);
    const googleUser =req.user;

    // const accessToken =  await googleUser.generateAccessToken();
    // const refreshToken =  await googleUser.generateRefreshToken();
    const response   = await generateAndSendToken(googleUser, res, "Google login successful")
     // Save tokens to user document in the database
  // googleUser.accessToken = accessToken;
  // googleUser.refreshToken = refreshToken;
  await googleUser.save();  // Save updated user document

    const user={
        _id:googleUser._id,
        username:`${googleUser.firstName}${googleUser.lastName}`,
        email:googleUser.email,
    }
    const options = {
      httpOnly: true,
      secure: true,
  };
    res
    .status(200)
    .json(response)
    // .cookie("accessToken", accessToken, options)
    // .cookie("refreshToken", refreshToken, options)
    

    // .json(new ApiResponse(
    //     200,
    //     {
    //         user,
    //         accessToken,
    //         refreshToken
    //     },
    //     "Google login successfully"
    // ));
    try {
      await transporter.sendMail({
          from: 'your-email@example.com',
          to: googleUser.email,
          subject: 'Welcome!',
          text: `Hello ${googleUser.firstName},\n\nWelcome to our platform! You have successfully logged in with Google.`,
      });
  } catch (error) {
      console.error("Error sending welcome email:", error);
  }
});

// Logout route with asyncHandler for error handling
export const googleLogout = asyncHandler(async (req, res) => {
  console.log(req.user);
      const logoutUser=await User.findByIdAndUpdate(
        req.user._id,
        { $set:{
          isVerified:false,
        },
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
        .json(new ApiResponse(200, {user:logoutUser}, "User logged out successfully"));
});


// Generate OTP
export const generateOTP = (length = 6) => {
    const characters = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += characters[Math.floor(Math.random() * characters.length)];
    }
    return otp;
  };
  
  // Send OTP Email
export const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('OTP sent: ' + info.response);
    } catch (error) {
      console.error('Error sending OTP email: ', error);
      throw new ApiError(500, "Failed to send OTP");
    }
  };