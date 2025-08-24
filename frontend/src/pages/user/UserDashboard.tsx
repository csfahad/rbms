// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { useAuth } from "../../contexts/AuthContext";
// import { getUserBookings, Booking } from "../../services/bookingService";
// import {
//     Calendar,
//     MapPin,
//     Search,
//     Ticket,
//     Clock,
//     CreditCard,
//     BookOpen,
// } from "lucide-react";

// const UserDashboard = () => {
//     const { user } = useAuth();
//     const [bookings, setBookings] = useState<Booking[]>([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [stats, setStats] = useState({
//         totalBookings: 0,
//         activeBookings: 0,
//         cancelledBookings: 0,
//         totalSpent: 0,
//     });

//     useEffect(() => {
//         const loadBookings = async () => {
//             if (!user) return;

//             try {
//                 const userBookings = await getUserBookings(user.id);
//                 setBookings(userBookings);

//                 // Calculate stats
//                 const active = userBookings.filter(
//                     (b) => b.status === "Confirmed"
//                 ).length;
//                 const cancelled = userBookings.filter(
//                     (b) => b.status === "Cancelled"
//                 ).length;
//                 const totalSpent = userBookings
//                     .filter((b) => b.status === "Confirmed")
//                     .reduce((sum, booking) => sum + booking.total_fare, 0);

//                 setStats({
//                     totalBookings: userBookings.length,
//                     activeBookings: active,
//                     cancelledBookings: cancelled,
//                     totalSpent,
//                 });
//             } catch (error) {
//                 console.error("Error loading bookings:", error);
//             } finally {
//                 setIsLoading(false);
//             }
//         };

//         loadBookings();
//     }, [user]);

//     const upcomingBookings = bookings
//         .filter(
//             (booking) =>
//                 booking.status === "Confirmed" &&
//                 new Date(booking.travel_date) >= new Date()
//         )
//         .sort(
//             (a, b) =>
//                 new Date(a.travel_date).getTime() -
//                 new Date(b.travel_date).getTime()
//         )
//         .slice(0, 3);

//     return (
//         <div className="bg-gray-50 min-h-screen py-10 fade-in">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//                 <div className="mb-8">
//                     <h1 className="text-3xl font-bold text-gray-900">
//                         Welcome, {user?.name}
//                     </h1>
//                     <p className="text-gray-600 mt-2">
//                         Manage your train bookings and travel plans
//                     </p>
//                 </div>

//                 {isLoading ? (
//                     <div className="flex justify-center items-center py-12">
//                         <svg
//                             className="animate-spin h-10 w-10 text-primary"
//                             xmlns="http://www.w3.org/2000/svg"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                         >
//                             <circle
//                                 className="opacity-25"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                             ></circle>
//                             <path
//                                 className="opacity-75"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                             ></path>
//                         </svg>
//                     </div>
//                 ) : (
//                     <>
//                         {/* Stats Cards */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//                             <div className="bg-white p-6 rounded-lg shadow-md">
//                                 <div className="flex items-center">
//                                     <div className="bg-primary/10 p-3 rounded-full">
//                                         <Ticket className="h-6 w-6 text-primary" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-500">
//                                             Total Bookings
//                                         </p>
//                                         <p className="text-2xl font-bold text-gray-900">
//                                             {stats.totalBookings}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="bg-white p-6 rounded-lg shadow-md">
//                                 <div className="flex items-center">
//                                     <div className="bg-green-100 p-3 rounded-full">
//                                         <Calendar className="h-6 w-6 text-green-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-500">
//                                             Active Bookings
//                                         </p>
//                                         <p className="text-2xl font-bold text-gray-900">
//                                             {stats.activeBookings}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="bg-white p-6 rounded-lg shadow-md">
//                                 <div className="flex items-center">
//                                     <div className="bg-red-100 p-3 rounded-full">
//                                         <Clock className="h-6 w-6 text-red-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-500">
//                                             Cancelled Bookings
//                                         </p>
//                                         <p className="text-2xl font-bold text-gray-900">
//                                             {stats.cancelledBookings}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="bg-white p-6 rounded-lg shadow-md">
//                                 <div className="flex items-center">
//                                     <div className="bg-purple-100 p-3 rounded-full">
//                                         <CreditCard className="h-6 w-6 text-purple-600" />
//                                     </div>
//                                     <div className="ml-4">
//                                         <p className="text-sm font-medium text-gray-500">
//                                             Total Spent
//                                         </p>
//                                         <p className="text-2xl font-bold text-gray-900">
//                                             ₹{stats.totalSpent}
//                                         </p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Quick Actions */}
//                         <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-4">
//                                 Quick Actions
//                             </h2>
//                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                                 <Link
//                                     to="/search"
//                                     className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//                                 >
//                                     <Search className="h-8 w-8 text-primary mb-2" />
//                                     <span className="text-center">
//                                         Search Trains
//                                     </span>
//                                 </Link>

//                                 <Link
//                                     to="/user/bookings"
//                                     className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//                                 >
//                                     <BookOpen className="h-8 w-8 text-primary mb-2" />
//                                     <span className="text-center">
//                                         View All Bookings
//                                     </span>
//                                 </Link>

//                                 <Link
//                                     to="/user/profile"
//                                     className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//                                 >
//                                     <CreditCard className="h-8 w-8 text-primary mb-2" />
//                                     <span className="text-center">
//                                         Manage Profile
//                                     </span>
//                                 </Link>

//                                 <Link
//                                     to="/support"
//                                     className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//                                 >
//                                     <MapPin className="h-8 w-8 text-primary mb-2" />
//                                     <span className="text-center">Support</span>
//                                 </Link>
//                             </div>
//                         </div>

//                         {/* Upcoming Journeys */}
//                         <div className="bg-white p-6 rounded-lg shadow-md mb-8">
//                             <div className="flex justify-between items-center mb-4">
//                                 <h2 className="text-xl font-semibold text-gray-900">
//                                     Upcoming Journeys
//                                 </h2>
//                                 <Link
//                                     to="/user/bookings"
//                                     className="text-primary hover:text-primary-light"
//                                 >
//                                     View All
//                                 </Link>
//                             </div>

//                             {upcomingBookings.length > 0 ? (
//                                 <div className="space-y-4">
//                                     {upcomingBookings.map((booking) => (
//                                         <div
//                                             key={booking.id}
//                                             className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
//                                         >
//                                             <div className="flex flex-col md:flex-row justify-between">
//                                                 <div>
//                                                     <h3 className="font-semibold text-lg">
//                                                         {booking.train_name}
//                                                     </h3>
//                                                     <p className="text-gray-600">
//                                                         PNR: {booking.pnr}
//                                                     </p>
//                                                     <div className="flex items-center mt-2">
//                                                         <Calendar className="h-4 w-4 text-gray-500 mr-1" />
//                                                         <span className="text-gray-700">
//                                                             {new Date(
//                                                                 booking.travel_date
//                                                             ).toLocaleDateString(
//                                                                 "en-US",
//                                                                 {
//                                                                     day: "numeric",
//                                                                     month: "short",
//                                                                     year: "numeric",
//                                                                 }
//                                                             )}
//                                                         </span>
//                                                     </div>
//                                                 </div>

//                                                 <div className="mt-4 md:mt-0">
//                                                     <div className="flex items-center">
//                                                         <div className="text-right mr-3">
//                                                             <p className="font-medium">
//                                                                 {booking.source}
//                                                             </p>
//                                                         </div>
//                                                         <div className="flex items-center mx-2">
//                                                             <div className="w-2 h-2 rounded-full bg-gray-400"></div>
//                                                             <div className="w-10 h-0.5 bg-gray-300"></div>
//                                                             <div className="w-2 h-2 rounded-full bg-gray-400"></div>
//                                                         </div>
//                                                         <div className="ml-3">
//                                                             <p className="font-medium">
//                                                                 {
//                                                                     booking.destination
//                                                                 }
//                                                             </p>
//                                                         </div>
//                                                     </div>

//                                                     <div className="mt-2 flex justify-end">
//                                                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//                                                             {booking.status}
//                                                         </span>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             ) : (
//                                 <div className="text-center py-8">
//                                     <p className="text-gray-500 mb-4">
//                                         No upcoming journeys
//                                     </p>
//                                     <Link
//                                         to="/search"
//                                         className="btn btn-primary mt-4"
//                                     >
//                                         Book a Train
//                                     </Link>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Travel History Chart - Placeholder */}
//                         <div className="bg-white p-6 rounded-lg shadow-md">
//                             <h2 className="text-xl font-semibold text-gray-900 mb-6">
//                                 Your Travel History
//                             </h2>

//                             {bookings.length > 0 ? (
//                                 <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
//                                     <p className="text-gray-500">
//                                         Travel history visualization would
//                                         appear here in a production application
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <div className="text-center py-8">
//                                     <p className="text-gray-500">
//                                         No travel history available
//                                     </p>
//                                 </div>
//                             )}
//                         </div>
//                     </>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default UserDashboard;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getUserBookings, Booking } from "../../services/bookingService";
import {
    Calendar,
    MapPin,
    Search,
    Ticket,
    Clock,
    CreditCard,
    BookOpen,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const UserDashboard = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalBookings: 0,
        activeBookings: 0,
        cancelledBookings: 0,
        totalSpent: 0,
    });
    const [travelHistory, setTravelHistory] = useState({
        labels: [] as string[],
        bookingCounts: [] as number[],
        totalSpent: [] as number[],
    });

    useEffect(() => {
        const loadBookings = async () => {
            if (!user) return;

            try {
                const userBookings = await getUserBookings(user.id);
                setBookings(userBookings);

                // Calculate stats
                const active = userBookings.filter(
                    (b) => b.status === "Confirmed"
                ).length;
                const cancelled = userBookings.filter(
                    (b) => b.status === "Cancelled"
                ).length;
                const totalSpent = userBookings
                    .filter((b) => b.status === "Confirmed")
                    .reduce(
                        (sum, booking) => sum + Number(booking.total_fare),
                        0
                    );

                setStats({
                    totalBookings: userBookings.length,
                    activeBookings: active,
                    cancelledBookings: cancelled,
                    totalSpent,
                });

                // Process travel history data
                const last6Months = Array.from({ length: 6 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    return date.toLocaleString("default", {
                        month: "short",
                        year: "numeric",
                    });
                }).reverse();

                const bookingsByMonth = last6Months.map((month) => {
                    return userBookings.filter((booking) => {
                        const bookingMonth = new Date(
                            booking.booking_date
                        ).toLocaleString("default", {
                            month: "short",
                            year: "numeric",
                        });
                        return bookingMonth === month;
                    });
                });

                setTravelHistory({
                    labels: last6Months,
                    bookingCounts: bookingsByMonth.map(
                        (bookings) => bookings.length
                    ),
                    totalSpent: bookingsByMonth.map((bookings) =>
                        bookings.reduce(
                            (sum, booking) => sum + Number(booking.total_fare),
                            0
                        )
                    ),
                });
            } catch (error) {
                console.error("Error loading bookings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBookings();
    }, [user]);

    const upcomingBookings = bookings
        .filter(
            (booking) =>
                booking.status === "Confirmed" &&
                new Date(booking.travel_date) >= new Date()
        )
        .sort(
            (a, b) =>
                new Date(a.travel_date).getTime() -
                new Date(b.travel_date).getTime()
        )
        .slice(0, 3);

    const travelHistoryData = {
        labels: travelHistory.labels,
        datasets: [
            {
                label: "Number of Bookings",
                data: travelHistory.bookingCounts,
                borderColor: "rgb(26, 35, 126)",
                backgroundColor: "rgba(26, 35, 126, 0.5)",
                yAxisID: "y",
            },
            {
                label: "Total Spent (₹)",
                data: travelHistory.totalSpent,
                borderColor: "rgb(211, 47, 47)",
                backgroundColor: "rgba(211, 47, 47, 0.5)",
                yAxisID: "y1",
            },
        ],
    };

    const options = {
        responsive: true,
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
        stacked: false,
        plugins: {
            title: {
                display: true,
                text: "Travel History Analysis",
            },
        },
        scales: {
            y: {
                type: "linear" as const,
                display: true,
                position: "left" as const,
                title: {
                    display: true,
                    text: "Number of Bookings",
                },
                ticks: {
                    callback: function (value: number | string) {
                        return Number(value).toLocaleString("en-IN");
                    },
                },
            },
            y1: {
                type: "linear" as const,
                display: true,
                position: "right" as const,
                title: {
                    display: true,
                    text: "Amount Spent (₹)",
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: function (value: number | string) {
                        const numericValue =
                            typeof value === "string"
                                ? parseFloat(value)
                                : value;
                        return numericValue.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                        });
                    },
                },
            },
        },
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome, {user?.name}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage your train bookings and travel plans
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                                        <Calendar className="h-6 w-6 text-green-600" />
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
                                            Cancelled Bookings
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
                                            Total Spent
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.totalSpent.toLocaleString(
                                                "en-IN",
                                                {
                                                    style: "currency",
                                                    currency: "INR",
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
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
                                    to="/search"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Search className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        Search Trains
                                    </span>
                                </Link>

                                <Link
                                    to="/user/bookings"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <BookOpen className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        View All Bookings
                                    </span>
                                </Link>

                                <Link
                                    to="/user/profile"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <CreditCard className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">
                                        Manage Profile
                                    </span>
                                </Link>

                                <Link
                                    to="/support"
                                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <MapPin className="h-8 w-8 text-primary mb-2" />
                                    <span className="text-center">Support</span>
                                </Link>
                            </div>
                        </div>

                        {/* Upcoming Journeys */}
                        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Upcoming Journeys
                                </h2>
                                <Link
                                    to="/user/bookings"
                                    className="text-primary hover:text-primary-light"
                                >
                                    View All
                                </Link>
                            </div>

                            {upcomingBookings.length > 0 ? (
                                <div className="space-y-4">
                                    {upcomingBookings.map((booking) => (
                                        <div
                                            key={booking.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col md:flex-row justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {booking.train_name}
                                                    </h3>
                                                    <p className="text-gray-600">
                                                        PNR: {booking.pnr}
                                                    </p>
                                                    <div className="flex items-center mt-2">
                                                        <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                                                        <span className="text-gray-700">
                                                            {new Date(
                                                                booking.travel_date
                                                            ).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }
                                                            )}
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
                                                                {
                                                                    booking.destination
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-2 flex justify-end">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">
                                        No upcoming journeys
                                    </p>
                                    <Link
                                        to="/search"
                                        className="btn btn-primary mt-4"
                                    >
                                        Book a Train
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Travel History Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Your Travel History
                            </h2>

                            {bookings.length > 0 ? (
                                <div className="h-[400px]">
                                    <Line
                                        options={options}
                                        data={travelHistoryData}
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        No travel history available
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
