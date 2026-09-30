import { Router } from "express";
import { registerUser } from "../controllers/auth.controller.js";

const registerRouter = Router()

registerRouter.route("/register").post(registerUser)

export default registerRouter