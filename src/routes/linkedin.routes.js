import express from "express";
import {
  linkedinLoginRedirect,
  linkedinCallback,
  uploadLinkedInPostController,
} from "../controllers/linkedin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 1️⃣ Kick off OAuth
router.get("/linkedin/login", verifyJWT, linkedinLoginRedirect);

// 2️⃣ Handle LinkedIn’s callback
router.get("/linkedin/callback", verifyJWT, linkedinCallback);

// 3️⃣ Post to LinkedIn
router.post("/linkedin/upload", verifyJWT, uploadLinkedInPostController);

export default router;
