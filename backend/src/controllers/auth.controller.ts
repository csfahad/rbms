import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { generateOTP, storeOTP, verifyOTP } from "../utils/otp";
import { sendOTPEmail, sendPasswordResetEmail } from "../services/emailService";
import { isTokenUsed, markTokenAsUsed } from "../utils/resetToken";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(1, "Phone number is required"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
});

const sendOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
});

const verifyOtpSchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
});

export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { email } = sendOtpSchema.parse(req.body);

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return res
                .status(400)
                .json({ message: "User already exists with this email" });
        }

        const otp = generateOTP();
        storeOTP(email, otp);

        await sendOTPEmail(email, otp);

        res.json({ message: "OTP sent to your email" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Failed to send OTP" });
    }
};

export const verifyOtpAndRegister = async (req: Request, res: Response) => {
    try {
        const { email, otp, name, password, phone } = verifyOtpSchema.parse(
            req.body
        );

        const { isValid } = verifyOTP(email, otp);

        if (!isValid) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, phone, role`,
            [name, email, hashedPassword, phone]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/", // ensure cookie is available across all paths
        });

        res.status(201).json({ user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Registration failed" });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = registerSchema.parse(req.body);

        const existingUser: any = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             RETURNING id, name, email, role`,
            [name, email, hashedPassword]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/", // ensure cookie is available across all paths
        });

        res.status(201).json({ user });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const result = await pool.query(
            `SELECT id, name, email, password_hash, role
             FROM users
             WHERE email = $1`,
            [email]
        );

        if (!result.rowCount || result.rowCount === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000,
            path: "/", // ensure cookie is available across all paths
        });

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

const updateProfileSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    phone: z.string().min(1, "Phone number is required"),
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters"),
});

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { name, phone } = updateProfileSchema.parse(req.body);

        const result = await pool.query(
            `UPDATE users SET name = $1, phone = $2 WHERE id = $3 
             RETURNING id, name, email, phone, role`,
            [name, phone, userId]
        );

        if (!result.rowCount || result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: result.rows[0],
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { currentPassword, newPassword } = changePasswordSchema.parse(
            req.body
        );

        // get current user with password hash
        const userResult = await pool.query(
            `SELECT id, password_hash FROM users WHERE id = $1`,
            [userId]
        );

        if (!userResult.rowCount || userResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];

        const validPassword = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );

        if (!validPassword) {
            return res
                .status(400)
                .json({ message: "Current password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
            hashedNewPassword,
            userId,
        ]);

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const result = await pool.query(
            `SELECT id, name, email, phone, role FROM users WHERE id = $1`,
            [userId]
        );

        if (!result.rowCount || result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        const result = await pool.query(
            `SELECT id, email FROM users WHERE email = $1`,
            [email]
        );

        if (!result.rowCount || result.rowCount === 0) {
            return res
                .status(404)
                .json({ message: "User with this email does not exist" });
        }

        const user = result.rows[0];

        // Generate a reset token (JWT with 1 hour expiry)
        const resetToken = jwt.sign(
            { userId: user.id, email: user.email, type: "password-reset" },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1h" }
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail(email, resetLink);

        res.json({ message: "Password reset link sent to your email" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Failed to send password reset link" });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);

        // check if token has already been used
        const tokenAlreadyUsed = await isTokenUsed(token);
        if (tokenAlreadyUsed) {
            return res.status(400).json({
                message:
                    "This reset link has already been used. Please request a new password reset link.",
            });
        }

        // verify the reset token
        let decoded;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "your-secret-key"
            ) as any;

            // check if it's a password reset token
            if (decoded.type !== "password-reset") {
                return res.status(400).json({ message: "Invalid reset token" });
            }
        } catch (error) {
            return res
                .status(400)
                .json({ message: "Invalid or expired reset token" });
        }

        const userResult = await pool.query(
            `SELECT id FROM users WHERE id = $1 AND email = $2`,
            [decoded.userId, decoded.email]
        );

        if (!userResult.rowCount || userResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        // mark token as used BEFORE updating password
        try {
            await markTokenAsUsed(token, decoded.userId);
        } catch (error) {
            console.error("Error marking token as used:", error);
            return res.status(500).json({ message: "Password reset failed" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
            hashedPassword,
            decoded.userId,
        ]);

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Password reset failed" });
    }
};

export const verifyResetToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Reset token is required" });
        }

        // check if token has already been used
        const tokenAlreadyUsed = await isTokenUsed(token as string);
        if (tokenAlreadyUsed) {
            return res.status(400).json({
                valid: false,
                message:
                    "This reset link has already been used. Please request a new password reset link.",
            });
        }

        // verify the reset token
        try {
            const decoded = jwt.verify(
                token as string,
                process.env.JWT_SECRET || "your-secret-key"
            ) as any;

            // check if it's a password reset token
            if (decoded.type !== "password-reset") {
                return res.status(400).json({
                    valid: false,
                    message: "Invalid reset token",
                });
            }

            // verify user still exists
            const userResult = await pool.query(
                `SELECT id, email FROM users WHERE id = $1 AND email = $2`,
                [decoded.userId, decoded.email]
            );

            if (!userResult.rowCount || userResult.rowCount === 0) {
                return res.status(404).json({
                    valid: false,
                    message: "User not found",
                });
            }

            res.json({
                valid: true,
                email: decoded.email,
                message: "Reset token is valid",
            });
        } catch (error) {
            return res.status(400).json({
                valid: false,
                message: "Invalid or expired reset token",
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Token verification failed" });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        res.json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Logout failed" });
    }
};
