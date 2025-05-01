import express from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPostController } from "../controllers/post.controller.js";

const router = express.Router();

// Authenticated upload route
router.route("/create").post(
    upload.fields(
    [
        {
            name: "media", maxCount: 1
        }
        
    ]
),
  verifyJWT,
  createPostController
);

export default router;