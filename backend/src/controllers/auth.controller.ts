import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { generateOTP, storeOTP, verifyOTP } from "../utils/otp";
import { sendOTPEmail } from "../services/emailService";

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

        res.status(201).json({ user, token });
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

        res.status(201).json({ user, token });
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

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
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
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 digits"),
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

        const otp = generateOTP();
        storeOTP(email, otp);

        await sendOTPEmail(email, otp, "password-reset");

        res.json({ message: "Password reset OTP sent to your email" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Failed to send password reset OTP" });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

        const isValidOTP = verifyOTP(email, otp);
        if (!isValidOTP) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const userResult = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if (!userResult.rowCount || userResult.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            `UPDATE users SET password_hash = $1 WHERE email = $2`,
            [hashedPassword, email]
        );

        res.json({ message: "Password reset successfully" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.errors[0].message });
        }

        res.status(500).json({ message: "Password reset failed" });
    }
};
