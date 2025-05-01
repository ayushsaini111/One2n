import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Post } from "../models/post.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createPostController = asyncHandler(async (req, res) => {
  const { title, description, platforms } = req.body;
  console.log("revfbdjs", title);
  
  const user = req.user;
  console.log();
  
  const {media } = req.files

  if (!media || media.length === 0) {
    throw new ApiError(401,"file not recieved from user")
  }

console.log("media is " ,media );


  // Validate fields
  if (!title || !description || !platforms) {
    throw new ApiError(400, "All fields are required");
  }

  const localPath = media[0].path.replace(/\\/g, "/");
console.log(localPath);

  // Upload to Cloudinary
  const cloudUpload = await uploadOnCloudinary(localPath);
  console.log(cloudUpload);
  
  if (!cloudUpload) {
    throw new ApiError(500, "Failed to upload media to Cloudinary");
  }
 console.log("after upload on cloudinary");
 
  const mediaType = media[0].mimetype.startsWith("video") ? "video" : "image";

  // Save Post in DB
  const post = await Post.create({
    user: user._id,
    title,
    description,
    mediaUrl: cloudUpload.url,
    mediaType,
    platforms,
  });
    console.log("post is ", post);
   

  res.status(201)
  .json(new ApiResponse(
    200,
    {
      post
    },
    " post schema is ready for upload"
  ));
});