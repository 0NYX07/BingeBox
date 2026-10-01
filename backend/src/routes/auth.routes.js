import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/upload.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const authRouter = Router()

authRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

authRouter.route("/login").post(loginUser)

authRouter.route("/logout").post(verifyJWT, logoutUser)

export default authRouter