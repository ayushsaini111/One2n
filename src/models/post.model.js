import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    mediaUrl: {
      type: String,
      required: true, // Path or URL to the uploaded media
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    platforms: [
      {
        type: String,
        enum: ["instagram", "facebook", "linkedin", "twitter"], // Expandable
        required: true,
      },
    ],
    scheduledAt: {
      type: Date, // Optional: For scheduling posts in future
    },
    status: {
      type: String,
      enum: ["pending", "posted", "failed"],
      default: "pending",
    },
    platformResponses: {
      instagram: {
        postId: String,
        error: String,
      },
      facebook: {
        postId: String,
        error: String,
      },
      // Extend for other platforms
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model("Post", postSchema);