import { Router } from "express";
import {
    login,
    register,
    verifyToken,
    sendOtp,
    verifyOtpAndRegister,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyResetToken,
    logout,
} from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtpAndRegister);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);
router.get("/verify", authenticateToken, verifyToken);
router.put("/update-profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);

export default router;
