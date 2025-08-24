import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
    getUserBookings,
    cancelBooking,
    Booking,
} from "../../services/bookingService";
import { toast } from "react-toastify";
import {
    Calendar,
    Clock,
    Users,
    CreditCard,
    AlertTriangle,
    Download,
    X,
} from "lucide-react";
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
                const userBookings = await getUserBookings(user.id); // Flat array of bookings
                setBookings(userBookings);

                // Filter by selected filter type
                applyFilter(userBookings, filter);

                // Handle highlight for newly created booking via URL param
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

    // Helper function to apply the current filter
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
                                                    {booking.source}
                                                </p>
                                            </div>
                                            <div className="flex items-center mx-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                <div className="w-10 h-0.5 bg-gray-300"></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="font-medium">
                                                    {booking.destination}
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
                                <div className="border-l border-r border-gray-200 p-4">
                                    <div className="flex flex-col md:flex-row justify-between mb-4">
                                        <div className="flex items-start mb-4 md:mb-0">
                                            <div className="text-right mr-3">
                                                <p className="text-lg font-bold">
                                                    {selectedBooking.source}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-center mx-2">
                                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                <div className="w-0.5 h-16 bg-gray-300"></div>
                                                <div className="w-3 h-3 rounded-full bg-primary"></div>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-lg font-bold">
                                                    {
                                                        selectedBooking.destination
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center mb-2">
                                                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                                <span className="text-gray-700">
                                                    {new Date(
                                                        selectedBooking.travel_date
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            weekday: "long",
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center mb-2">
                                                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                                                <span className="text-gray-700">
                                                    Booked on:{" "}
                                                    {new Date(
                                                        selectedBooking.booking_date
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                                                <span className="text-gray-700">
                                                    Total Fare: ₹
                                                    {selectedBooking.total_fare}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                                            <Users className="h-5 w-5 mr-2" />
                                            Passenger Details
                                        </h4>
                                        <div className="bg-gray-50 p-3 rounded-md">
                                            {selectedBooking.passengers.map(
                                                (passenger, index) => (
                                                    <div
                                                        key={passenger.id}
                                                        className={`${
                                                            index > 0
                                                                ? "border-t border-gray-200 pt-2 mt-2"
                                                                : ""
                                                        }`}
                                                    >
                                                        <p className="font-medium">
                                                            {passenger.name}
                                                        </p>
                                                        <div className="flex justify-between text-sm text-gray-600">
                                                            <span>
                                                                {passenger.age}{" "}
                                                                years,{" "}
                                                                {
                                                                    passenger.gender
                                                                }
                                                            </span>
                                                            <span>
                                                                Seat:{" "}
                                                                {
                                                                    passenger.seatNumber
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {selectedBooking.status === "Cancelled" && (
                                        <div className="mt-4 bg-red-50 p-3 rounded-md flex items-start">
                                            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-red-800 font-medium">
                                                    This booking has been
                                                    cancelled
                                                </p>
                                                <p className="text-red-600 text-sm">
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
                                <div className="border border-gray-200 rounded-b-lg p-4 bg-gray-50">
                                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                        {selectedBooking.status ===
                                            "Confirmed" && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        downloadTicket(
                                                            selectedBooking
                                                        )
                                                    }
                                                    className="btn btn-secondary flex items-center justify-center"
                                                >
                                                    <Download className="h-5 w-5 mr-2" />
                                                    Download Ticket
                                                </button>

                                                {new Date(
                                                    selectedBooking.travel_date
                                                ) > new Date() && (
                                                    <button
                                                        onClick={() =>
                                                            setShowCancelConfirmModal(
                                                                true
                                                            )
                                                        }
                                                        disabled={isCancelling}
                                                        className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 flex items-center justify-center"
                                                    >
                                                        {isCancelling ? (
                                                            <svg
                                                                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white\"
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
                                                        ) : (
                                                            <X className="h-5 w-5 mr-2" />
                                                        )}
                                                        Cancel Booking
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
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
