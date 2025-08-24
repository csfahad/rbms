import { Router } from "express";
import { updateProfile } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.put("/profile", authenticateToken, updateProfile);

export default router;
