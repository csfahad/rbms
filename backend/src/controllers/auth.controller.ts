// import { Request, Response } from 'express';
// import { sql } from '../config/db';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { z } from 'zod';

// const registerSchema = z.object({
//     name: z.string().min(2, 'Name must be at least 2 characters'),
//     email: z.string().email('Invalid email address'),
//     password: z.string().min(6, 'Password must be at least 6 characters'),
// });

// const loginSchema = z.object({
//     email: z.string().email('Invalid email address'),
//     password: z.string(),
// });

// export const register = async (req: Request, res: Response) => {
//     try {
//         const { name, email, password } = registerSchema.parse(req.body);

//         // Check if user exists
//         const existingUser = await sql`
//             SELECT id FROM users WHERE email = ${email}
//         `;

//         if (existingUser.length > 0) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // Create user
//         const [user] = await sql`
//             INSERT INTO users (name, email, password_hash)
//             VALUES (${name}, ${email}, ${hashedPassword})
//             RETURNING id, name, email, role
//         `;

//         // Generate token
//         const token = jwt.sign(
//             { userId: user.id, role: user.role },
//             process.env.JWT_SECRET || 'your-secret-key',
//             { expiresIn: '24h' }
//         );

//         res.status(201).json({
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//             },
//             token,
//         });
//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return res.status(400).json({ message: error.errors[0].message });
//         }
//         console.error('Registration error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// export const login = async (req: Request, res: Response) => {
//     try {
//         const { email, password } = loginSchema.parse(req.body);

//         // Find user
//         const users = await sql`
//             SELECT id, name, email, password_hash, role
//             FROM users
//             WHERE email = ${email}
//         `;

//         if (users.length === 0) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         const user = users[0];

//         // Verify password
//         const validPassword = await bcrypt.compare(password, user.password_hash);
//         if (!validPassword) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         // Generate token
//         const token = jwt.sign(
//             { userId: user.id, role: user.role },
//             process.env.JWT_SECRET || 'your-secret-key',
//             { expiresIn: '24h' }
//         );

//         res.json({
//             user: {
//                 id: user.id,
//                 name: user.name,
//                 email: user.email,
//                 role: user.role,
//             },
//             token,
//         });
//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return res.status(400).json({ message: error.errors[0].message });
//         }
//         console.error('Login error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// export const verifyToken = async (req: Request, res: Response) => {
//     try {
//         const user = await sql`
//             SELECT id, name, email, role
//             FROM users
//             WHERE id = ${req.user!.userId}
//         `;

//         if (user.length === 0) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         res.json({ user: user[0] });
//     } catch (error) {
//         console.error('Token verification error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = registerSchema.parse(req.body);

        const existingUser: any = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rowCount > 0) {
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

        console.error("Registration error:", error);
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

        if (result.rowCount === 0) {
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

        console.error("Login error:", error);
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
            `SELECT id, name, email, role FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
