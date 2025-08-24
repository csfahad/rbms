const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const updateProfile = async (data: {
    name: string;
    email: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
}) => {
    const response = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
    }

    return response.json();
};
