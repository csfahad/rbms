import express from "express";
import {
    submitSupportMessage,
    getSupportMessages,
    respondToSupportMessage,
    getSupportMessageById,
    getUserSupportMessages,
} from "../controllers/support.controller";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Public route - anyone can submit a support message
router.post("/submit", submitSupportMessage);

// User route
router.get("/my-messages", authenticateToken, getUserSupportMessages);

// Admin only routes
router.get("/", authenticateToken, getSupportMessages);
router.get("/:id", authenticateToken, getSupportMessageById);
router.post("/respond", authenticateToken, respondToSupportMessage);

export default router;
