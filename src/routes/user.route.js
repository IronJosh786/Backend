import { Router } from "express";
import {
    changePassword,
    getUser,
    getUserChannelProfile,
    loginUser,
    logoutUser,
    regenerateToken,
    registerUser,
    updateUserAvatar,
    updateUserCover,
    updateUserDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// upload field is from multer to inject files into the post request

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(regenerateToken);
router.route("/current-user").get(verifyJWT, getUser);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/update-profile").patch(verifyJWT, updateUserDetails);
router
    .route("/update-avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
    .route("/update-cover")
    .patch(verifyJWT, upload.single("coverImage"), updateUserAvatar);
router.route("/get-channel/:username").get(verifyJWT, getUserChannelProfile);
export default router;
