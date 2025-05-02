import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { User } from "../models/user.model.js";
import { postToFacebook } from "../services/facebook.service.js";

const FACEBOOK_AUTH_URL = "https://www.facebook.com/v17.0/dialog/oauth";
const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v17.0/oauth/access_token";
const FACEBOOK_USER_URL = "https://graph.facebook.com/me";

export const facebookLoginRedirect = asyncHandler(async (req, res) => {
  const redirectUrl = `${FACEBOOK_AUTH_URL}?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${process.env.FACEBOOK_REDIRECT_URI}&scope=email,public_profile`;
console.log("redirectUrl", redirectUrl);
  res.redirect(redirectUrl);
});

export const facebookCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const { _id } = req.user;
  console.log("code,id", code, _id);

  if (!code) throw new ApiError(400, "Missing Facebook auth code");

  // Exchange code for access token
  const tokenRes = await axios.get(FACEBOOK_TOKEN_URL, {
    params: {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
      code,
    },
  });
  console.log("tokenRes", tokenRes.data);

  const accessToken = tokenRes.data.access_token;
    console.log("accessToken", accessToken);

  if (!accessToken) throw new ApiError(500, "Failed to obtain access token");

  // Get user data
  const userRes = await axios.get(FACEBOOK_USER_URL, {
    params: {
      access_token: accessToken,
      fields: "id,name,email",
    },
  });
    console.log("userRes", userRes.data);
  const fbUser = userRes.data;

  if (!fbUser?.id) throw new ApiError(500, "Failed to get Facebook user");

  // Check for existing account
  let social = await SocialAccount.findOne({
    user: _id,
    platform: "facebook",
    platformUserId: fbUser.id,
  });

  if (social) {
    social.accessToken = accessToken;
    await social.save();
  } else {
    social = await SocialAccount.create({
      user: _id,
      platform: "facebook",
      accessToken,
      platformUserId: fbUser.id,
      profileName: fbUser.name,
    });
        console.log("social", social);
    await User.findByIdAndUpdate(_id, {
      $push: { socialAccounts: social._id },
    });
  }

  return res.json(new ApiResponse(200, { fbUser, accessToken }, "Facebook account connected successfully"));
});

export const uploadFacebookPostController = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  console.log("req.user", req.user);
  const { message, mediaUrl } = req.body;
    console.log("req.body", req.body);
  if (!mediaUrl) throw new ApiError(400, "Media URL is required");

  const social = await SocialAccount.findOne({
    user: _id,
    platform: "facebook",
  });
  console.log("social", social);

  if (!social || !social.accessToken) {
    throw new ApiError(404, "Facebook account not connected");
  }

  const result = await postToFacebook({
    userAccessToken: social.accessToken,
    message,
    mediaUrl,
  });

  return res.status(200).json(new ApiResponse(200, result, "Post uploaded to Facebook Page"));
});

