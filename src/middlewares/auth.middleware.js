import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        // console.log("req.cookies", req.cookies);
        // const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")
        // console.log("token", token);
        const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODEzM2FhMjE3ZDAwNDk0NDMzMzU5NmIiLCJlbWFpbCI6ImF5dXNoc2Fpbmk4MDA4QGdtYWlsLmNvbSIsIm5hbWUiOiJheXV1IHNoc2FpIiwiaWF0IjoxNzQ2MDkzNzcyLCJleHAiOjE3NDYyNjY1NzJ9.sWVatlwzIk4ZH0phPSzSx-nE3CS9FU62NU9uPS94xPo"
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
