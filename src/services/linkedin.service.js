import axios from "axios";
import { ApiError } from "../utils/ApiError.js";

export const postToLinkedIn = async ({ accessToken, author, message }) => {
  // Build the UGC post payload
  const payload = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: message },
        shareMediaCategory: "NONE"
      }
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
    }
  };

  try {
    const res = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type":  "application/json",
          "X-Restli-Protocol-Version": "2.0.0"
        },
      }
    );
    return { postUrn: res.data.id };
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    throw new ApiError(500, "LinkedIn post failed: " + msg);
  }
};
