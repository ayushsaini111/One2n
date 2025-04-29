import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SocialAccount } from "./socialAccount.model.js";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      // unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "facebook", "instagram"],
      required: true,
      default: "local",
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
      minlength: 6,
    },

    socialMediaId: {
      type: String,
      default: null,
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: { type: String, default: null },        // OTP code
    otpExpiry: { type: Date, default: null },

    refreshToken: {
      type: String,
      default: null,
    },
    socialAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SocialAccount",
      }
    ],
    
  },
  { timestamps: true, }
);

userSchema.pre("save", async function (next) {
  if (this.authProvider !== "local") return next();

  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    console.log("unable to hash password", error);
    next(error);
  }

})

userSchema.methods.isPasswordCorrect = async function (password) {
  if (this.authProvider !== "local") return true;

  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.log("unable to compare password", error);
    return false;
  }
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: `${this.firstName} ${this.lastName}`,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,//1d
    }
  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,//10d
    }
  )
}
export const User = mongoose.model("User", userSchema);
