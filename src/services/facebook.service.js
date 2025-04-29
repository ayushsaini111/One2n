import axios from 'axios';

export const getFacebookAccessToken = async (code) => {
    try {
      const url = 'https://graph.facebook.com/v18.0/oauth/access_token'; // 🔥 Update v18
      const params = {
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: process.env.FACEBOOK_REDIRECT_URI,
        code,
      };
  
      const response = await axios.get(url, { params });
      console.log("fb response",response.data);
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Facebook access token:', error.response?.data || error.message);
      throw error;
    }
  };
  


  export const getUserDataFromFacebook = async (accessToken) => {
    const url = 'https://graph.facebook.com/me';
    const params = {
      access_token: accessToken,
      fields: 'id,name,email,picture,first_name,last_name,birthday,gender,location,link'

    };
  
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user data from Facebook:', error.response?.data || error.message);
      throw error;
    }
  };
  
