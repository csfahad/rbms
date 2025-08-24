const API_URL = "http://localhost:5000/api";

export type TrainClass = "SL" | "3A" | "2A" | "1A";

export interface Station {
    code: string;
    name: string;
    state?: string;
}

export interface ClassAvailability {
    type: TrainClass;
    totalSeats: number;
    fare: number;
    availableSeats: number;
}

export interface Train {
    id: string;
    number: string;
    name: string;
    source: string;
    source_code: string;
    destination: string;
    destination_code: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    distance: string;
    running_days: string[];
    availability: ClassAvailability[];
}

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const createTrain = async (trainData: any) => {
    const response = await fetch(`${API_URL}/trains`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(trainData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create train");
    }

    return response.json();
};

export const updateTrain = async (id: string, trainData: any) => {
    const response = await fetch(`${API_URL}/trains/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(trainData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update train");
    }

    return response.json();
};

export const getTrainById = async (id: string) => {
    const response = await fetch(`${API_URL}/trains/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch train");
    }

    return response.json();
};

export const searchTrains = async (
    source: string,
    destination: string,
    date: string
) => {
    const response = await fetch(
        `${API_URL}/trains/search?source=${source}&destination=${destination}&date=${date}`,
        { headers: getHeaders() }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to search trains");
    }
    return response.json();
};

export const getStationSuggestions = async (
    query: string
): Promise<Station[]> => {
    const response = await fetch(`${API_URL}/trains/stations?query=${query}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch stations");
    }

    return response.json();
};
