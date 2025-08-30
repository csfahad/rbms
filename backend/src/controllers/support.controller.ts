import { Request, Response } from "express";
import { pool } from "../config/db";
import { z } from "zod";

const supportMessageSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

const adminResponseSchema = z.object({
    messageId: z.string().uuid("Invalid message ID"),
    response: z.string().min(10, "Response must be at least 10 characters"),
});

export const submitSupportMessage = async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = supportMessageSchema.parse(
            req.body
        );

        const userId = req.user?.userId || null;

        const result = await pool.query(
            `INSERT INTO support_messages (user_id, name, email, subject, message) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, created_at`,
            [userId, name, email, subject, message]
        );

        const supportMessage = result.rows[0];

        try {
            console.log("Support message submitted:", {
                messageId: supportMessage.id,
                name,
                email,
                subject,
            });
        } catch (emailError) {
            console.error(
                "Failed to send admin notification email:",
                emailError
            );
        }

        res.status(201).json({
            message: "Support message submitted successfully",
            messageId: supportMessage.id,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: error.errors[0].message,
            });
        }

        console.error("Error submitting support message:", error);
        res.status(500).json({
            message: "Failed to submit support message",
        });
    }
};

export const getSupportMessages = async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin privileges required.",
            });
        }

        const { status, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // build query based on status filter
        let mainQuery: string;
        let countQuery: string;
        let queryParams: any[];
        let countParams: any[];

        if (status && status !== "all") {
            // query with status filter
            mainQuery = `
                SELECT 
                    sm.*,
                    u.name as user_name,
                    admin.name as admin_name
                FROM support_messages sm
                LEFT JOIN users u ON sm.user_id = u.id
                LEFT JOIN users admin ON sm.responded_by = admin.id
                WHERE sm.status = $1
                ORDER BY sm.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            queryParams = [status, Number(limit), offset];

            countQuery = `
                SELECT COUNT(*) as total 
                FROM support_messages 
                WHERE status = $1
            `;
            countParams = [status];
        } else {
            // query without status filter
            mainQuery = `
                SELECT 
                    sm.*,
                    u.name as user_name,
                    admin.name as admin_name
                FROM support_messages sm
                LEFT JOIN users u ON sm.user_id = u.id
                LEFT JOIN users admin ON sm.responded_by = admin.id
                ORDER BY sm.created_at DESC
                LIMIT $1 OFFSET $2
            `;
            queryParams = [Number(limit), offset];

            countQuery = `
                SELECT COUNT(*) as total 
                FROM support_messages
            `;
            countParams = [];
        }

        const result = await pool.query(mainQuery, queryParams);
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            messages: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error("Error fetching support messages:", error);
        res.status(500).json({
            message: "Failed to fetch support messages",
        });
    }
};

export const respondToSupportMessage = async (req: Request, res: Response) => {
    try {
        // only admin can respond to support messages
        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin privileges required.",
            });
        }

        const { messageId, response } = adminResponseSchema.parse(req.body);
        const adminId = req.user.userId;

        // check if message exists
        const messageResult = await pool.query(
            `SELECT id, email, name, subject FROM support_messages WHERE id = $1`,
            [messageId]
        );

        if (messageResult.rowCount === 0) {
            return res.status(404).json({
                message: "Support message not found",
            });
        }

        const message = messageResult.rows[0];

        // update the message with admin response
        await pool.query(
            `UPDATE support_messages 
             SET admin_response = $1, 
                 responded_by = $2, 
                 responded_at = NOW(), 
                 status = 'responded' 
             WHERE id = $3`,
            [response, adminId, messageId]
        );

        try {
            console.log("Admin response sent:", {
                userEmail: message.email,
                userName: message.name,
                originalSubject: message.subject,
                adminResponse: response,
            });
        } catch (emailError) {
            console.error("Failed to send response email to user:", emailError);
        }

        res.json({
            message: "Response sent successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: error.errors[0].message,
            });
        }

        console.error("Error responding to support message:", error);
        res.status(500).json({
            message: "Failed to respond to support message",
        });
    }
};

export const getSupportMessageById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (req.user?.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin privileges required.",
            });
        }

        const result = await pool.query(
            `SELECT 
                sm.*,
                u.name as user_name,
                admin.name as admin_name
             FROM support_messages sm
             LEFT JOIN users u ON sm.user_id = u.id
             LEFT JOIN users admin ON sm.responded_by = admin.id
             WHERE sm.id = $1`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Support message not found",
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching support message:", error);
        res.status(500).json({
            message: "Failed to fetch support message",
        });
    }
};

export const getUserSupportMessages = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Authentication required",
            });
        }

        // get user email to also match messages submitted with the same email but no user_id
        const userResult = await pool.query(
            "SELECT email FROM users WHERE id = $1",
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const userEmail = userResult.rows[0].email;

        const { page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // get user's support messages (both by user_id and email)
        const messagesQuery = `
            SELECT 
                sm.*,
                admin.name as admin_name
            FROM support_messages sm
            LEFT JOIN users admin ON sm.responded_by = admin.id
            WHERE sm.user_id = $1 OR sm.email = $2
            ORDER BY sm.created_at DESC
            LIMIT $3 OFFSET $4
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM support_messages 
            WHERE user_id = $1 OR email = $2
        `;

        const result = await pool.query(messagesQuery, [
            userId,
            userEmail,
            Number(limit),
            offset,
        ]);
        const countResult = await pool.query(countQuery, [userId, userEmail]);
        const total = parseInt(countResult.rows[0].total);

        res.json({
            messages: result.rows,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (error) {
        console.error("Error fetching user support messages:", error);
        res.status(500).json({
            message: "Failed to fetch support messages",
        });
    }
};

// Function to be used by email service
export const sendSupportResponseEmail = async (data: {
    userEmail: string;
    userName: string;
    originalSubject: string;
    adminResponse: string;
}) => {
    // this will be implemented in the email service
    console.log("Sending support response email to:", data.userEmail);
};
