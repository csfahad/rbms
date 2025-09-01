import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { authService } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

const VerifyOtpPage: React.FC = () => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithData, isAuthenticated } = useAuth();

    // get email and registration data from navigation state
    const email = location.state?.email;
    const registrationData = location.state?.registrationData;

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
            return;
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!email || !registrationData) {
            navigate("/register");
            return;
        }

        // focus first input on mount
        inputRefs.current[0]?.focus();
    }, [email, registrationData, navigate]);

    useEffect(() => {
        // cooldown timer for resend
        if (resendCooldown > 0) {
            const timer = setTimeout(
                () => setResendCooldown(resendCooldown - 1),
                1000
            );
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleInputChange = (index: number, value: string) => {
        if (value.length > 1) return; // only allow single digit

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            // focus previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < 6; i++) {
            newOtp[i] = pastedData[i] || "";
        }

        setOtp(newOtp);

        // focus the next empty input or last input
        const nextEmptyIndex = newOtp.findIndex((digit) => !digit);
        const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
        inputRefs.current[focusIndex]?.focus();
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        const otpString = otp.join("");
        if (otpString.length !== 6) {
            toast.error("Please enter all 6 digits");
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.verifyOtp(
                email,
                otpString,
                registrationData
            );
            toast.success("Account created successfully!");
            loginWithData(response.user);

            // check if there's a saved redirect path
            const redirectPath = localStorage.getItem("redirectAfterLogin");
            console.log(
                "VerifyOtpPage - redirectPath from localStorage:",
                redirectPath
            );
            if (redirectPath) {
                localStorage.removeItem("redirectAfterLogin");
                navigate(redirectPath);
            } else {
                navigate("/user/dashboard");
            }
        } catch (error: any) {
            toast.error(error.message || "Invalid OTP. Please try again.");
            // clear OTP on error
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;

        try {
            await authService.sendOtp(email);
            toast.success("OTP sent successfully!");
            setResendCooldown(60); // 60 second cooldown
        } catch (error: any) {
            toast.error(error.message || "Failed to resend OTP");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Verify Your Email
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We've sent a 6-digit code to
                    </p>
                    <p className="font-medium text-[#1A237E]">{email}</p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                Enter verification code
                            </label>
                            <div className="flex justify-center space-x-2">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) =>
                                            (inputRefs.current[index] = el)
                                        }
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleInputChange(
                                                index,
                                                e.target.value
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(index, e)
                                        }
                                        onPaste={handlePaste}
                                        className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3F51B5] focus:border-[#3F51B5] outline-none transition-colors"
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={
                                    isLoading || otp.join("").length !== 6
                                }
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1A237E] hover:bg-[#3F51B5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3F51B5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Verifying...
                                    </div>
                                ) : (
                                    "Verify & Create Account"
                                )}
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Didn't receive the code?{" "}
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0}
                                    className="font-medium text-[#1A237E] hover:text-[#3F51B5] disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {resendCooldown > 0
                                        ? `Resend in ${resendCooldown}s`
                                        : "Resend OTP"}
                                </button>
                            </p>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate("/register")}
                                className="text-sm text-gray-600 hover:text-gray-900"
                            >
                                ← Back to registration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtpPage;
