import express from "express";
import passport from "passport";
import { sendAuthToken ,googleLogout} from "../controllers/auth.controller.js";
import  {verifyJWT} from "../middlewares/auth.middleware.js"


const router = express.Router();

router.get("/google",
    passport.authenticate("google",{ scope: ["profile", "email"] }));

router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),sendAuthToken);

// router.use(verifyJWT);
router.get('/google/logout',googleLogout);




export default router






