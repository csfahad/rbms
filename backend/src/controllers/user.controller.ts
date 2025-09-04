import { Request, Response } from "express";
import { pool } from "../config/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional(),
});

export const updateProfile = async (req: Request, res: Response) => {
    const client = await pool.connect();
    try {
        const userId = req.user!.userId;
        const data = updateProfileSchema.parse(req.body);

        await client.query("BEGIN");

        // handle password change
        if (data.currentPassword && data.newPassword) {
            const {
                rows: [user],
            } = await client.query(
                "SELECT password_hash FROM users WHERE id = $1",
                [userId]
            );

            if (!user) {
                throw new Error("User not found");
            }

            const validPassword = await bcrypt.compare(
                data.currentPassword,
                user.password_hash
            );

            if (!validPassword) {
                throw new Error("Current password is incorrect");
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.newPassword, salt);

            await client.query(
                "UPDATE users SET password_hash = $1 WHERE id = $2",
                [hashedPassword, userId]
            );
        }

        // update profile info
        const {
            rows: [updatedUser],
        } = await client.query(
            `UPDATE users
             SET name = $1, email = $2, phone = $3
             WHERE id = $4
             RETURNING id, name, email, phone, role`,
            [data.name, data.email, data.phone || null, userId]
        );

        await client.query("COMMIT");
        res.json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    } finally {
        client.release();
    }
};

export const getUsersForReports = async (req: Request, res: Response) => {
    try {
        // get all users with their registration dates and booking activity
        const { rows: users } = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.created_at as registration_date,
                COUNT(DISTINCT b.id)::integer as total_bookings,
                COUNT(DISTINCT DATE(b.booking_date))::integer as active_days
            FROM users u
            LEFT JOIN bookings b ON u.id = b.user_id
            GROUP BY u.id, u.name, u.email, u.created_at
            ORDER BY u.created_at DESC
        `);

        // get daily user activity (new registrations and active users)
        const { rows: dailyActivity } = await pool.query(`
            WITH date_series AS (
                SELECT generate_series(
                    CURRENT_DATE - INTERVAL '30 days',
                    CURRENT_DATE,
                    '1 day'::interval
                )::date AS date
            ),
            daily_registrations AS (
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*)::integer as new_registrations
                FROM users 
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
            ),
            daily_active_users AS (
                SELECT 
                    DATE(booking_date) as date,
                    COUNT(DISTINCT user_id)::integer as active_users
                FROM bookings 
                WHERE booking_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(booking_date)
            )
            SELECT 
                ds.date,
                COALESCE(dr.new_registrations, 0)::integer as new_registrations,
                COALESCE(dau.active_users, 0)::integer as active_users,
                (SELECT COUNT(*)::integer FROM bookings b WHERE DATE(b.booking_date) = ds.date) as total_bookings
            FROM date_series ds
            LEFT JOIN daily_registrations dr ON ds.date = dr.date
            LEFT JOIN daily_active_users dau ON ds.date = dau.date
            ORDER BY ds.date
        `);

        // check for recent activity
        const recentActivity = dailyActivity.filter(
            (day) =>
                day.new_registrations > 0 ||
                day.active_users > 0 ||
                day.total_bookings > 0
        );

        res.json({
            users,
            dailyActivity,
            recentActivityExists: recentActivity.length > 0,
        });
    } catch (error) {
        console.error("Get users for reports error:", error);
        res.status(500).json({ message: "Failed to fetch user data" });
    }
};
