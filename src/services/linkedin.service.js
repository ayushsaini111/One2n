// services/linkedin.service.js
import axios from 'axios';

export const getLinkedInAccessToken = async ({ code, redirectUri, clientId, clientSecret }) => {
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const data = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
console.log(data);
  const response = await axios.post(tokenUrl, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data;
};

export const getLinkedInProfile = async (accessToken) => {
  const response = await axios.get('https://api.linkedin.com/v2/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
};

export const postToLinkedIn = async ({ accessToken, content, linkedinId }) => {
  const postUrl = 'https://api.linkedin.com/v2/ugcPosts';

  const postData = {
    author: `urn:li:person:${linkedinId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content },
        shareMediaCategory: 'ARTICLE',
        media: [],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const response = await axios.post(postUrl, postData, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
    },
  });

  return response.data;
};
