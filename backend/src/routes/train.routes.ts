import { Router } from "express";
import {
    createTrain,
    updateTrain,
    deleteTrain,
    getTrainById,
    searchTrains,
    searchTrainsByStoppage,
    getStations,
    getAllTrains,
} from "../controllers/train.controller";
import { authenticateToken, isAdmin } from "../middleware/auth";

const router = Router();

// Public routes
router.get("/search", searchTrains);
router.get("/search-by-stoppage", searchTrainsByStoppage);
router.get("/stations", getStations);
router.get("/:id", getTrainById);

// Protected admin routes
router.get("/", authenticateToken, isAdmin, getAllTrains);
router.post("/", authenticateToken, isAdmin, createTrain);
router.put("/:id", authenticateToken, isAdmin, updateTrain);
router.delete("/:id", authenticateToken, isAdmin, deleteTrain);

export default router;
