import { Router } from "express";
import { sendSignupCodeController,verifySignupCodeAndCreateUser,sendLoginCodeController,verifyLoginCodeAndLoginUser ,refreshAccessToken,logoutUser} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"; // JWT verification middleware

const router = Router();

router.route("/register").post(sendSignupCodeController);

router.route("/login").post(sendLoginCodeController); 

router.route("/verifySignup-otp").post(verifySignupCodeAndCreateUser);
router.route("/verifyLogin-otp").post(verifyLoginCodeAndLoginUser);

router.route("/refreshtoken").post(refreshAccessToken);  

router.use(verifyJWT); 

router.route("/logout").post(logoutUser);  // Logout user


export default router;
