// utils/authTokens.js
import { ApiResponse } from "./ApiResponse.js";

export const generateAndSendToken = async (user, res, message = "Authentication successful") => {
  // 1️⃣ Generate both tokens
  const accessToken  = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  // 2️⃣ Persist the refreshToken on the user document
  user.refreshToken = refreshToken;
  await user.save();

  // 3️⃣ Cookie options
  const cookieOpts = {
    httpOnly: true,
    secure:   true,
  };

  // 4️⃣ Set cookies
  res
    .cookie("accessToken",  accessToken,  cookieOpts)
    .cookie("refreshToken", refreshToken, cookieOpts);

  // 5️⃣ Return ApiResponse for controller to send
  return new ApiResponse(
    200,
    { user,
      accessToken,
      refreshToken
    },
    message
  );
};
