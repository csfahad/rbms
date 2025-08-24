import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllBookings, Booking } from "../../services/bookingService";
import {
    Clock,
    CreditCard,
    Users,
    Ticket,
    PlusCircle,
    BarChart2,
    Train,
} from "lucide-react";

const AdminDashboard = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        totalPassengers: 0,
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const allBookings = await getAllBookings();
                setBookings(allBookings);

                // Calculate stats
                const active = allBookings.filter(
                    (b: Booking) => b.status === "Confirmed"
                ).length;
                const cancelled = allBookings.filter(
                    (b: Booking) => b.status === "Cancelled"
                ).length;
                const revenue = allBookings
                    .filter((b: Booking) => b.status === "Confirmed")
                    .reduce(
                        (sum: number, booking: Booking) =>
                            sum + Number(booking.total_fare || 0),
                        0
                    );

                const passengers = allBookings
                    .filter((b: Booking) => b.status === "Confirmed")
                    .reduce(
                        (sum: number, booking: Booking) =>
                            sum + booking.passengers.length,
                        0
                    );

                setStats({
                    totalBookings: allBookings.length,
                    activeBookings: active,
                    cancelledBookings: cancelled,
                    totalRevenue: revenue,
                    totalPassengers: passengers,
                });
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Recent bookings for dashboard display
    const recentBookings = [...bookings]
        .sort(
            (a, b) =>
                new Date(b.booking_date).getTime() -
                new Date(a.booking_date).getTime()
        )
        .slice(0, 5);

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage trains, bookings, and view reports
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <svg
                            className="animate-spin h-10 w-10 text-primary"
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
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Ticket className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">
                                            Total Bookings
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.totalBookings}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <Ticket className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">
                                            Active Bookings
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.activeBookings}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center">
                                    <div className="bg-red-100 p-3 rounded-full">
                                        <Clock className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">
                                            Cancelled
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.cancelledBookings}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 p-3 rounded-full">
                                        <CreditCard className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">
                                            Revenue
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            ₹{stats.totalRevenue}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">
                                            Passengers
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.totalPassengers}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Quick Actions
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link
                                    to="/admin/trains"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Train className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        Manage Trains
                                    </span>
                                </Link>

                                <Link
                                    to="/admin/bookings"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Ticket className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        View Bookings
                                    </span>
                                </Link>

                                <Link
                                    to="/admin/reports"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <BarChart2 className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        Generate Reports
                                    </span>
                                </Link>

                                <Link
                                    to="/admin/trains/add"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <PlusCircle className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        Add New Train
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Recent Bookings */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="bg-white p-6 rounded-lg shadow-md h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Recent Bookings
                                        </h2>
                                        <Link
                                            to="/admin/bookings"
                                            className="text-primary hover:text-primary-light"
                                        >
                                            View All
                                        </Link>
                                    </div>

                                    {recentBookings.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {recentBookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className="py-3"
                                                >
                                                    <div className="flex flex-col md:flex-row justify-between">
                                                        <div>
                                                            <h3 className="font-medium">
                                                                {
                                                                    booking.train_name
                                                                }
                                                            </h3>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <span>
                                                                    PNR:{" "}
                                                                    {
                                                                        booking.pnr
                                                                    }
                                                                </span>
                                                                <span className="mx-2">
                                                                    •
                                                                </span>
                                                                <span>
                                                                    {new Date(
                                                                        booking.booking_date
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 md:mt-0 flex items-center">
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
                                                            <span className="ml-4 text-primary font-medium">
                                                                ₹
                                                                {
                                                                    booking.total_fare
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500">
                                                No bookings found
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="bg-white p-6 rounded-lg shadow-md h-full">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                        Performance Overview
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Sample chart/graph placeholders */}
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                                                Booking Trends
                                            </h3>
                                            <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center">
                                                <p className="text-gray-500 text-sm">
                                                    Booking trend chart would
                                                    appear here
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                                                Revenue Distribution
                                            </h3>
                                            <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center">
                                                <p className="text-gray-500 text-sm">
                                                    Revenue distribution chart
                                                    would appear here
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500 mb-2">
                                                Popular Routes
                                            </h3>
                                            <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center">
                                                <p className="text-gray-500 text-sm">
                                                    Popular routes chart would
                                                    appear here
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
