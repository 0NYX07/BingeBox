import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { upload } from "../middlewares/upload.middleware.js"

const registerRouter = Router()

registerRouter.route("/register").post(
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

export default registerRouter