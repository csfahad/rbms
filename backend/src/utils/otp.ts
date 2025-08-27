interface OTPData {
    otp: string;
    email: string;
    expiresAt: Date;
    registrationData?: any;
}

// In-memory storage for OTPs (in production, will be using Redis or database)
const otpStorage = new Map<string, OTPData>();

export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const storeOTP = (
    email: string,
    otp: string,
    registrationData?: any
): void => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    otpStorage.set(email, {
        otp,
        email,
        expiresAt,
        registrationData,
    });
};

export const verifyOTP = (
    email: string,
    otp: string
): { isValid: boolean; registrationData?: any } => {
    const otpData = otpStorage.get(email);

    if (!otpData) {
        return { isValid: false };
    }

    const now = new Date();
    if (now > otpData.expiresAt) {
        otpStorage.delete(email); // Clean up expired OTP
        return { isValid: false };
    }

    if (otpData.otp !== otp) {
        return { isValid: false };
    }

    // OTP is valid, remove it from storage
    otpStorage.delete(email);
    return { isValid: true, registrationData: otpData.registrationData };
};

export const cleanupExpiredOTPs = (): void => {
    const now = new Date();
    for (const [email, otpData] of otpStorage.entries()) {
        if (now > otpData.expiresAt) {
            otpStorage.delete(email);
        }
    }
};

setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);
