import express  from "express";
import { SignUp, Login, Logout } from "../controller/auth.controller.js";
import { ValidateSignup } from "../middleware/validationMiddleware.js";
import { ValidateLogin } from "../middleware/validationMiddleware.js";

const router= express.Router();

router.post('/signup',ValidateSignup,SignUp)
router.post('/login',ValidateLogin,Login)
router.post('/logout',Logout)

export default router;