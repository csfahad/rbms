import { Router } from "express";
import {
    login,
    register,
    verifyToken,
    sendOtp,
    verifyOtpAndRegister,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndRegister);
router.get("/verify", authenticateToken, verifyToken);

export default router;
