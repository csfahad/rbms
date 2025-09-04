import * as crypto from "crypto";
import { pool } from "../config/db";

/*
 * Generate a hash for the reset token to store in database
 * We hash the token so even if someone accesses the database,
 * they can't use the stored token hashes to reset passwords
 */
export const hashToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// check if a reset token has already been used
export const isTokenUsed = async (token: string): Promise<boolean> => {
    try {
        const tokenHash = hashToken(token);
        const result = await pool.query(
            `SELECT id FROM used_reset_tokens WHERE token_hash = $1`,
            [tokenHash]
        );
        return result.rowCount! > 0;
    } catch (error) {
        console.error("Error checking if token is used:", error);
        return false;
    }
};

// mark a reset token as used
export const markTokenAsUsed = async (
    token: string,
    userId: string
): Promise<void> => {
    try {
        const tokenHash = hashToken(token);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await pool.query(
            `INSERT INTO used_reset_tokens (token_hash, user_id, expires_at) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (token_hash) DO NOTHING`,
            [tokenHash, userId, expiresAt]
        );
    } catch (error) {
        console.error("Error marking token as used:", error);
        throw error;
    }
};

// clean up expired tokens
export const cleanupExpiredTokens = async (): Promise<void> => {
    try {
        const result = await pool.query(
            `DELETE FROM used_reset_tokens WHERE expires_at < NOW()`
        );
        console.log(`Cleaned up ${result.rowCount} expired reset tokens`);
    } catch (error) {
        console.error("Error cleaning up expired tokens:", error);
    }
};
