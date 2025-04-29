import mongoose from "mongoose";
import { User } from "./user.model.js";

const socialAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  platform: {
    type: String,
    enum: ["facebook", "instagram", "linkedin"],
    required: true,
  },

  accessToken: {
    type: String,
    required: true,
  },

  refreshToken: {
    type: String, // Only some platforms give this
  },

  tokenExpiry: {
    type: Date, // Optional if you want to store expiry time
  },

  platformUserId: {
    type: String, // Facebook userId, LinkedIn userId etc.
    required: true,
  },

}, { timestamps: true });

export const SocialAccount = mongoose.model("SocialAccount", socialAccountSchema);
