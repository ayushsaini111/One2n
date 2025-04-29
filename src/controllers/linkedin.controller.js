// controllers/linkedin.controller.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getLinkedInAccessToken, getLinkedInProfile, postToLinkedIn } from '../services/linkedin.service.js';
import { SocialAccount } from '../models/socialAccount.model.js';

export const login = asyncHandler((req, res) => {
  const state = Math.random().toString(36).substring(7);
  const scope = 'r_liteprofile r_emailaddress w_member_social';

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&state=${state}&scope=${scope}`;
  res.redirect(url);
});

export const callback = asyncHandler(async (req, res) => {
  console.log('Query Params:', req.query); // ✅ Add this

  const { code, state } = req.query;
  if (!code) {
    throw new ApiError(400, 'Authorization code is missing from callback.');
  }

  const { access_token, expires_in } = await getLinkedInAccessToken({
    code,
    redirectUri: process.env.LINKEDIN_REDIRECT_URI,
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  });

  const profile = await getLinkedInProfile(access_token);
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'User not logged in');
  }

  const socialAccount = await SocialAccount.create({
    user: userId,
    platform: 'linkedin',
    accessToken: access_token,
    platformUserId: profile.id,
    tokenExpiry: new Date(Date.now() + expires_in * 1000),
  });

  res.cookie('linkedin_token', access_token, { httpOnly: true });
  ApiResponse(res, 200, 'Successfully authenticated with LinkedIn!', { socialAccount });
});

export const postContent = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const accessToken = req.cookies.linkedin_token;
  const linkedinId = req.user?.linkedinId;

  if (!accessToken || !linkedinId) {
    throw new ApiError(401, 'Unauthorized. Missing token or LinkedIn ID');
  }

  const response = await postToLinkedIn({ accessToken, content, linkedinId });
  ApiResponse(res, 200, 'Post successful!', response);
});
