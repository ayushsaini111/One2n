import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import "./config/passport.js"; // import before using passport

const app = express();

app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        credentials:true,
    })
)

app.use(passport.initialize());
app.use(express.json({limit:"50kb"}));
app.use(express.urlencoded({limit:"50kb", extended:true}));
app.use(cookieParser());
app.use(express.static("public"));

import authRoutes from "./routes/auth.routes.js";
app.use("/api/v2/auth", authRoutes);

import userRoutes from "./routes/user.routes.js";
app.use("/api/v2/users", userRoutes);

import linkedinRoutes from "./routes/linkedin.routes.js";
app.use("/api/v2/auth", linkedinRoutes);



export {app};