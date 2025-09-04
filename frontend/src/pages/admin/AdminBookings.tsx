import { useState, useEffect } from "react";
import { getAllBookings, Booking } from "../../services/bookingService";
import {
    Calendar,
    Search,
    UserCircle,
    Filter,
    ChevronDown,
    FileSpreadsheet,
    FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const AdminBookings = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateFilter, setDateFilter] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const allBookings = await getAllBookings();
                setBookings(allBookings);
            } catch (error) {
                console.error("Error loading bookings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBookings();
    }, []);

    // filter and sort bookings
    const filteredBookings = bookings
        .filter((booking) => {
            let matchesSearch = true;
            let matchesStatus = true;
            let matchesDate = true;

            if (searchQuery) {
                const searchLower = searchQuery.toLowerCase();
                const searchableFields = [
                    booking.pnr,
                    booking.userId,
                    booking.train_name,
                    booking.source,
                    booking.destination,
                    booking.source_station,
                    booking.destination_station,
                    booking.train_number,
                    booking.status,
                ];

                matchesSearch = searchableFields.some(
                    (field) =>
                        field &&
                        field.toString().toLowerCase().includes(searchLower)
                );
            }

            if (statusFilter !== "all") {
                matchesStatus = booking.status === statusFilter;
            }

            if (dateFilter) {
                try {
                    const filterDate = dateFilter;

                    // function to normalize date to YYYY-MM-DD format
                    const normalizeDate = (dateStr: string): string => {
                        if (!dateStr) return "";

                        // if already in YYYY-MM-DD format
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                            return dateStr;
                        }

                        // if in DD/MM/YYYY format
                        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                            const [day, month, year] = dateStr.split("/");
                            return `${year}-${month.padStart(
                                2,
                                "0"
                            )}-${day.padStart(2, "0")}`;
                        }

                        // if in ISO format like 2025-09-05T18:30:00.000Z
                        if (dateStr.includes("T") && dateStr.includes("Z")) {
                            // parse as UTC date and convert to local date
                            const utcDate = new Date(dateStr);
                            // get the local date
                            const localYear = utcDate.getFullYear();
                            const localMonth = String(
                                utcDate.getMonth() + 1
                            ).padStart(2, "0");
                            const localDay = String(utcDate.getDate()).padStart(
                                2,
                                "0"
                            );

                            return `${localYear}-${localMonth}-${localDay}`;
                        }

                        // if in ISO format like 2025-09-13T00:00:00.000Z, but we want to extract just the date part
                        if (dateStr.includes("T")) {
                            return dateStr.split("T")[0];
                        }

                        // if date looks like YYYY-MM-DD but with extra characters
                        const dateMatch = dateStr.match(
                            /(\d{4})-(\d{2})-(\d{2})/
                        );
                        if (dateMatch) {
                            return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
                        }

                        // fallback
                        try {
                            const parsedDate = new Date(dateStr);
                            const year = parsedDate.getFullYear();
                            const month = String(
                                parsedDate.getMonth() + 1
                            ).padStart(2, "0");
                            const day = String(parsedDate.getDate()).padStart(
                                2,
                                "0"
                            );
                            return `${year}-${month}-${day}`;
                        } catch (e) {
                            console.error("Failed to parse date:", dateStr, e);
                            return "";
                        }
                    };

                    const bookingDate = normalizeDate(booking.travel_date);
                    matchesDate = bookingDate === filterDate;
                } catch (error) {
                    console.error(
                        "Date filter error:",
                        error,
                        booking.travel_date
                    );
                    matchesDate = false;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        })
        .sort((a, b) => {
            if (sortOrder === "newest") {
                return (
                    new Date(b.booking_date).getTime() -
                    new Date(a.booking_date).getTime()
                );
            } else if (sortOrder === "oldest") {
                return (
                    new Date(a.booking_date).getTime() -
                    new Date(b.booking_date).getTime()
                );
            } else if (sortOrder === "amount-high") {
                return b.total_fare - a.total_fare;
            } else {
                return a.total_fare - b.total_fare;
            }
        });

    const exportToCsv = () => {
        // create CSV data from filtered bookings
        const csvData = filteredBookings.map((booking) => ({
            PNR: booking.pnr,
            "Train Name": booking.train_name,
            "Train Number": booking.train_number,
            "Passenger Count": booking.passengers.length,
            Source: booking.source || booking.source_station || "N/A",
            Destination:
                booking.destination || booking.destination_station || "N/A",
            "Travel Date": new Date(booking.travel_date).toLocaleDateString(),
            "Booking Date": new Date(booking.booking_date).toLocaleDateString(),
            Class: booking.class_type,
            "Total Fare": `₹${booking.total_fare}`,
            Status: booking.status,
        }));

        // create worksheet
        const ws = XLSX.utils.json_to_sheet(csvData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bookings");

        // download file
        const timestamp = new Date().toISOString().split("T")[0];
        XLSX.writeFile(wb, `bookings_${timestamp}.xlsx`);
    };

    const exportToPdf = () => {
        const doc = new jsPDF();

        // add title
        doc.setFontSize(18);
        doc.text("Admin Bookings Report", 20, 20);

        // add generation date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
        doc.text(`Total Bookings: ${filteredBookings.length}`, 20, 45);

        // prepare table data
        const tableData = filteredBookings.map((booking) => [
            booking.pnr,
            booking.train_name || "N/A",
            booking.train_number || "N/A",
            booking.passengers.length.toString(),
            booking.source || booking.source_station || "N/A",
            booking.destination || booking.destination_station || "N/A",
            new Date(booking.travel_date).toLocaleDateString(),
            booking.class_type,
            `₹${booking.total_fare}`,
            booking.status,
        ]);

        // add table
        autoTable(doc, {
            head: [
                [
                    "PNR",
                    "Train Name",
                    "Train No.",
                    "Passengers",
                    "Source",
                    "Destination",
                    "Travel Date",
                    "Class",
                    "Fare",
                    "Status",
                ],
            ],
            body: tableData,
            startY: 55,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                0: { cellWidth: 20 }, // PNR
                1: { cellWidth: 25 }, // Train Name
                2: { cellWidth: 18 }, // Train No
                3: { cellWidth: 15 }, // Passengers
                4: { cellWidth: 20 }, // Source
                5: { cellWidth: 20 }, // Destination
                6: { cellWidth: 20 }, // Travel Date
                7: { cellWidth: 12 }, // Class
                8: { cellWidth: 15 }, // Fare
                9: { cellWidth: 15 }, // Status
            },
        });

        // download PDF
        const timestamp = new Date().toISOString().split("T")[0];
        doc.save(`bookings_${timestamp}.pdf`);
    };

    const classMappings: Record<string, string> = {
        SL: "Sleeper (SL)",
        "3A": "AC 3 Tier (3A)",
        "2A": "AC 2 Tier (2A)",
        "1A": "AC First Class (1A)",
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            All Bookings
                        </h1>
                        <p className="text-gray-600 mt-1">
                            View and manage customer bookings
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={exportToCsv}
                            className="btn btn-secondary flex items-center"
                            title="Export to Excel"
                        >
                            <FileSpreadsheet className="h-5 w-5" />
                        </button>
                        <button
                            onClick={exportToPdf}
                            className="btn btn-secondary flex items-center"
                            title="Export to PDF"
                        >
                            <FileDown className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="w-full md:w-1/3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by PNR, train name, etc."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="form-input pl-10 w-full"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="btn btn-secondary flex items-center"
                            >
                                <Filter className="h-5 w-5 mr-2" />
                                Filters
                                <ChevronDown
                                    className={`h-4 w-4 ml-2 transform ${
                                        isFilterOpen ? "rotate-180" : ""
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="ml-auto">
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="form-input"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="amount-high">
                                    Amount (High to Low)
                                </option>
                                <option value="amount-low">
                                    Amount (Low to High)
                                </option>
                            </select>
                        </div>
                    </div>

                    {isFilterOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                            <div>
                                <label
                                    htmlFor="statusFilter"
                                    className="form-label"
                                >
                                    Booking Status
                                </label>
                                <select
                                    id="statusFilter"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="form-input"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="Confirmed">Confirmed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="dateFilter"
                                    className="form-label"
                                >
                                    Travel Date
                                </label>
                                <input
                                    type="date"
                                    id="dateFilter"
                                    value={dateFilter}
                                    onChange={(e) =>
                                        setDateFilter(e.target.value)
                                    }
                                    className="form-input"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                        setDateFilter("");
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
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
                        {/* Bookings Table */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            {filteredBookings.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Booking Info
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Train Details
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Journey
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Passengers & Class
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Amount
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredBookings.map((booking) => (
                                                <tr
                                                    key={booking.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            PNR: {booking.pnr}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Booked:{" "}
                                                            {new Date(
                                                                booking.booking_date
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {booking.train_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                booking.train_number
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                                            <div className="text-sm text-gray-900">
                                                                {new Date(
                                                                    booking.travel_date
                                                                ).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            {booking.source} →{" "}
                                                            {
                                                                booking.destination
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <UserCircle className="h-4 w-4 text-gray-400 mr-1" />
                                                            <div className="text-sm text-gray-900">
                                                                {
                                                                    booking
                                                                        .passengers
                                                                        .length
                                                                }{" "}
                                                                passenger(s)
                                                            </div>
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1">
                                                            Class:{" "}
                                                            {
                                                                classMappings[
                                                                    booking
                                                                        .class_type
                                                                ]
                                                            }
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            ₹
                                                            {booking.total_fare}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                booking.status ===
                                                                "Confirmed"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-gray-500">
                                        No bookings match your search criteria
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

export default AdminBookings;
