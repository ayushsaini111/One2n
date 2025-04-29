import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        console.log("req.cookies", req.cookies);
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")
        console.log("token", token);
        // const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODBmYTNhN2UyNDE2N2ZjYWYyYjA0MTgiLCJlbWFpbCI6ImF5dXNoc2Fpbmk4MDA4QGdtYWlsLmNvbSIsIm5hbWUiOiJheXUgc2FpIiwiaWF0IjoxNzQ1ODU1NjgxLCJleHAiOjE3NDU5NDIwODF9.2UCMRcjBGz4CqaSfxv-CqDabArdYCZ4Z2SLeci5ETPs"

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        console.log("decodedToken", decodedToken);

        const user = await User.findById(decodedToken._id).select("-password -refreshToken ")
        console.log("user", user);
        if (!user) {
            throw new ApiError(401, "Unauthorized b bbbbbbbbbbbbbj request")
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access token ||")
    }
})
