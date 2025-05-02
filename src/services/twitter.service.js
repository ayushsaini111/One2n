// services/twitter.service.js

import axios from "axios";
import qs from "querystring";
import { SocialAccount } from "../models/socialAccount.model.js"; // Adjust if necessary
import { ApiError } from "../utils/ApiError.js";

// Define the Twitter base URL
const TWITTER_BASE = "https://twitter.com";

export const twitterLoginService = async () => {
  const query = qs.stringify({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: process.env.TWITTER_REDIRECT_URI,
    client_secret: process.env.TWITTER_CLIENT_SECRET,

    scope: "tweet.read tweet.write users.read offline.access",
    state: "your_state", // random string
    code_challenge: "challenge", // use PKCE lib to generate
    code_challenge_method: "plain", // use 'S256' ideally
  });

  return `${TWITTER_BASE}/i/oauth2/authorize?${query}`;
};

export const twitterCallbackService = async (code) => {
  const tokenRes = await axios.post(
    `https://api.twitter.com/2/oauth2/token`,
    qs.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.TWITTER_REDIRECT_URI,
      client_id: process.env.TWITTER_CLIENT_ID,
      client_secret: process.env.TWITTER_CLIENT_SECRET,
      code_verifier: "challenge",
    }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  return tokenRes.data;
};

export const postToTwitterService = async (tweet, accessToken) => {
  const postRes = await axios.post(
    "https://api.twitter.com/2/tweets",
    { text: tweet },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  return postRes.data;
};
