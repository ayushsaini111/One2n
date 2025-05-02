import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SocialAccount } from "../models/socialAccount.model.js";
import { User } from "../models/user.model.js";

/**
 * 1️⃣ Redirect user to LinkedIn’s OAuth screen
 */
export const linkedinLoginRedirect = asyncHandler(async (req, res) => {
  const scopes = [
    "r_liteprofile",      // basic profile
    "r_emailaddress",     // email
    "w_member_social"     // permission to post on their behalf
  ].join("%20");

  const redirectUrl = [
    "https://www.linkedin.com/oauth/v2/authorization",
    `?response_type=code`,
    `&client_id=${"86pjtlcal63lvp"}`,
    `&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}`,
    `&scope=${scopes}`,
  ].join("");

  res.redirect(redirectUrl);
});

/**
 * 2️⃣ Exchange code → access token, fetch user ID & email, store in SocialAccount
 */
export const linkedinCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const { _id } = req.user;
    console.log("code,id", code, _id);
  if (!code) throw new ApiError(400, "Missing LinkedIn auth code");

  // Exchange code for access token
  const tokenRes = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    null,
    {
      params: {
        grant_type:    "authorization_code",
        code,
        redirect_uri:  process.env.LINKEDIN_REDIRECT_URI,
        client_id:     process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );
  const accessToken = tokenRes.data.access_token;
  if (!accessToken) throw new ApiError(500, "Failed to obtain access token");

  // Fetch the user’s LinkedIn member ID & name
  const profileRes = await axios.get("https://api.linkedin.com/v2/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const emailRes = await axios.get(
    "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const liUserId = profileRes.data.id;
  const liName   = `${profileRes.data.localizedFirstName} ${profileRes.data.localizedLastName}`;
  const liEmail  = emailRes.data.elements[0]["handle~"].emailAddress;

  // Save or update SocialAccount
  let social = await SocialAccount.findOne({
    user: _id,
    platform: "linkedin",
    platformUserId: liUserId,
  });

  if (social) {
    social.accessToken = accessToken;
    await social.save();
  } else {
    social = await SocialAccount.create({
      user: _id,
      platform: "linkedin",
      accessToken,
      platformUserId: liUserId,
      profileName: liName,
    });
    await User.findByIdAndUpdate(_id, {
      $push: { socialAccounts: social._id },
    });
  }

  res.json(new ApiResponse(
    200,
    { liUserId, liName, liEmail, accessToken },
    "LinkedIn account connected successfully"
  ));
});

/**
 * 3️⃣ Post a simple text update to LinkedIn
 */
export const uploadLinkedInPostController = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  console.log("req.user", req.user);
  const { message } = req.body;
  if (!message) throw new ApiError(400, "Message is required");

  const social = await SocialAccount.findOne({
    user: _id,
    platform: "linkedin",
  });
    console.log("social", social);
  if (!social || !social.accessToken) {
    throw new ApiError(404, "LinkedIn account not connected");
  }

  // The “author” must be in the format: urn:li:person:<memberId>
  const author = `urn:li:person:${social.platformUserId}`;

  const result = await postToLinkedIn({
    accessToken: social.accessToken,
    author,
    message,
  });

  res.status(200).json(
    new ApiResponse(200, result, "Post uploaded to LinkedIn successfully")
  );
});
