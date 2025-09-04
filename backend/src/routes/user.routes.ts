import { Router } from "express";
import {
    updateProfile,
    getUsersForReports,
} from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.put("/profile", authenticateToken, updateProfile);
router.get("/reports", authenticateToken, getUsersForReports);

export default router;
