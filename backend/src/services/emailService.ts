import nodemailer from "nodemailer";
import { Resend } from "resend";

// reusable transporter object using SMTP transport
const createTransporter = () => {
    const emailProvider = process.env.EMAIL_PROVIDER || "gmail";

    switch (emailProvider.toLowerCase()) {
        case "gmail":
            return nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD,
                },
            });

        case "sendgrid":
            return nodemailer.createTransport({
                host: "smtp.sendgrid.net",
                port: 587,
                secure: false,
                auth: {
                    user: "apikey",
                    pass: process.env.SENDGRID_API_KEY,
                },
            });

        case "resend":
            // Resend uses its own SDK, not nodemailer
            // This case won't return a transporter
            return null;

        case "mailgun":
            return nodemailer.createTransport({
                host: "smtp.mailgun.org",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.MAILGUN_SMTP_LOGIN,
                    pass: process.env.MAILGUN_SMTP_PASSWORD,
                },
            });

        case "outlook":
            return nodemailer.createTransport({
                service: "hotmail",
                auth: {
                    user: process.env.OUTLOOK_USER,
                    pass: process.env.OUTLOOK_PASSWORD,
                },
            });

        case "custom":
            return nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || "587"),
                secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

        default:
            // development/testing with ethereal
            return nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: "ethereal.user@ethereal.email",
                    pass: "ethereal.pass",
                },
            });
    }
};

export const sendOTPEmail = async (
    email: string,
    otp: string,
    type: "registration" | "password-reset" = "registration"
): Promise<void> => {
    if (process.env.SKIP_EMAIL_SENDING === "true") {
        console.log(`\n OTP for ${email}: ${otp}\n`);
        console.log(`Copy this OTP to test the verification: ${otp}`);
        console.log(`Email sending is disabled (SKIP_EMAIL_SENDING=true)\n`);
        return;
    }

    const emailProvider = process.env.EMAIL_PROVIDER || "gmail";

    // handling Resend separately since it uses its own SDK
    if (emailProvider.toLowerCase() === "resend") {
        await sendWithResend(email, otp, type);
        return;
    }

    // handling other providers with nodemailer
    const transporter = createTransporter();

    if (!transporter) {
        throw new Error("Failed to create email transporter");
    }

    const mailOptions = {
        from: process.env.FROM_EMAIL || '"RailBuddy" <noreply@railbuddy.com>',
        to: email,
        subject:
            type === "password-reset"
                ? "Reset Your RailBuddy Password"
                : "Your RailBuddy Verification Code",
        html: generateOTPEmailHTML(otp, type),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("OTP email sent:", info.messageId);

        if (process.env.NODE_ENV === "development") {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("Error sending OTP email:", error);
        throw new Error("Failed to send verification email");
    }
};

// Resend-specific email sending function
const sendWithResend = async (
    email: string,
    otp: string,
    type: "registration" | "password-reset" = "registration"
): Promise<void> => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from:
                process.env.FROM_EMAIL || "RailBuddy <noreply@yourdomain.com>",
            to: [email],
            subject:
                type === "password-reset"
                    ? "Reset Your RailBuddy Password"
                    : "Your RailBuddy Verification Code",
            html: generateOTPEmailHTML(otp, type),
        });

        if (error) {
            console.error("Resend error:", error);
            throw new Error("Failed to send verification email via Resend");
        }

        console.log("OTP email sent via Resend:", data?.id);
    } catch (error) {
        console.error("Error sending OTP email via Resend:", error);
        throw new Error("Failed to send verification email");
    }
};

// Email template function
const generateOTPEmailHTML = (
    otp: string,
    type: "registration" | "password-reset" = "registration"
): string => {
    const isPasswordReset = type === "password-reset";

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">RailBuddy</h1>
                <p style="color: #6b7280; margin: 5px 0;">Your Railway Booking Companion</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">
                    ${
                        isPasswordReset
                            ? "Reset Your Password"
                            : "Verify Your Email Address"
                    }
                </h2>
                <p style="color: #4b5563; margin-bottom: 30px;">
                    ${
                        isPasswordReset
                            ? "Enter the following 6-digit code to reset your password:"
                            : "Enter the following 6-digit code to complete your account registration:"
                    }
                </p>
                
                <div style="background-color: white; padding: 20px; border-radius: 6px; border: 2px dashed #e5e7eb; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 5px;">${otp}</span>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                    This code will expire in 10 minutes for security reasons.
                </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px;">
                    ${
                        isPasswordReset
                            ? "If you didn't request a password reset, please ignore this email."
                            : "If you didn't request this code, please ignore this email."
                    }
                </p>
                <p style="color: #6b7280; font-size: 14px;">
                    © ${new Date().getFullYear()} RailBuddy. All rights reserved.
                </p>
            </div>
        </div>
    `;
};
