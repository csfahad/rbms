import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import SearchTrainsPage from "./pages/SearchTrainsPage";
import BookingPage from "./pages/BookingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTrains from "./pages/admin/AdminTrains";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminReports from "./pages/admin/AdminReports";
import AddTrain from "./pages/admin/AddTrain";
import EditTrain from "./pages/admin/EditTrain";
import UserDashboard from "./pages/user/UserDashboard";
import UserBookings from "./pages/user/UserBookings";
import UserProfile from "./pages/user/UserProfile";
import SupportPage from "./pages/SupportPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

function App() {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/verify-otp" element={<VerifyOtpPage />} />
                    <Route path="/search" element={<SearchTrainsPage />} />
                    <Route path="/support" element={<SupportPage />} />

                    {/* User Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route
                            path="/booking/:trainId"
                            element={<BookingPage />}
                        />
                        <Route
                            path="/user/dashboard"
                            element={<UserDashboard />}
                        />
                        <Route
                            path="/user/bookings"
                            element={<UserBookings />}
                        />
                        <Route path="/user/profile" element={<UserProfile />} />
                    </Route>

                    {/* Admin Protected Routes */}
                    <Route element={<AdminRoute />}>
                        <Route
                            path="/admin/dashboard"
                            element={<AdminDashboard />}
                        />
                        <Route path="/admin/trains" element={<AdminTrains />} />
                        <Route
                            path="/admin/trains/add"
                            element={<AddTrain />}
                        />
                        <Route
                            path="/admin/trains/edit/:id"
                            element={<EditTrain />}
                        />
                        <Route
                            path="/admin/bookings"
                            element={<AdminBookings />}
                        />
                        <Route
                            path="/admin/reports"
                            element={<AdminReports />}
                        />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            <Footer />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: "#333",
                        color: "#fff",
                    },
                }}
            />
        </div>
    );
}

export default App;
