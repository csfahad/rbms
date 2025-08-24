import { Router } from "express";
import {
    createBooking,
    getBookingById,
    getUserBookings,
    getAllBookings,
    cancelBooking,
    generateBookingReport,
} from "../controllers/booking.controller";
import { authenticateToken, isAdmin } from "../middleware/auth";

const router = Router();

// Protected routes
router.post("/", authenticateToken, createBooking);
router.get("/user/:userId", authenticateToken, getUserBookings);
router.get("/:id", authenticateToken, getBookingById);
router.put("/:id/cancel", authenticateToken, cancelBooking);

// Admin routes
router.get("/", authenticateToken, isAdmin, getAllBookings);
router.get("/report", authenticateToken, isAdmin, generateBookingReport);

export default router;
