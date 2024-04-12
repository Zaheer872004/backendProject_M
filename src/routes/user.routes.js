import { Router } from "express";
import { userAccessToken, userLoggedIn, userLogout, userRegister, verifyEmail } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/register").post(   
    upload.fields([
        {
            name : "avatar",
            maxCount:1
        },
        {
            name : "coverImage",
            maxCount :1
        }
    ]),
    userRegister
    )

router.route("/login").post(userLoggedIn)

router.route("/logout").post(verifyJWT,userLogout)

router.route('/verify').get(verifyEmail)

router.route('/refreshToken').get(verifyJWT,userAccessToken)

export default router;

