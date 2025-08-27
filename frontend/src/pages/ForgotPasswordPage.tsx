import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail } from "lucide-react";
import { authService } from "../services/authService";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter your email address");
            return;
        }

        setIsLoading(true);

        try {
            await authService.forgotPassword(email);
            toast.success("Password reset OTP sent to your email!");
            navigate("/reset-password", { state: { email } });
        } catch (error: any) {
            toast.error(error.message || "Failed to send password reset OTP");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-16rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 fade-in">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Forgot Password
                    </h2>
                    <p className="mt-2 text-gray-600">
                        Enter your email address and we'll send you an OTP to
                        reset your password
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
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="form-input pl-10"
                                placeholder="Enter your email address"
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
                                    <Mail className="h-5 w-5" />
                                    Send Reset OTP
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
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
