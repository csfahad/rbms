import { apiRequest } from "./api";

export interface UserActivityData {
    date: string;
    new_registrations: number;
    active_users: number;
    total_bookings: number;
}

export interface UserReportData {
    users: Array<{
        id: string;
        name: string;
        email: string;
        registration_date: string;
        total_bookings: number;
        active_days: number;
    }>;
    dailyActivity: UserActivityData[];
}

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

export const getUsersForReports = async (): Promise<UserReportData> => {
    const data = await apiRequest("/users/reports", {
        method: "GET",
    });

    // convert string numbers to actual numbers
    const processedData = {
        ...data,
        dailyActivity: data.dailyActivity.map((activity: any) => ({
            ...activity,
            new_registrations: parseInt(activity.new_registrations) || 0,
            active_users: parseInt(activity.active_users) || 0,
            total_bookings: parseInt(activity.total_bookings) || 0,
        })),
        users: data.users.map((user: any) => ({
            ...user,
            total_bookings: parseInt(user.total_bookings) || 0,
            active_days: parseInt(user.active_days) || 0,
        })),
    };

    return processedData;
};

export const userService = {
    updateProfile,
    changePassword,
    getUsersForReports,
};
