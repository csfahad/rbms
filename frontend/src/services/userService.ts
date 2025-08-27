const API_URL = import.meta.env.VITE_API_URL;

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

export const updateProfile = async (name: string, phone: string) => {
    const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ name, phone }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
    }

    return response.json();
};

export const changePassword = async (
    currentPassword: string,
    newPassword: string
) => {
    const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to change password");
    }

    return response.json();
};

export const userService = {
    updateProfile,
    changePassword,
};
