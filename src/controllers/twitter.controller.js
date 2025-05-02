// controllers/twitter.controller.js
import { twitterLoginService, twitterCallbackService, postToTwitterService } from "../services/twitter.service.js"; // Adjust import
import { SocialAccount } from "../models/socialAccount.model.js"; // Adjust if necessary
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const twitterLogin = asyncHandler(async (req, res) => {
  const loginUrl = await twitterLoginService();
  console.log("🔗 Twitter login URL:", loginUrl);
  res.redirect(loginUrl);
});

export const twitterCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const tokenData = await twitterCallbackService(code);

  const { access_token, refresh_token } = tokenData;

  // Save to DB (Assuming you have a `SocialAccount` model)
  const socialAccount = await SocialAccount.create({
    user: req.user._id,
    platform: "twitter",
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  res.redirect("/dashboard"); // or wherever
});

export const postToTwitter = asyncHandler(async (req, res) => {
  const { tweet } = req.body;
  const socialAccount = await SocialAccount.findOne({
    user: req.user._id,
    platform: "twitter",
  });

  if (!socialAccount) throw new ApiError(401, "No Twitter account linked");

  const postRes = await postToTwitterService(tweet, socialAccount.accessToken);

  res.status(200).json(
    new ApiResponse(200, postRes, "Tweet posted successfully")
  );
});
