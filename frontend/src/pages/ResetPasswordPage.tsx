import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Lock, ArrowLeft, KeyRound } from "lucide-react";
import { authService } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const { isAuthenticated } = useAuth();

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [userEmail, setUserEmail] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
            return;
        }
    }, [isAuthenticated, navigate]);

    // verify token on component mount
    useEffect(() => {
        if (!token) {
            toast.error("Invalid reset link");
            navigate("/forgot-password");
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await authService.verifyResetToken(token);
                setIsValidToken(true);
                setUserEmail(response.email);
            } catch (error: any) {
                setIsValidToken(false);
            }
        };

        verifyToken();
    }, [token, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.newPassword) {
            toast.error("New password is required");
            return;
        }

        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (!token) {
            toast.error("Invalid reset token");
            return;
        }

        setIsLoading(true);

        try {
            await authService.resetPassword(token, formData.newPassword);
            toast.success("Password reset successfully!");
            navigate("/login");
        } catch (error: any) {
            toast.error(error.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    // show loading state while verifying token
    if (isValidToken === null) {
        return (
            <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 fade-in">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="animate-spin mx-auto h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
                        <p className="mt-4 text-gray-600">
                            Verifying reset link...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // show error state for invalid token
    if (isValidToken === false) {
        return (
            <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 fade-in">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 text-red-500">
                            <KeyRound className="h-12 w-12" />
                        </div>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">
                            Invalid Reset Link
                        </h2>
                        <p className="mt-2 text-gray-600">
                            This password reset link is invalid or has expired.
                        </p>
                        <div className="mt-6">
                            <Link
                                to="/forgot-password"
                                className="btn btn-primary"
                            >
                                Request New Reset Link
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 fade-in">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Enter your new password for{" "}
                        <span className="text-primary-light">{userEmail}</span>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
