import express from "express";
import { facebookCallback } from "../controllers/facebookAuth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // JWT verification middleware

const router = express.Router();

router.route("/facebook/callback").get(verifyJWT,facebookCallback);
