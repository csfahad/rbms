const API_URL = "http://localhost:5000/api";

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
}

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

// export const createBooking = async (
//     userId: string,
//     train: any,
//     classType: string,
//     passengers: Omit<Passenger, "id" | "seatNumber">[],
//     travelDate: string
// ) => {
//     const response = await fetch(`${API_URL}/bookings`, {
//         method: "POST",
//         headers: getHeaders(),
//         body: JSON.stringify({
//             userId,
//             trainId: train.id,
//             classType,
//             passengers,
//             travelDate,
//         }),
//     });

//     if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Failed to create booking");
//     }

//     return response.json();
// };

export const createBooking = async (
    userId: string,
    train: any,
    classType: string,
    passengers: Omit<Passenger, "id" | "seatNumber">[],
    travelDate: string
) => {
    const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
            userId,
            trainId: train.id,
            classType,
            travelDate,
            passengers,
            numberOfPassengers: passengers.length,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create booking");
    }

    return response.json();
};

export const getBookingById = async (id: string) => {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch booking");
    }

    return response.json();
};

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
    const response = await fetch(`${API_URL}/bookings/user/${userId}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch bookings");
    }

    const data = await response.json();
    return data.all || []; // ✅ Extract only the bookings array
};

export const getAllBookings = async () => {
    const response = await fetch(`${API_URL}/bookings`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch all bookings");
    }

    return response.json();
};

export const cancelBooking = async (id: string) => {
    const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
        method: "PUT",
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to cancel booking");
    }

    return response.json();
};

// export const generateReport = async (
//     type: string,
//     startDate: string,
//     endDate: string
// ) => {
//     const response = await fetch(
//         `${API_URL}/bookings/report?type=${type}&startDate=${startDate}&endDate=${endDate}`,
//         {
//             headers: getHeaders(),
//         }
//     );

//     if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || "Failed to generate report");
//     }

//     return response.json();
// };

export const getUpcomingJourneys = async (userId: string) => {
    const response = await fetch(
        `${API_URL}/bookings/user/${userId}/upcoming`,
        {
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch upcoming journeys");
    }

    return response.json();
};

export const getTravelHistory = async (userId: string) => {
    const response = await fetch(`${API_URL}/bookings/user/${userId}/history`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch travel history");
    }

    return response.json();
};

export const getBookingStats = async () => {
    const response = await fetch(`${API_URL}/bookings/stats`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch booking stats");
    }

    return response.json();
};

export const generateReport = async (
    type: string,
    startDate: string,
    endDate: string,
    format: "pdf" | "csv" | "excel"
) => {
    const response = await fetch(
        `${API_URL}/bookings/report?type=${type}&startDate=${startDate}&endDate=${endDate}&format=${format}`,
        {
            headers: getHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to generate report");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${type}-${startDate}-${endDate}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
