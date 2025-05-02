// services/facebook.service.js
import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

export const postToFacebook = async ({ userAccessToken, message, mediaUrl }) => {
  // Step 1: Get the list of Pages
  try {
    
    const debug = await axios.get("https://graph.facebook.com/debug_token", {
      params: {
        input_token: userAccessToken,
        access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`
      },
    });
    console.log("🔎 debug_token:", debug.data);
  } catch (e) {
    console.error("❌ debug_token error:", e.response?.data || e.message);
  }

  // 🔎 1) List pages
  let pageResponse;
  try {
    pageResponse = await axios.get("https://graph.facebook.com/v17.0/me/accounts", {
      params: { access_token: userAccessToken },
    });
    console.log(">>> /me/accounts response:", pageResponse.data);
  } catch (err) {
    console.error("❌ /me/accounts error:", err.response?.data || err.message);
    throw new ApiError(500, "Failed to fetch Facebook pages");
  }

  const pages = pageResponse.data?.data;
  if (!pages || pages.length === 0) {
    throw new ApiError(400, "No Facebook pages found for this user.");
  }

  const page = pages[0]; // or select specific one later
  const pageAccessToken = page.access_token;
  const pageId = page.id;

  // Step 2: Upload media to page
  const postResponse = await axios.post(`https://graph.facebook.com/v17.0/${pageId}/photos`, null, {
    params: {
      url: mediaUrl,
      caption: message,
      access_token: pageAccessToken,
    },
  });

  return {
    pageId,
    postId: postResponse.data?.post_id,
    success: true,
  };
};
