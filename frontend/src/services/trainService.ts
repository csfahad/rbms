import { apiRequest } from "./api";

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

export const createTrain = async (trainData: any) => {
    return await apiRequest("/trains", {
        method: "POST",
        body: JSON.stringify(trainData),
    });
};

export const updateTrain = async (id: string, trainData: any) => {
    return await apiRequest(`/trains/${id}`, {
        method: "PUT",
        body: JSON.stringify(trainData),
    });
};

export const getTrainById = async (id: string) => {
    return await apiRequest(`/trains/${id}`);
};

export const searchTrains = async (
    source: string,
    destination: string,
    date: string
) => {
    return await apiRequest(
        `/trains/search?source=${source}&destination=${destination}&date=${date}`
    );
};

export const getStationSuggestions = async (
    query: string
): Promise<Station[]> => {
    return await apiRequest(`/trains/stations?query=${query}`);
};
