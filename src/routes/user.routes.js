import { Router } from "express";
import { registerUser, loginUser,verifyOTP,logoutUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // JWT verification middleware

const router = Router();

// Public Routes
router.route("/register").post(registerUser);  // Register new user (sign up)
router.route("/login").post(loginUser);  // Login existing user
// router.route("/send-otp").post(sendOTP);  // Send OTP to email
router.route("/verify-otp").post(verifyOTP);  // Verify OTP

// Protected Routes (requires JWT token)
router.use(verifyJWT);  // Apply the JWT verification middleware to all the following routes

router.route("/logout").post(verifyJWT,logoutUser);  // Logout user

export default router;
