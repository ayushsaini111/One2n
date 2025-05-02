import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signupSchema, loginSchema ,verifyCodeSchema} from "../validators/auth.validator.js";
import { generateAccessAndRefreshToken } from "../utils/token.js";
import { sendOTPEmail,generateOTP } from "../controllers/auth.controller.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { tempSignupUsers,tempLoginUsers } from "../utils/tempUsers.js";
import { generateAndSendToken } from "../utils/authTokens.js";

const generateUniqueUsername = async (firstName, lastName) => {
    let username = `${firstName}${lastName}`;

    // Check if the username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        // If the username exists, append a unique suffix (e.g., a random number or string)
        const randomSuffix = Math.floor(Math.random() * 1000);
        username = `${firstName}${lastName}${randomSuffix}`;
    }

    return username;
};


const sendSignupCodeController = asyncHandler(async (req, res) => {
    try {
        const parsedData = signupSchema.safeParse(req.body);
        if (!parsedData.success) {
            throw new ApiError(400, "Invalid input", parsedData.error.errors);
        }

        const { firstName, lastName, email, password } = parsedData.data;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError(409, "User already exists with this email");
        }

        const verificationCode = generateOTP();
        const verificationHash = await bcrypt.hash(verificationCode, 10);
        const codeExpiry = Date.now() + 10 * 60 * 1000;

        
        tempSignupUsers.set(email, {
            firstName,
            lastName,
            email,
            password,
            verificationHash,
            codeExpiry,
        });

        await sendOTPEmail(email, verificationCode);

        return res.status(200).json(new ApiResponse(200, { email }, "Verification code sent to email"));
    } catch (error) {
        return res.status(error.status || 500).json(new ApiResponse(error.status || 500, null, error.message));
    }
});

const verifySignupCodeAndCreateUser = asyncHandler(async (req, res) => {
    console.log(req.body);
    const parsedData = verifyCodeSchema.safeParse(req.body);
    console.log("parsedData", parsedData);
    if (!parsedData.success) {
        throw new ApiError(400, "Invalid input", parsedData.error.errors);
    }

    const { code, email } = parsedData.data;
    const tempData = tempSignupUsers.get(email);

    if (!tempData) {
        throw new ApiError(400, "No signup request found for this email");
    }

    const { firstName, lastName, password, verificationHash, codeExpiry } = tempData;

    if (Date.now() > codeExpiry) {
        tempSignupUsers.delete(email);
        throw new ApiError(400, "Verification code expired");
    }

    const isValid = await bcrypt.compare(code, verificationHash);
    if (!isValid) {
        throw new ApiError(400, "Invalid verification code");
    }

    const username = await generateUniqueUsername(firstName, lastName);

    const newUser = await User.create({
        firstName,
        lastName,
        username,
        email,
        password,
        authProvider: "local",
        isVerified: true,
    });

    tempSignupUsers.delete(email); // clear after use

    // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(newUser._id);
    const response = await generateAndSendToken(newUser, res, "Registration successful");

    const options = { httpOnly: true, secure: true, sameSite: "None" };

    return res
        .status(201)
        .json(response)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", refreshToken, options)
//         .json(new ApiResponse(201, { user: newUser, accessToken, refreshToken }, "User registered successfully"));
});

const sendLoginCodeController = asyncHandler(async (req, res) => {
    try {
        const parsedData = loginSchema.safeParse(req.body);
        if (!parsedData.success) {
            throw new ApiError(400, "Invalid input", parsedData.error.errors);
        }

        const { email, password } = parsedData.data;

        const user = await User.findOne({ email, authProvider: "local" });
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid credentials");
        }

        // Generate a verification code (OTP)
        const verificationCode = generateOTP();
        const verificationHash = await bcrypt.hash(verificationCode, 10);
        const codeExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

        // Store temporary login data in tempLoginUsers map
        tempLoginUsers.set(email, {
            verificationCode: verificationHash,
            codeExpiry,
            userId: user._id,
        });

        // Send OTP email to the user
        try {
            await sendOTPEmail(email, verificationCode);
        } catch (error) {
            console.error("Error sending OTP email:", error);
            throw new ApiError(500, "Failed to send verification code to email");
        }

        return res.status(200).json(new ApiResponse(200, { email }, "Verification code sent to email"));
    } catch (error) {
        return res.status(error.status || 500).json(new ApiResponse(error.status || 500, null, error.message));
    }
});

const verifyLoginCodeAndLoginUser = asyncHandler(async (req, res) => {
    const parsedData = verifyCodeSchema.safeParse(req.body);
    if (!parsedData.success) {
        throw new ApiError(400, "Invalid input", parsedData.error.errors);
    }

    const { code, email } = parsedData.data;

    // Retrieve temporary login data for the provided email
    const tempData = tempLoginUsers.get(email);
    if (!tempData) {
        throw new ApiError(400, "No login attempt found for this email");
    }

    const { verificationCode, codeExpiry, userId } = tempData;

    // Check if the OTP has expired
    if (Date.now() > codeExpiry) {
        tempLoginUsers.delete(email); // Remove expired data
        throw new ApiError(400, "Verification code expired");
    }

    // Compare the code entered by the user with the stored verification code
    const isValid = await bcrypt.compare(code, verificationCode);
    if (!isValid) {
        throw new ApiError(400, "Invalid verification code");
    }

    // Proceed to log the user in
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Generate JWT tokens (access and refresh)
    // const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
    const response = await generateAndSendToken(user, res, "Login successful");

    // Optionally, save refreshToken in the user's document (if needed for session management)
    // user.refreshToken = refreshToken;
    await user.save();

    const options = { httpOnly: true, secure: true, sameSite: "None" };

    // Send response with cookies
    return res
        .status(200)
        .json(response)
        // .cookie("accessToken", accessToken, options)
        // .cookie("refreshToken", refreshToken, options)
        // .json(new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful"));
});



// const sendSignupCodeController = asyncHandler(async (req, res) => {
//     try {
//         const parsedData = signupSchema.safeParse(req.body);
//         if (!parsedData.success) {
//             throw new ApiError(400, "Invalid input", parsedData.error.errors);
//         }

//         const { firstName, lastName, email, password } = parsedData.data;

//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             throw new ApiError(409, "User already exists with this email");
//         }

//         const verificationCode = generateOTP();
//         const verificationHash = await bcrypt.hash(verificationCode, 10);
//         const codeExpiry = Date.now() + 10 * 60 * 1000;

//         const tempToken = jwt.sign(
//             {
//                 firstName,
//                 lastName,
//                 email,
//                 password,
//                 verificationHash,
//                 codeExpiry,
//             },
//             process.env.TEMP_JWT_SECRET,
//             { expiresIn: "10m" }
//         );
//         if (!tempToken) {
//             throw new ApiError(500, "Failed to generate verification token");
            
//         }
//         try {
//             await sendOTPEmail(email, verificationCode);
            
//         } catch (error) {
//             console.error("Error sending OTP email:", error);
//             throw new ApiError(500, "Failed to send verification code to email");
//         }
            
        

//         return res.status(200).json(new ApiResponse(200, { tempToken }, "Verification code sent to email"));
//     } catch (error) {
//         return res.status(error.status || 500).json(new ApiResponse(error.status || 500, null, error.message));
//     }
// });


// const verifySignupCodeAndCreateUser = asyncHandler(async (req, res) => {
//     const parsedData = verifyCodeSchema.safeParse(req.body);
//     if (!parsedData.success) {
//         throw new ApiError(400, "Invalid input", parsedData.error.errors);
//     }

//     const { code, tempToken } = parsedData.data;
//     if (!code || !tempToken) {

//         throw new ApiError(400, "Code and tempToken are required");
//     }

//     let payload;
//     try {
//         payload = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
//     } catch {
//         throw new ApiError(400, "Invalid or expired verification token");
//     }

//     const { firstName, lastName, email, password, verificationHash, codeExpiry } = payload;

//     if (Date.now() > codeExpiry) {
//         throw new ApiError(400, "Verification code expired");
//     }

//     const isValid = await bcrypt.compare(code, verificationHash);
//     if (!isValid) {
//         throw new ApiError(400, "Invalid verification code");
//     }

//     const username = generateUniqueUsername(firstName, lastName);

//     const newUser = await User.create({
//         firstName,
//         lastName,
//         username,
//         email,
//         password,
//         authProvider: "local",
//         isVerified: true,
//     });

//     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(newUser._id);

//     const options = { httpOnly: true, secure: true, sameSite: "None" };

//     return res
//         .status(201)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", refreshToken, options)
//         .json(new ApiResponse(201, { user: newUser, accessToken, refreshToken }, "User registered successfully"));
// });


// const sendLoginCodeController = asyncHandler(async (req, res) => {
//     try {
//         const parsedData = loginSchema.safeParse(req.body);
//         if (!parsedData.success) {
//             throw new ApiError(400, "Invalid input", parsedData.error.errors);
//         }

//         const { email, password } = parsedData.data;

//         const user = await User.findOne({ email, authProvider: "local" });
//         if (!user) {
//             throw new ApiError(404, "User not found");
//         }

//         const isPasswordValid = await user.isPasswordCorrect(password);
//         if (!isPasswordValid) {
//             throw new ApiError(401, "Invalid credentials");
//         }

//         const verificationCode = generateOTP();
//         const verificationHash = await bcrypt.hash(verificationCode, 10);
//         const codeExpiry = Date.now() + 10 * 60 * 1000;

//         const tempToken = jwt.sign(
//             {
//                 userId: user._id,
//                 verificationHash,
//                 codeExpiry,
//             },
//             process.env.TEMP_JWT_SECRET,
//             { expiresIn: "10m" }
//         );

//         await sendOTPEmail(email, verificationCode);

//         return res.status(200).json(new ApiResponse(200, { tempToken }, "Verification code sent to email"));
//     } catch (error) {
//         return res.status(error.status || 500).json(new ApiResponse(error.status || 500, null, error.message));
//     }
// });

// const verifyLoginCodeAndLoginUser = asyncHandler(async (req, res) => {
//     const parsedData = verifyCodeSchema.safeParse(req.body);
//     if (!parsedData.success) {
//         throw new ApiError(400, "Invalid input", parsedData.error.errors);
//     }

//     const { code, tempToken } = parsedData.data;

//     let payload;
//     try {
//         payload = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);
//     } catch {
//         throw new ApiError(400, "Invalid or expired token");
//     }

//     const { userId, verificationHash, codeExpiry } = payload;

//     if (Date.now() > codeExpiry) {
//         throw new ApiError(400, "Verification code expired");
//     }

//     const isMatch = await bcrypt.compare(code, verificationHash);
//     if (!isMatch) {
//         throw new ApiError(400, "Invalid verification code");
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//         throw new ApiError(404, "User not found");
//     }

//     const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
//     user.refreshToken = refreshToken;
//     await user.save();

//     const options = { httpOnly: true, secure: true, sameSite: "None" };

//     return res
//         .status(200)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", refreshToken, options)
//         .json(new ApiResponse(200, { user, accessToken, refreshToken }, "Login successful"));
// });




const logoutUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1, // This removes the refreshToken field
        },
      },
      { new: true }
    );
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User logged out"));
  });
  
  
// const refreshAccessToken=asyncHandler(async(req,res)=>{

//     const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
//     console.log("incomingRefreshToken",incomingRefreshToken);
//     if (!incomingRefreshToken) {
//         throw new ApiError(401,"Unauthorised request")
//     }
    
//     try {
//         const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
//         console.log("decodedToken",decodedToken);
//         const user =await User.findById(decodedToken?._id)
        
//         if(!user){     
//             throw new ApiError(401,"Invalid refresh token")
//         }
    
//         if (incomingRefreshToken !==user?.refreshToken) {
//             throw new ApiError(401,"Refresh token is rxpired or used")
//         }
    
//         const options ={
//             http:true,
//             secure:true
//         }
    
//         const {accessToken,newRefreshToken}=await gernerateAccessAndRefreshTokens(user.id)
    
//         return res 
//         .status(200)
//         .cookie("accessToken",accessToken,options)
//         .cookie("refreshToken",newRefreshToken,options)
//         .json(
//             new ApiResponse(
//                 200,
//                 {accessToken,refreshToken:newRefreshToken},
//                 "Access token refreshed"
//             )
//         )
//     } catch (error) {
//         throw new ApiError(401,"Invalid refresh token")
        
//     }

// })


 const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id);

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token iiiis expired or already used");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken,data:user }, "Access token refreshed"));
});


export { 
    sendSignupCodeController,
    verifySignupCodeAndCreateUser,
    sendLoginCodeController,
    verifyLoginCodeAndLoginUser,
    generateUniqueUsername,
    logoutUser,
    refreshAccessToken,
};