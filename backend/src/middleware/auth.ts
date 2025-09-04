import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
    userId: string;
    role: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): Response | void => {
    // check for token in Authorization header first
    const authHeader = req.headers["authorization"];
    let token = authHeader && authHeader.split(" ")[1];

    // if no token in header, check cookies (for backward compatibility)
    if (!token) {
        token = req.cookies?.token;
    }

    if (!token) {
        return res.status(401).json({
            message: "Authentication required",
            error: "NO_TOKEN",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your-secret-key"
        ) as TokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid token",
            error: "INVALID_TOKEN",
        });
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};
