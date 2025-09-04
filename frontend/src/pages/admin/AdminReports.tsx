import { useState, useEffect } from "react";
import {
    Calendar,
    Download,
    BarChart2,
    Pi as Pie,
    TrendingUp,
    DollarSign,
    Clock,
    Users,
} from "lucide-react";
import { getAllBookings, Booking } from "../../services/bookingService";
import { getUsersForReports, UserReportData } from "../../services/userService";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface ReportData {
    chartData: any;
    tableData: any[];
    summary: any;
}

interface DailyBookingData {
    date: string;
    bookings: number;
    revenue: number;
    passengers: number;
}

interface RevenueData {
    date: string;
    bookings: number;
    revenue: number;
    avgTicketPrice: number;
}

interface LoadFactorData {
    trainName: string;
    trainNumber: string;
    route: string;
    totalSeats: number;
    bookedSeats: number;
    loadFactor: number;
}

interface UserActivityData {
    date: string;
    newRegistrations: number;
    totalBookings: number;
    activeUsers: number;
}

interface CancellationData {
    date: string;
    totalBookings: number;
    cancelled: number;
    cancellationRate: number;
    reason: string;
}

interface TrainPerformanceData {
    trainName: string;
    trainNumber: string;
    totalTrips: number;
    revenue: number;
    avgLoadFactor: number;
    popularity: number;
}

const reportTypes = [
    {
        id: "daily-booking",
        name: "Daily Booking Report",
        description: "Overview of all bookings made in a single day",
        icon: Calendar,
    },
    {
        id: "revenue",
        name: "Revenue Report",
        description:
            "Track income generated over a period based on completed bookings",
        icon: DollarSign,
    },
    {
        id: "load-factor",
        name: "Train Load Factor Report",
        description:
            "Evaluate seat occupancy percentage across various train services",
        icon: Users,
    },
    {
        id: "user-activity",
        name: "User Activity Report",
        description: "Track user engagement and activity trends",
        icon: TrendingUp,
    },
    {
        id: "cancellation",
        name: "Cancellation Analysis Report",
        description:
            "Understand cancellation patterns and potential service issues",
        icon: Clock,
    },
    {
        id: "train-performance",
        name: "Train Performance Report",
        description: "Evaluate each train route's operational performance",
        icon: BarChart2,
    },
];

const AdminReports = () => {
    const [selectedReport, setSelectedReport] = useState("");
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30); // Default to 30 days ago
        return date.toISOString().split("T")[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return date.toISOString().split("T")[0]; // Default to today
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [userReportData, setUserReportData] = useState<UserReportData | null>(
        null
    );

    useEffect(() => {
        const loadBookings = async () => {
            try {
                const allBookings = await getAllBookings();
                setBookings(allBookings);
            } catch (error) {
                console.error("Error loading bookings:", error);
            }
        };

        const loadUserData = async () => {
            try {
                const userData = await getUsersForReports();
                setUserReportData(userData);
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        };

        loadBookings();
        loadUserData();
    }, []);

    useEffect(() => {
        setReportData(null);
        setShowPreview(false);
    }, [selectedReport]);

    const filterBookingsByDateRange = (bookings: Booking[]) => {
        if (!startDate || !endDate) return bookings;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return bookings.filter((booking) => {
            const bookingDate = new Date(booking.booking_date);
            return bookingDate >= start && bookingDate <= end;
        });
    };

    const generateDailyBookingReport = (
        filteredBookings: Booking[]
    ): ReportData => {
        const dailyData: { [key: string]: DailyBookingData } = {};

        filteredBookings.forEach((booking) => {
            const date = booking.booking_date.split("T")[0];
            if (!dailyData[date]) {
                dailyData[date] = {
                    date,
                    bookings: 0,
                    revenue: 0,
                    passengers: 0,
                };
            }
            dailyData[date].bookings += 1;
            if (booking.status === "Confirmed") {
                dailyData[date].revenue += Number(booking.total_fare || 0);
                dailyData[date].passengers += booking.passengers.length;
            }
        });

        const sortedData = Object.values(dailyData).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const chartData = {
            labels: sortedData.map((d) =>
                new Date(d.date).toLocaleDateString()
            ),
            datasets: [
                {
                    label: "Daily Bookings",
                    data: sortedData.map((d) => d.bookings),
                    backgroundColor: "rgba(59, 130, 246, 0.8)",
                    borderColor: "rgb(59, 130, 246)",
                    borderWidth: 1,
                },
            ],
        };

        return {
            chartData,
            tableData: sortedData,
            summary: {
                totalBookings: sortedData.reduce(
                    (sum, d) => sum + d.bookings,
                    0
                ),
                totalRevenue: sortedData.reduce((sum, d) => sum + d.revenue, 0),
                totalPassengers: sortedData.reduce(
                    (sum, d) => sum + d.passengers,
                    0
                ),
                avgBookingsPerDay:
                    sortedData.length > 0
                        ? Math.round(
                              sortedData.reduce(
                                  (sum, d) => sum + d.bookings,
                                  0
                              ) / sortedData.length
                          )
                        : 0,
            },
        };
    };

    const generateRevenueReport = (filteredBookings: Booking[]): ReportData => {
        const confirmedBookings = filteredBookings.filter(
            (b) => b.status === "Confirmed"
        );
        const dailyRevenue: { [key: string]: RevenueData } = {};

        confirmedBookings.forEach((booking) => {
            const date = booking.booking_date.split("T")[0];
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = {
                    date,
                    bookings: 0,
                    revenue: 0,
                    avgTicketPrice: 0,
                };
            }
            dailyRevenue[date].bookings += 1;
            dailyRevenue[date].revenue += Number(booking.total_fare || 0);
        });

        Object.values(dailyRevenue).forEach((data) => {
            data.avgTicketPrice =
                data.bookings > 0 ? data.revenue / data.bookings : 0;
        });

        const sortedData = Object.values(dailyRevenue).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const chartData = {
            labels: sortedData.map((d) =>
                new Date(d.date).toLocaleDateString()
            ),
            datasets: [
                {
                    label: "Daily Revenue (₹)",
                    data: sortedData.map((d) => d.revenue),
                    backgroundColor: "rgba(16, 185, 129, 0.8)",
                    borderColor: "rgb(16, 185, 129)",
                    borderWidth: 1,
                },
            ],
        };

        return {
            chartData,
            tableData: sortedData,
            summary: {
                totalRevenue: sortedData.reduce((sum, d) => sum + d.revenue, 0),
                totalBookings: sortedData.reduce(
                    (sum, d) => sum + d.bookings,
                    0
                ),
                avgDailyRevenue:
                    sortedData.length > 0
                        ? Math.round(
                              sortedData.reduce(
                                  (sum, d) => sum + d.revenue,
                                  0
                              ) / sortedData.length
                          )
                        : 0,
                avgTicketPrice:
                    confirmedBookings.length > 0
                        ? Math.round(
                              sortedData.reduce(
                                  (sum, d) => sum + d.revenue,
                                  0
                              ) / confirmedBookings.length
                          )
                        : 0,
            },
        };
    };

    const generateLoadFactorReport = (
        filteredBookings: Booking[]
    ): ReportData => {
        const confirmedBookings = filteredBookings.filter(
            (b) => b.status === "Confirmed"
        );
        const trainData: { [key: string]: LoadFactorData } = {};

        confirmedBookings.forEach((booking) => {
            const trainKey = `${booking.train_number}-${booking.train_name}`;
            if (!trainData[trainKey]) {
                trainData[trainKey] = {
                    trainName: booking.train_name,
                    trainNumber: booking.train_number,
                    route: `${booking.source} → ${booking.destination}`,
                    totalSeats: 100, // Assuming 100 seats per train (this should come from train data)
                    bookedSeats: 0,
                    loadFactor: 0,
                };
            }
            trainData[trainKey].bookedSeats += booking.passengers.length;
        });

        Object.values(trainData).forEach((data) => {
            data.loadFactor = (data.bookedSeats / data.totalSeats) * 100;
        });

        const sortedData = Object.values(trainData).sort(
            (a, b) => b.loadFactor - a.loadFactor
        );

        const chartData = {
            labels: sortedData.map((d) => `${d.trainNumber}`),
            datasets: [
                {
                    label: "Load Factor (%)",
                    data: sortedData.map((d) => d.loadFactor),
                    backgroundColor: "rgba(245, 158, 11, 0.8)",
                    borderColor: "rgb(245, 158, 11)",
                    borderWidth: 1,
                },
            ],
        };

        return {
            chartData,
            tableData: sortedData,
            summary: {
                avgLoadFactor:
                    sortedData.length > 0
                        ? Math.round(
                              sortedData.reduce(
                                  (sum, d) => sum + d.loadFactor,
                                  0
                              ) / sortedData.length
                          )
                        : 0,
                totalTrains: sortedData.length,
                highPerformingTrains: sortedData.filter(
                    (d) => d.loadFactor > 80
                ).length,
                lowPerformingTrains: sortedData.filter((d) => d.loadFactor < 50)
                    .length,
            },
        };
    };

    const generateUserActivityReport = (
        filteredBookings: Booking[]
    ): ReportData => {
        if (!userReportData) {
            // fallback to empty data if user data is not loaded
            return {
                chartData: {
                    labels: [],
                    datasets: [
                        {
                            label: "Active Users",
                            data: [],
                            backgroundColor: "rgba(139, 92, 246, 0.8)",
                            borderColor: "rgb(139, 92, 246)",
                            borderWidth: 1,
                        },
                    ],
                },
                tableData: [],
                summary: {
                    totalActiveUsers: 0,
                    avgDailyUsers: 0,
                    totalNewRegistrations: 0,
                    peakActivityDay: "N/A",
                },
            };
        }

        // filter user activity data based on the selected date range
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        const filteredActivity = userReportData.dailyActivity.filter(
            (activity) => {
                const activityDate = new Date(activity.date);
                return (
                    activityDate >= startDateObj && activityDate <= endDateObj
                );
            }
        );

        const chartData = {
            labels: filteredActivity.map((d) =>
                new Date(d.date).toLocaleDateString()
            ),
            datasets: [
                {
                    label: "Active Users",
                    data: filteredActivity.map((d) => d.active_users),
                    backgroundColor: "rgba(139, 92, 246, 0.8)",
                    borderColor: "rgb(139, 92, 246)",
                    borderWidth: 1,
                },
            ],
        };

        // calculate unique users from the filtered bookings
        const uniqueUsers = new Set<string>();
        filteredBookings.forEach((booking) => {
            uniqueUsers.add(booking.userId);
        });

        return {
            chartData,
            tableData: filteredActivity.map((activity) => ({
                date: activity.date,
                newRegistrations: activity.new_registrations,
                totalBookings: activity.total_bookings,
                activeUsers: activity.active_users,
            })),
            summary: {
                totalActiveUsers: uniqueUsers.size,
                avgDailyUsers:
                    filteredActivity.length > 0
                        ? Math.round(
                              filteredActivity.reduce(
                                  (sum, d) => sum + d.active_users,
                                  0
                              ) / filteredActivity.length
                          )
                        : 0,
                totalNewRegistrations: filteredActivity.reduce(
                    (sum, d) => sum + d.new_registrations,
                    0
                ),
                peakActivityDay:
                    filteredActivity.length > 0
                        ? new Date(
                              filteredActivity.reduce((max, d) =>
                                  d.active_users > max.active_users ? d : max
                              ).date
                          ).toLocaleDateString()
                        : "N/A",
            },
        };
    };

    const generateCancellationReport = (
        filteredBookings: Booking[]
    ): ReportData => {
        const dailyCancellations: { [key: string]: CancellationData } = {};

        filteredBookings.forEach((booking) => {
            const date = booking.booking_date.split("T")[0];
            if (!dailyCancellations[date]) {
                dailyCancellations[date] = {
                    date,
                    totalBookings: 0,
                    cancelled: 0,
                    cancellationRate: 0,
                    reason: "User Request", // This would come from cancellation data
                };
            }
            dailyCancellations[date].totalBookings += 1;
            if (booking.status === "Cancelled") {
                dailyCancellations[date].cancelled += 1;
            }
        });

        Object.values(dailyCancellations).forEach((data) => {
            data.cancellationRate =
                data.totalBookings > 0
                    ? (data.cancelled / data.totalBookings) * 100
                    : 0;
        });

        const sortedData = Object.values(dailyCancellations).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const chartData = {
            labels: sortedData.map((d) =>
                new Date(d.date).toLocaleDateString()
            ),
            datasets: [
                {
                    label: "Cancellation Rate (%)",
                    data: sortedData.map((d) => d.cancellationRate),
                    backgroundColor: "rgba(239, 68, 68, 0.8)",
                    borderColor: "rgb(239, 68, 68)",
                    borderWidth: 1,
                },
            ],
        };

        return {
            chartData,
            tableData: sortedData,
            summary: {
                totalCancellations: sortedData.reduce(
                    (sum, d) => sum + d.cancelled,
                    0
                ),
                avgCancellationRate:
                    sortedData.length > 0
                        ? Math.round(
                              sortedData.reduce(
                                  (sum, d) => sum + d.cancellationRate,
                                  0
                              ) / sortedData.length
                          )
                        : 0,
                worstDay:
                    sortedData.length > 0
                        ? sortedData.reduce((max, d) =>
                              d.cancellationRate > max.cancellationRate
                                  ? d
                                  : max
                          ).date
                        : "N/A",
                totalBookings: sortedData.reduce(
                    (sum, d) => sum + d.totalBookings,
                    0
                ),
            },
        };
    };

    const generateTrainPerformanceReport = (
        filteredBookings: Booking[]
    ): ReportData => {
        const confirmedBookings = filteredBookings.filter(
            (b) => b.status === "Confirmed"
        );
        const trainPerformance: { [key: string]: TrainPerformanceData } = {};

        confirmedBookings.forEach((booking) => {
            const trainKey = `${booking.train_number}-${booking.train_name}`;
            if (!trainPerformance[trainKey]) {
                trainPerformance[trainKey] = {
                    trainName: booking.train_name,
                    trainNumber: booking.train_number,
                    totalTrips: 0,
                    revenue: 0,
                    avgLoadFactor: 0,
                    popularity: 0,
                };
            }
            trainPerformance[trainKey].totalTrips += 1;
            trainPerformance[trainKey].revenue += Number(
                booking.total_fare || 0
            );
            trainPerformance[trainKey].popularity += booking.passengers.length;
        });

        Object.values(trainPerformance).forEach((data) => {
            data.avgLoadFactor = Math.min(
                (data.popularity / (data.totalTrips * 100)) * 100,
                100
            );
        });

        const sortedData = Object.values(trainPerformance).sort(
            (a, b) => b.revenue - a.revenue
        );

        const chartData = {
            labels: sortedData.map((d) => d.trainNumber),
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: sortedData.map((d) => d.revenue),
                    backgroundColor: "rgba(16, 185, 129, 0.8)",
                    borderColor: "rgb(16, 185, 129)",
                    borderWidth: 1,
                },
            ],
        };

        return {
            chartData,
            tableData: sortedData,
            summary: {
                totalRevenue: sortedData.reduce((sum, d) => sum + d.revenue, 0),
                totalTrips: sortedData.reduce(
                    (sum, d) => sum + d.totalTrips,
                    0
                ),
                avgPerformance:
                    sortedData.length > 0
                        ? Math.round(
                              sortedData.reduce(
                                  (sum, d) => sum + d.avgLoadFactor,
                                  0
                              ) / sortedData.length
                          )
                        : 0,
                topPerformer:
                    sortedData.length > 0
                        ? `${sortedData[0].trainNumber} - ${sortedData[0].trainName}`
                        : "N/A",
            },
        };
    };

    const handleGenerateReport = async () => {
        if (!selectedReport || !startDate || !endDate) {
            alert("Please select a report type and date range");
            return;
        }

        setIsGenerating(true);

        try {
            const filteredBookings = filterBookingsByDateRange(bookings);
            let data: ReportData;

            switch (selectedReport) {
                case "daily-booking":
                    data = generateDailyBookingReport(filteredBookings);
                    break;
                case "revenue":
                    data = generateRevenueReport(filteredBookings);
                    break;
                case "load-factor":
                    data = generateLoadFactorReport(filteredBookings);
                    break;
                case "user-activity":
                    data = generateUserActivityReport(filteredBookings);
                    break;
                case "cancellation":
                    data = generateCancellationReport(filteredBookings);
                    break;
                case "train-performance":
                    data = generateTrainPerformanceReport(filteredBookings);
                    break;
                default:
                    throw new Error("Invalid report type");
            }

            setReportData(data);
            setShowPreview(true);
        } catch (error) {
            console.error("Error generating report:", error);
            alert("Error generating report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadPDF = () => {
        if (!reportData || !selectedReport) return;

        const doc = new jsPDF();
        const reportType = reportTypes.find((r) => r.id === selectedReport);

        // add title
        doc.setFontSize(16);
        doc.text(reportType?.name || "Report", 20, 20);

        // add date range
        doc.setFontSize(12);
        doc.text(
            `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(
                endDate
            ).toLocaleDateString()}`,
            20,
            35
        );

        // add summary
        let yPos = 50;
        doc.setFontSize(14);
        doc.text("Summary:", 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        Object.entries(reportData.summary).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`, 20, yPos);
            yPos += 8;
        });

        // add table
        const tableColumns = getTableColumns(selectedReport);
        const tableRows = getTableRows(selectedReport, reportData.tableData);

        autoTable(doc, {
            startY: yPos + 10,
            head: [tableColumns],
            body: tableRows,
            theme: "striped",
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(
            `${reportType?.name.replace(
                " ",
                "_"
            )}_${startDate}_to_${endDate}.pdf`
        );
    };

    const downloadCSV = () => {
        if (!reportData || !selectedReport) return;

        const reportType = reportTypes.find((r) => r.id === selectedReport);
        const columns = getTableColumns(selectedReport);
        const rows = getTableRows(selectedReport, reportData.tableData);

        let csvContent = columns.join(",") + "\n";
        rows.forEach((row) => {
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
            "download",
            `${reportType?.name.replace(
                " ",
                "_"
            )}_${startDate}_to_${endDate}.csv`
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadExcel = () => {
        if (!reportData || !selectedReport) return;

        const reportType = reportTypes.find((r) => r.id === selectedReport);
        const columns = getTableColumns(selectedReport);
        const rows = getTableRows(selectedReport, reportData.tableData);

        const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

        XLSX.writeFile(
            workbook,
            `${reportType?.name.replace(
                " ",
                "_"
            )}_${startDate}_to_${endDate}.xlsx`
        );
    };

    const handleDownload = (format: "pdf" | "csv" | "excel") => {
        switch (format) {
            case "pdf":
                downloadPDF();
                break;
            case "csv":
                downloadCSV();
                break;
            case "excel":
                downloadExcel();
                break;
        }
    };

    const getTableColumns = (reportType: string): string[] => {
        switch (reportType) {
            case "daily-booking":
                return ["Date", "Bookings", "Revenue (₹)", "Passengers"];
            case "revenue":
                return [
                    "Date",
                    "Bookings",
                    "Revenue (₹)",
                    "Avg Ticket Price (₹)",
                ];
            case "load-factor":
                return [
                    "Train Number",
                    "Train Name",
                    "Route",
                    "Total Seats",
                    "Booked Seats",
                    "Load Factor (%)",
                ];
            case "user-activity":
                return [
                    "Date",
                    "New Registrations",
                    "Total Bookings",
                    "Active Users",
                ];
            case "cancellation":
                return [
                    "Date",
                    "Total Bookings",
                    "Cancelled",
                    "Cancellation Rate (%)",
                    "Main Reason",
                ];
            case "train-performance":
                return [
                    "Train Number",
                    "Train Name",
                    "Total Trips",
                    "Revenue (₹)",
                    "Avg Load Factor (%)",
                    "Popularity Score",
                ];
            default:
                return [];
        }
    };

    const getTableRows = (reportType: string, data: any[]): any[][] => {
        switch (reportType) {
            case "daily-booking":
                return data.map((item: DailyBookingData) => [
                    new Date(item.date).toLocaleDateString(),
                    item.bookings,
                    Math.round(item.revenue),
                    item.passengers,
                ]);
            case "revenue":
                return data.map((item: RevenueData) => [
                    new Date(item.date).toLocaleDateString(),
                    item.bookings,
                    Math.round(item.revenue),
                    Math.round(item.avgTicketPrice),
                ]);
            case "load-factor":
                return data.map((item: LoadFactorData) => [
                    item.trainNumber,
                    item.trainName,
                    item.route,
                    item.totalSeats,
                    item.bookedSeats,
                    Math.round(item.loadFactor * 100) / 100,
                ]);
            case "user-activity":
                return data.map((item: UserActivityData) => [
                    new Date(item.date).toLocaleDateString(),
                    item.newRegistrations,
                    item.totalBookings,
                    item.activeUsers,
                ]);
            case "cancellation":
                return data.map((item: CancellationData) => [
                    new Date(item.date).toLocaleDateString(),
                    item.totalBookings,
                    item.cancelled,
                    Math.round(item.cancellationRate * 100) / 100,
                    item.reason,
                ]);
            case "train-performance":
                return data.map((item: TrainPerformanceData) => [
                    item.trainNumber,
                    item.trainName,
                    item.totalTrips,
                    Math.round(item.revenue),
                    Math.round(item.avgLoadFactor * 100) / 100,
                    Math.round(item.popularity),
                ]);
            default:
                return [];
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Reports
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Generate and download various reports
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Report Selection Panel */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Select Report Type
                            </h2>

                            <div className="space-y-3">
                                {reportTypes.map((report) => (
                                    <div
                                        key={report.id}
                                        className={`flex items-start p-3 rounded-md cursor-pointer transition-colors ${
                                            selectedReport === report.id
                                                ? "bg-primary-light/10 border border-primary"
                                                : "border border-gray-200 hover:bg-gray-50"
                                        }`}
                                        onClick={() =>
                                            setSelectedReport(report.id)
                                        }
                                    >
                                        <div
                                            className={`p-2 rounded-full mr-3 ${
                                                selectedReport === report.id
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            <report.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3
                                                className={`font-medium ${
                                                    selectedReport === report.id
                                                        ? "text-primary"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {report.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {report.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Report Parameters */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Report Parameters
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label
                                        htmlFor="startDate"
                                        className="form-label"
                                    >
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        id="startDate"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        className="form-input"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="endDate"
                                        className="form-label"
                                    >
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        id="endDate"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        className="form-input"
                                        min={startDate}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={
                                        !selectedReport ||
                                        !startDate ||
                                        !endDate ||
                                        isGenerating
                                    }
                                    className="btn btn-primary flex items-center"
                                >
                                    {isGenerating ? (
                                        <>
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
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <BarChart2 className="h-5 w-5 mr-2" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Report Preview */}
                        {showPreview && (
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {
                                            reportTypes.find(
                                                (r) => r.id === selectedReport
                                            )?.name
                                        }{" "}
                                        Preview
                                    </h2>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() =>
                                                handleDownload("pdf")
                                            }
                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors flex items-center"
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            PDF
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDownload("csv")
                                            }
                                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center"
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            CSV
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDownload("excel")
                                            }
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                            Excel
                                        </button>
                                    </div>
                                </div>

                                <div className="border rounded-lg p-4">
                                    <div className="text-center mb-4">
                                        <h3 className="font-bold">
                                            {
                                                reportTypes.find(
                                                    (r) =>
                                                        r.id === selectedReport
                                                )?.name
                                            }
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Period:{" "}
                                            {new Date(
                                                startDate
                                            ).toLocaleDateString()}{" "}
                                            to{" "}
                                            {new Date(
                                                endDate
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    {/* Real Report Content */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div className="h-64 bg-white rounded-lg p-4 border">
                                            {reportData?.chartData ? (
                                                <Bar
                                                    data={reportData.chartData}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio:
                                                            false,
                                                        plugins: {
                                                            legend: {
                                                                display: false,
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: `${
                                                                    reportTypes.find(
                                                                        (r) =>
                                                                            r.id ===
                                                                            selectedReport
                                                                    )?.name
                                                                } Trend`,
                                                            },
                                                        },
                                                        scales: {
                                                            y: {
                                                                beginAtZero:
                                                                    true,
                                                            },
                                                        },
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-gray-500">
                                                            Chart Loading...
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-64 bg-white rounded-lg p-4 border">
                                            {reportData?.summary ? (
                                                <div className="h-full flex flex-col">
                                                    <h4 className="font-semibold mb-4 text-center">
                                                        Report Summary
                                                    </h4>
                                                    <div className="flex-1 space-y-3">
                                                        {Object.entries(
                                                            reportData.summary
                                                        ).map(
                                                            ([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className="flex justify-between items-center py-2 border-b border-gray-100"
                                                                >
                                                                    <span className="text-sm text-gray-600 capitalize">
                                                                        {key
                                                                            .replace(
                                                                                /([A-Z])/g,
                                                                                " $1"
                                                                            )
                                                                            .trim()}
                                                                        :
                                                                    </span>
                                                                    <span className="font-medium text-xs">
                                                                        {typeof value ===
                                                                            "number" &&
                                                                        (key.includes(
                                                                            "revenue"
                                                                        ) ||
                                                                            key.includes(
                                                                                "Revenue"
                                                                            ) ||
                                                                            key.includes(
                                                                                "Price"
                                                                            ))
                                                                            ? `₹${(
                                                                                  value as number
                                                                              ).toLocaleString()}`
                                                                            : typeof value ===
                                                                                  "number" &&
                                                                              (key.includes(
                                                                                  "rate"
                                                                              ) ||
                                                                                  key.includes(
                                                                                      "Rate"
                                                                                  ) ||
                                                                                  key.includes(
                                                                                      "factor"
                                                                                  ) ||
                                                                                  key.includes(
                                                                                      "Factor"
                                                                                  ))
                                                                            ? `${value}%`
                                                                            : typeof value ===
                                                                              "number"
                                                                            ? (
                                                                                  value as number
                                                                              ).toLocaleString()
                                                                            : typeof value ===
                                                                              "string"
                                                                            ? value
                                                                            : String(
                                                                                  value
                                                                              )}
                                                                    </span>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <div className="text-center">
                                                        <Pie className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-gray-500">
                                                            Summary Loading...
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    {selectedReport &&
                                                        getTableColumns(
                                                            selectedReport
                                                        ).map((column) => (
                                                            <th
                                                                key={column}
                                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                                            >
                                                                {column}
                                                            </th>
                                                        ))}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reportData?.tableData &&
                                                reportData.tableData.length >
                                                    0 ? (
                                                    getTableRows(
                                                        selectedReport,
                                                        reportData.tableData
                                                    )
                                                        .slice(0, 10)
                                                        .map((row, index) => (
                                                            <tr
                                                                key={index}
                                                                className="hover:bg-gray-50"
                                                            >
                                                                {row.map(
                                                                    (
                                                                        cell,
                                                                        cellIndex
                                                                    ) => (
                                                                        <td
                                                                            key={
                                                                                cellIndex
                                                                            }
                                                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                                        >
                                                                            {
                                                                                cell
                                                                            }
                                                                        </td>
                                                                    )
                                                                )}
                                                            </tr>
                                                        ))
                                                ) : (
                                                    <tr>
                                                        <td
                                                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                                            colSpan={10}
                                                        >
                                                            {reportData
                                                                ? "No data available for the selected date range"
                                                                : "Generate a report to see data here"}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        {reportData?.tableData &&
                                            reportData.tableData.length >
                                                10 && (
                                                <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500 text-center">
                                                    Showing first 10 rows.
                                                    Download full report to see
                                                    all data.
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
