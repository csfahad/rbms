import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, ArrowLeft, KeyRound } from "lucide-react";
import { authService } from "../services/authService";

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const emailFromState = location.state?.email || "";

    const [formData, setFormData] = useState({
        email: emailFromState,
        otp: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            toast.error("Email address is required");
            return;
        }

        if (!formData.otp.trim()) {
            toast.error("OTP is required");
            return;
        }

        if (formData.otp.length !== 6) {
            toast.error("OTP must be 6 digits");
            return;
        }

        if (!formData.newPassword) {
            toast.error("New password is required");
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(
                formData.email,
                formData.otp,
                formData.newPassword
            );
            toast.success(
                "Password reset successfully! Please login with your new password."
            );
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Password reset failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!formData.email.trim()) {
            toast.error("Please enter your email address first");
            return;
        }

        try {
            await authService.forgotPassword(formData.email);
            toast.success("New OTP sent to your email!");
        } catch (error: any) {
            toast.error(error.message || "Failed to resend OTP");
        }
    };

    return (
        <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 fade-in">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Enter the OTP sent to your email and set a new password
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="Enter your email address"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="otp" className="form-label">
                            OTP Code
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyRound className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="otp"
                                name="otp"
                                type="text"
                                maxLength={6}
                                required
                                value={formData.otp}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="Enter 6-digit OTP"
                            />
                        </div>
                        <div className="mt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                className="text-sm text-primary hover:text-primary-light transition-colors"
                            >
                                Resend OTP
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="form-label">
                            New Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="Enter new password"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="form-label">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Lock className="h-5 w-5" />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                            Remember your password?{" "}
                            <Link
                                to="/login"
                                className="font-medium text-primary hover:text-primary-light transition-colors"
                            >
                                Back to Login
                            </Link>
                        </p>
                    </div>
                </form>

                <div className="mt-6">
                    <Link
                        to="/forgot-password"
                        className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Forgot Password
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
