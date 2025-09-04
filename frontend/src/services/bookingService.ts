import { apiRequest, apiBlobRequest } from "./api";

export interface Passenger {
    id: string;
    name: string;
    age: number;
    gender: string;
    seatNumber: string;
}

export interface Booking {
    id: string;
    userId: string;
    trainId: string;
    pnr: string;
    class_type: string;
    travel_date: string;
    booking_date: string;
    status: string;
    total_fare: number;
    train_name: string;
    train_number: string;
    source: string;
    destination: string;
    passengers: Passenger[];
    // segment booking fields
    source_station?: string;
    source_code?: string;
    destination_station?: string;
    destination_code?: string;
    departure_time?: string;
    arrival_time?: string;
    duration?: string;
    distance?: string;
}

export interface TrainResult {
    departure_station: string;
    arrival_station: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    distance: string;
    available_seats: {
        [key: string]: number;
    };
    train_id: string;
    train_name: string;
    train_number: string;
}

export interface BookingRequest {
    trainId: string;
    fromStation: string;
    toStation: string;
    travelDate: string;
    seatType: string;
    passengers: Passenger[];
}

export const createBooking = async (
    userId: string,
    train: any,
    classType: string,
    passengers: Omit<Passenger, "id" | "seatNumber">[],
    travelDate: string,
    segmentInfo?: {
        fromStation?: string;
        fromCode?: string;
        toStation?: string;
        toCode?: string;
        departureTime?: string;
        arrivalTime?: string;
        duration?: string;
        distance?: string;
    }
) => {
    const data = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
            userId,
            trainId: train.id,
            classType,
            travelDate,
            passengers,
            // include segment information for segment-based booking
            sourceStation: segmentInfo?.fromStation || train.source,
            sourceCode: segmentInfo?.fromCode || train.source_code,
            destinationStation: segmentInfo?.toStation || train.destination,
            destinationCode: segmentInfo?.toCode || train.destination_code,
            departureTime: segmentInfo?.departureTime || train.departure_time,
            arrivalTime: segmentInfo?.arrivalTime || train.arrival_time,
            duration: segmentInfo?.duration || train.duration,
            distance: segmentInfo?.distance || train.distance,
        }),
    });

    return data;
};

export const getBookingById = async (id: string) => {
    return await apiRequest(`/bookings/${id}`);
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    const data = await apiRequest(`/bookings/user/${userId}`);
    return data.all || [];
};

export const getAllBookings = async () => {
    return await apiRequest("/bookings");
};

export const cancelBooking = async (id: string) => {
    return await apiRequest(`/bookings/${id}/cancel`, {
        method: "PUT",
    });
};

export const getUpcomingJourneys = async (userId: string) => {
    return await apiRequest(`/bookings/user/${userId}/upcoming`);
};

export const getTravelHistory = async (userId: string) => {
    return await apiRequest(`/bookings/user/${userId}/history`);
};

export const getBookingStats = async () => {
    return await apiRequest("/bookings/stats");
};

export const generateReport = async (
    type: string,
    startDate: string,
    endDate: string,
    format: "pdf" | "csv" | "excel"
) => {
    const blob = await apiBlobRequest(
        `/bookings/report?type=${type}&startDate=${startDate}&endDate=${endDate}&format=${format}`
    );

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${type}-${startDate}-${endDate}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
