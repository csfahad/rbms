import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    getUserBookings,
    cancelBooking,
    Booking,
} from "../../services/bookingService";
import { toast } from "react-hot-toast";
import { Calendar, Users, X, Download, AlertTriangle } from "lucide-react";
import { generateTicket } from "../../utils/ticketGenerator";

const UserBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(
        null
    );
    const [showModal, setShowModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const classMappings: Record<string, string> = {
        SL: "Sleeper (SL)",
        "3A": "AC 3 Tier (3A)",
        "2A": "AC 2 Tier (2A)",
        "1A": "AC First Class (1A)",
    };

    useEffect(() => {
        const loadBookings = async () => {
            if (!user) return;

            try {
                const userBookings = await getUserBookings(user.id); // flat array of bookings
                setBookings(userBookings);

                // filter by selected filter type
                applyFilter(userBookings, filter);

                // handling highlight for newly created booking via URL param
                const params = new URLSearchParams(location.search);
                const newBookingId = params.get("new");

                if (newBookingId) {
                    const newBooking = userBookings.find(
                        (b) => b.id === newBookingId
                    );
                    if (newBooking) {
                        setSelectedBooking(newBooking);
                        setShowModal(true);
                    }
                    navigate("/user/bookings", { replace: true });
                }
            } catch (error) {
                console.error("Error loading bookings:", error);
                toast.error("Failed to load bookings");
            } finally {
                setIsLoading(false);
            }
        };

        loadBookings();
    }, [user, location.search, navigate]);

    useEffect(() => {
        applyFilter(bookings, filter);
    }, [filter, bookings]);

    const normalizeDate = (date: string | Date) => {
        const d = new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()); // time zeroed out
    };

    // helper function to apply the current filter
    const applyFilter = (allBookings: Booking[], filterType: string) => {
        const today = normalizeDate(new Date());
        let filtered: Booking[];

        switch (filterType) {
            case "upcoming":
                filtered = allBookings.filter(
                    (b) =>
                        b.status === "Confirmed" &&
                        normalizeDate(b.travel_date) >= today
                );
                break;
            case "past":
                filtered = allBookings.filter(
                    (b) =>
                        b.status === "Confirmed" &&
                        normalizeDate(b.travel_date) < today
                );
                break;
            case "cancelled":
                filtered = allBookings.filter((b) => b.status === "Cancelled");
                break;
            case "all":
            default:
                filtered = allBookings;
        }

        setFilteredBookings(filtered);
    };

    const handleViewBooking = (booking: Booking) => {
        setSelectedBooking(booking);
        setShowModal(true);
    };

    const confirmCancelBooking = async (bookingId: string) => {
        setIsCancelling(true);
        try {
            const updatedBooking = await cancelBooking(bookingId);

            setBookings((prevBookings) =>
                prevBookings.map((booking) =>
                    booking.id === bookingId ? updatedBooking : booking
                )
            );

            toast.success("Booking cancelled successfully");
            setShowModal(false);
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast.error("Failed to cancel booking");
        } finally {
            setIsCancelling(false);
            setShowCancelConfirmModal(false);
        }
    };

    const downloadTicket = (booking: Booking) => {
        const doc = generateTicket(booking);
        doc.save(`RailBooking_Ticket_${booking.pnr}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <svg
                    className="animate-spin h-10 w-10 text-primary\"
                    xmlns="http://www.w3.org/2000/svg\"
                    fill="none\"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25\"
                        cx="12\"
                        cy="12\"
                        r="10\"
                        stroke="currentColor\"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        My Bookings
                    </h1>
                    <p className="text-gray-600 mt-2">
                        View and manage your train bookings
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="flex overflow-x-auto">
                        <button
                            className={`tab ${
                                filter === "all" ? "tab-active" : "tab-inactive"
                            }`}
                            onClick={() => setFilter("all")}
                        >
                            All Bookings
                        </button>
                        <button
                            className={`tab ${
                                filter === "upcoming"
                                    ? "tab-active"
                                    : "tab-inactive"
                            }`}
                            onClick={() => setFilter("upcoming")}
                        >
                            Upcoming
                        </button>
                        <button
                            className={`tab ${
                                filter === "past"
                                    ? "tab-active"
                                    : "tab-inactive"
                            }`}
                            onClick={() => setFilter("past")}
                        >
                            Past Journeys
                        </button>
                        <button
                            className={`tab ${
                                filter === "cancelled"
                                    ? "tab-active"
                                    : "tab-inactive"
                            }`}
                            onClick={() => setFilter("cancelled")}
                        >
                            Cancelled
                        </button>
                    </div>
                </div>

                {/* Bookings List */}
                {filteredBookings.length > 0 ? (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg">
                                            {booking.train_name}
                                        </h3>
                                        <p className="text-gray-600">
                                            Train: {booking.train_number}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                                            <span className="text-gray-700">
                                                {new Date(
                                                    booking.travel_date
                                                ).toLocaleDateString("en-US", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    booking.status ===
                                                    "Confirmed"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 md:mt-0">
                                        <div className="flex items-center">
                                            <div className="text-right mr-3">
                                                <p className="font-medium">
                                                    {booking.source} (
                                                    {booking.source_code})
                                                </p>
                                            </div>
                                            <div className="flex items-center mx-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                <div className="w-10 h-0.5 bg-gray-300"></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium">
                                                    {booking.destination} (
                                                    {booking.destination_code})
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-end">
                                            <button
                                                onClick={() =>
                                                    handleViewBooking(booking)
                                                }
                                                className="btn btn-primary text-sm"
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No Bookings Found
                        </h3>
                        <p className="text-gray-600">
                            {filter === "all"
                                ? "You have not made any bookings yet."
                                : filter === "upcoming"
                                ? "You have no upcoming journeys."
                                : filter === "past"
                                ? "You have no past journeys."
                                : "You have no cancelled bookings."}
                        </p>
                        <button
                            onClick={() => navigate("/search")}
                            className="btn btn-primary mt-4"
                        >
                            Book a Train
                        </button>
                    </div>
                )}
            </div>

            <>
                {/* Booking Details Modal */}
                {showModal && selectedBooking && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Booking Details
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                {/* Ticket Header */}
                                <div className="bg-primary text-white p-4 rounded-t-lg">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg">
                                                {selectedBooking.train_name}
                                            </h3>
                                            <p className="text-sm">
                                                Train Number:{" "}
                                                {selectedBooking.train_number}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">
                                                PNR: {selectedBooking.pnr}
                                            </p>
                                            <p className="text-sm">
                                                Class:{" "}
                                                {
                                                    classMappings[
                                                        selectedBooking
                                                            .class_type
                                                    ]
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Journey Details */}
                                <div className="border-l border-r border-gray-200 px-8 py-3">
                                    <div className="flex items-center justify-between">
                                        {/* Source Station */}
                                        <div className="text-center flex-shrink-0">
                                            <div className="text-xl font-bold text-gray-900">
                                                {selectedBooking.source_station ||
                                                    selectedBooking.source}
                                            </div>
                                            {selectedBooking.source_code && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {
                                                        selectedBooking.source_code
                                                    }
                                                </div>
                                            )}
                                            {selectedBooking.departure_time && (
                                                <div className="text-lg font-semibold text-primary mt-2">
                                                    {
                                                        selectedBooking.departure_time
                                                    }
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                Departure
                                            </div>
                                        </div>

                                        {/* Journey Connector */}
                                        <div className="flex items-center mx-8 flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                            <div className="flex-1 h-0.5 bg-gray-300 mx-2 min-w-[80px]"></div>
                                            {selectedBooking.duration && (
                                                <div className="text-center mx-4">
                                                    <div className="text-xs text-gray-500">
                                                        Duration
                                                    </div>
                                                    <div className="text-sm font-medium">
                                                        {
                                                            selectedBooking.duration
                                                        }
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 h-0.5 bg-gray-300 mx-2 min-w-[80px]"></div>
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        </div>

                                        {/* Destination Station */}
                                        <div className="text-center flex-shrink-0">
                                            <div className="text-xl font-bold text-gray-900">
                                                {selectedBooking.destination_station ||
                                                    selectedBooking.destination}
                                            </div>
                                            {selectedBooking.destination_code && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {
                                                        selectedBooking.destination_code
                                                    }
                                                </div>
                                            )}
                                            {selectedBooking.arrival_time && (
                                                <div className="text-lg font-semibold text-primary mt-2">
                                                    {
                                                        selectedBooking.arrival_time
                                                    }
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-500 mt-1">
                                                Arrival
                                            </div>
                                        </div>
                                    </div>

                                    {/* Travel Date */}
                                    <div className="text-center mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-center text-gray-600">
                                            Travel Date:{" "}
                                            <Calendar className="h-4 w-4 text-gray-500 mr-2 ml-2" />
                                            <span className="text-gray-700 font-medium">
                                                {new Date(
                                                    selectedBooking.travel_date
                                                ).toLocaleDateString("en-US", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Information */}
                                <div className="border-l border-r border-b border-gray-200 px-4 py-3">
                                    <div className="flex items-center justify-between text-md">
                                        <div className="flex items-center">
                                            <span className="text-gray-600 mr-1">
                                                Passengers:
                                            </span>
                                            <span className="font-semibold">
                                                {selectedBooking.passengers
                                                    ?.length || 1}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-600 mr-1">
                                                Total Fare:
                                            </span>
                                            <span className="font-semibold text-green-600">
                                                ₹{selectedBooking.total_fare}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-600 mr-1">
                                                Booked on:
                                            </span>
                                            <span className="font-semibold">
                                                {new Date(
                                                    selectedBooking.booking_date
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-600 mr-1">
                                                Status:
                                            </span>
                                            <span
                                                className={`font-semibold ${
                                                    selectedBooking.status ===
                                                    "Confirmed"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {selectedBooking.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Passenger Details */}
                                    <div className="mt-3">
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
                                            <Users className="h-4 w-4 mr-2" />
                                            Passenger Details
                                        </h4>
                                        <div className="bg-gray-50 p-2 rounded-md">
                                            {selectedBooking.passengers.map(
                                                (passenger, index) => (
                                                    <div
                                                        key={passenger.id}
                                                        className={`flex justify-between items-center text-sm p-2 ${
                                                            index > 0
                                                                ? "border-t border-gray-200 p-2 mt-1"
                                                                : ""
                                                        }`}
                                                    >
                                                        <div>
                                                            <span className="font-medium">
                                                                {passenger.name}
                                                            </span>
                                                            <span className="text-gray-600 ml-2">
                                                                ({passenger.age}{" "}
                                                                years,{" "}
                                                                {
                                                                    passenger.gender
                                                                }
                                                                )
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-600">
                                                            Seat:{" "}
                                                            {
                                                                passenger.seatNumber
                                                            }
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {selectedBooking.status === "Cancelled" && (
                                        <div className="mt-2 bg-red-50 p-2 rounded-md flex items-start">
                                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-800 font-medium text-sm">
                                                    This booking has been
                                                    cancelled
                                                </p>
                                                <p className="text-red-600 text-xs">
                                                    Cancellation cannot be
                                                    reverted. Please create a
                                                    new booking if you wish to
                                                    travel.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {selectedBooking.status === "Confirmed" && (
                                    <div className="border border-gray-200 rounded-b-lg p-3 bg-gray-50">
                                        <div className="flex flex-row gap-2 justify-end">
                                            {selectedBooking.status ===
                                                "Confirmed" && (
                                                <>
                                                    {new Date(
                                                        selectedBooking.travel_date
                                                    ) > new Date() && (
                                                        <button
                                                            onClick={() =>
                                                                setShowCancelConfirmModal(
                                                                    true
                                                                )
                                                            }
                                                            disabled={
                                                                isCancelling
                                                            }
                                                            className="btn btn-accent flex items-center justify-center text-sm px-3 py-2"
                                                        >
                                                            {isCancelling ? (
                                                                <svg
                                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-25"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                    ></circle>
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="currentColor"
                                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                                    ></path>
                                                                </svg>
                                                            ) : (
                                                                <X className="h-4 w-4 mr-2" />
                                                            )}
                                                            Cancel Booking
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            downloadTicket(
                                                                selectedBooking
                                                            )
                                                        }
                                                        className="btn btn-primary flex items-center justify-center text-sm px-3 py-2"
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download Ticket
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {showCancelConfirmModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Are you sure you want to cancel this booking?
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() =>
                                        setShowCancelConfirmModal(false)
                                    }
                                    disabled={isCancelling}
                                >
                                    No, Go Back
                                </button>
                                <button
                                    className="btn bg-red-600 text-white hover:bg-red-700"
                                    onClick={() =>
                                        selectedBooking?.id &&
                                        confirmCancelBooking(selectedBooking.id)
                                    }
                                    disabled={isCancelling}
                                >
                                    {isCancelling
                                        ? "Cancelling..."
                                        : "Yes, Cancel"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        </div>
    );
};

export default UserBookings;
