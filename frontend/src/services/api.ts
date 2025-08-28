const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const defaultOptions: RequestInit = {
        credentials: "include", // this ensures cookies are sent with requests
        headers: {
            "Content-Type": "application/json",
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: "Request failed" }));
        throw new Error(
            error.message || `HTTP error! status: ${response.status}`
        );
    }

    return response.json();
};

export const apiBlobRequest = async (
    endpoint: string,
    options: RequestInit = {}
) => {
    const defaultOptions: RequestInit = {
        credentials: "include",
        headers: {
            // no need to set Content-Type for blob requests
        },
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response
            .json()
            .catch(() => ({ message: "Request failed" }));
        throw new Error(
            error.message || `HTTP error! status: ${response.status}`
        );
    }

    return response.blob();
};
