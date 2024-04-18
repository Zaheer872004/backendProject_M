import express, { Router } from "express";
import {
    changeAvatar, 
    changeCoverImage, 
    changePasswordUser, 
    changeProfileDetails, 
    getCurrentUser, 
    getUserChannelProfile, 
    getWatchHistory, 
    userAccessToken, 
    userLoggedIn, 
    userLogout, 
    userRegister, 
    verifyEmail 
} from "../controllers/user.controller.js";
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

// All User models routes.

router.route("/login").post(userLoggedIn)

router.route("/logout").post(verifyJWT,userLogout)

router.route('/verify').get(verifyEmail)

router.route('/refreshToken').get(verifyJWT,userAccessToken)

router.route('/getCurrentUser').get(verifyJWT,getCurrentUser)

router.route('/changePassword').patch(verifyJWT,changePasswordUser)

router.route('/changeDetails').patch(verifyJWT,changeProfileDetails)

router.route('/changeAvatar').patch(verifyJWT, upload.single("avatar"), changeAvatar)

router.route('/changeCoverImage').patch(verifyJWT, upload.single("coverImage"), changeCoverImage)

router.route('/getChannelDetails/:username').get(verifyJWT,getUserChannelProfile)

router.route('/getWatchHistory').get(verifyJWT,getWatchHistory)


export default router;

