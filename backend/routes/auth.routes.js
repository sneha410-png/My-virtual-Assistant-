import express from "express"
import {signUp,Login, logOut} from "../controllers/auth.controller.js"
const authRouter=express.Router()


authRouter.post("/signup",signUp)
authRouter.post("/signin",Login)
authRouter.get("/logout",logOut)
export default authRouter