import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import trainRoutes from "./routes/train.routes";
import bookingRoutes from "./routes/booking.routes";
import supportRoutes from "./routes/support.routes";
import userRoutes from "./routes/user.routes";
import { authenticateToken } from "./middleware/auth";
import { cleanupExpiredTokens } from "./utils/resetToken";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

// Public routes
app.use("/api/auth", authRoutes);
app.use("/api/support", supportRoutes);

// Protected routes
app.use("/api/trains", trainRoutes);
app.use("/api/bookings", authenticateToken, bookingRoutes);
app.use("/api/users", authenticateToken, userRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);

    // Run cleanup of expired reset tokens every hour
    setInterval(async () => {
        try {
            await cleanupExpiredTokens();
        } catch (error) {
            console.error("Error during token cleanup:", error);
        }
    }, 60 * 60 * 1000); //
});
