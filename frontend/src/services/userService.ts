import { apiRequest } from "./api";

export const updateProfile = async (name: string, phone: string) => {
    return await apiRequest("/auth/update-profile", {
        method: "PUT",
        body: JSON.stringify({ name, phone }),
    });
};

export const changePassword = async (
    currentPassword: string,
    newPassword: string
) => {
    return await apiRequest("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
    });
};

export const userService = {
    updateProfile,
    changePassword,
};
