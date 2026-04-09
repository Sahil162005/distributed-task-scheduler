import express  from "express";
import { SignUp } from "../controller/auth.controller.js";
import { Login } from "../controller/auth.controller.js";
import { ValidateSignup } from "../middleware/validationMiddleware.js";
import { ValidateLogin } from "../middleware/validationMiddleware.js";

const router= express.Router();

router.post('/signup',ValidateSignup,SignUp)
// router.post('/signup', (req, res, next) => {
//     console.log("Route hit");
//     next();
// }, ValidateSignup, SignUp)
router.post('/login',ValidateLogin,Login)

export default router;