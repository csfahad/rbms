import { apiRequest } from "./api";

export const sendOtp = async (email: string) => {
    return await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
};

export const verifyOtp = async (
    email: string,
    otp: string,
    registrationData: any
) => {
    return await apiRequest("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, ...registrationData }),
    });
};

export const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
) => {
    return await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
    });
};

export const login = async (email: string, password: string) => {
    return await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
};

export const verifyToken = async () => {
    return await apiRequest("/auth/verify");
};

export const logout = async () => {
    return await apiRequest("/auth/logout", {
        method: "POST",
    });
};

export const forgotPassword = async (email: string) => {
    return await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
    });
};

export const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string
) => {
    return await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
    });
};

export const authService = {
    sendOtp,
    verifyOtp,
    register,
    login,
    verifyToken,
    logout,
    forgotPassword,
    resetPassword,
};
