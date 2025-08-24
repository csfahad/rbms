// import { Request, Response } from "express";
// import { sql } from "../config/db";
// import bcrypt from "bcryptjs";
// import { z } from "zod";

// const updateProfileSchema = z.object({
//     name: z.string().min(2, "Name must be at least 2 characters"),
//     email: z.string().email("Invalid email address"),
//     phone: z.string().optional(),
//     currentPassword: z.string().optional(),
//     newPassword: z
//         .string()
//         .min(6, "Password must be at least 6 characters")
//         .optional(),
// });

// export const updateProfile = async (req: Request, res: Response) => {
//     try {
//         const userId = req.user!.userId;
//         const data = updateProfileSchema.parse(req.body);

//         // Start transaction
//         await sql.begin(async (sql) => {
//             // If password change is requested
//             if (data.currentPassword && data.newPassword) {
//                 const [user] = await sql`
//                     SELECT password_hash FROM users WHERE id = ${userId}
//                 `;

//                 const validPassword = await bcrypt.compare(
//                     data.currentPassword,
//                     user.password_hash
//                 );

//                 if (!validPassword) {
//                     throw new Error("Current password is incorrect");
//                 }

//                 const salt = await bcrypt.genSalt(10);
//                 const hashedPassword = await bcrypt.hash(
//                     data.newPassword,
//                     salt
//                 );

//                 await sql`
//                     UPDATE users
//                     SET password_hash = ${hashedPassword}
//                     WHERE id = ${userId}
//                 `;
//             }

//             // Update other profile information
//             const [updatedUser] = await sql`
//                 UPDATE users
//                 SET
//                     name = ${data.name},
//                     email = ${data.email},
//                     phone = ${data.phone || null}
//                 WHERE id = ${userId}
//                 RETURNING id, name, email, phone, role
//             `;

//             return updatedUser;
//         });

//         res.json({ message: "Profile updated successfully" });
//     } catch (error) {
//         console.error("Update profile error:", error);
//         res.status(500).json({ message: "Failed to update profile" });
//     }
// };

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

        // Handle password change
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

        // Update profile info
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
