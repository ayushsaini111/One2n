import multer from "multer";
import path from "path";

// Disk Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp"); // Temp storage
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  },
});

// Filter: Only image/video files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB max
  },
});