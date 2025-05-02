import express from "express";
import {
  facebookLoginRedirect,
  facebookCallback,
  uploadFacebookPostController,
} from "../controllers/facebook.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🔐 Facebook OAuth Redirect
router.get("/facebook/login", verifyJWT, facebookLoginRedirect);

// 🔁 Facebook OAuth Callback
router.get("/facebook/callback", verifyJWT, facebookCallback);

// 📤 Upload Post to Facebook Page (image)
router.post("/facebook/upload", verifyJWT, uploadFacebookPostController);

export default router;
