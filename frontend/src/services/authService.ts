const API_URL = import.meta.env.VITE_API_URL;

export const sendOtp = async (email: string) => {
    const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send OTP");
    }

    return response.json();
};

export const verifyOtp = async (
    email: string,
    otp: string,
    registrationData: any
) => {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, ...registrationData }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "OTP verification failed");
    }

    return response.json();
};

export const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, phone }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
    }

    return response.json();
};

export const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
    }

    return response.json();
};

export const verifyToken = async (token: string) => {
    const response = await fetch(`${API_URL}/auth/verify`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Invalid token");
    }

    return response.json();
};

export const logout = () => {
    localStorage.removeItem("token");
};

export const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send password reset OTP");
    }

    return response.json();
};

export const resetPassword = async (
    email: string,
    otp: string,
    newPassword: string
) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Password reset failed");
    }

    return response.json();
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
