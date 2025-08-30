import { apiRequest } from "./api";

export const supportService = {
    // submit a support message (public endpoint)
    submitMessage: async (messageData: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }) => {
        return await apiRequest("/support/submit", {
            method: "POST",
            body: JSON.stringify(messageData),
        });
    },

    // get user's own support messages (authenticated users)
    getUserMessages: async (params?: { page?: number; limit?: number }) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());

        const queryString = searchParams.toString();
        const url = `/support/my-messages${
            queryString ? `?${queryString}` : ""
        }`;

        return await apiRequest(url, {
            method: "GET",
        });
    },

    // get all support messages (admin only)
    getMessages: async (params?: {
        status?: string;
        page?: number;
        limit?: number;
    }) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());

        const queryString = searchParams.toString();
        const url = `/support${queryString ? `?${queryString}` : ""}`;

        return await apiRequest(url, {
            method: "GET",
        });
    },

    // get a specific support message (admin only)
    getMessageById: async (messageId: string) => {
        return await apiRequest(`/support/${messageId}`, {
            method: "GET",
        });
    },

    // respond to a support message (admin only)
    respondToMessage: async (messageId: string, response: string) => {
        return await apiRequest("/support/respond", {
            method: "POST",
            body: JSON.stringify({
                messageId,
                response,
            }),
        });
    },
};
