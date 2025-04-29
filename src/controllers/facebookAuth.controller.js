import { getFacebookAccessToken, getUserDataFromFacebook } from '../services/facebook.service.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import { SocialAccount } from '../models/socialAccount.model.js';
import { User } from '../models/user.model.js';



export const facebookCallback = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized, user not found');
  }

  console.log(req.user);

  const { code } = req.query;
  const { _id } = req.user;

  if (!code) {
    throw new ApiError(400, 'Authorization code missing');
  }

  const accessToken = await getFacebookAccessToken(code);
  const userData = await getUserDataFromFacebook(accessToken);
  console.log("fb data", userData);

  if (!userData?.id) {
    throw new ApiError(400, "Failed to fetch user data from Facebook");
  }

  let existingAccount = await SocialAccount.findOne({
    user: _id,
    platform: 'facebook',
    platformUserId: userData.id,
  });

  if (existingAccount) {
    existingAccount.accessToken = accessToken;
    await existingAccount.save();
  } else {
    existingAccount = await SocialAccount.create({
      user: _id,                          // 👈 Always safe _id
      platform: 'facebook',
      accessToken,
      platformUserId: userData.id,
    });

    await User.findByIdAndUpdate(_id, {
      $push: { socialAccounts: existingAccount._id },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user: userData, accessToken }, 'Successfully authenticated and saved Facebook account'));
});

