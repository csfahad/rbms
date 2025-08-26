import React from "react";

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({
    className = "",
    showText = true,
    size = "md",
}) => {
    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    const textSizeClasses = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl",
    };

    return (
        <div className={`flex items-center ${className}`}>
            <div className={`${sizeClasses[size]} relative`}>
                <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <defs>
                        <linearGradient
                            id="logoGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                    </defs>

                    <rect
                        x="2"
                        y="2"
                        width="28"
                        height="28"
                        rx="8"
                        fill="url(#logoGradient)"
                    />

                    <g transform="translate(6, 10)">
                        {/* Train body */}
                        <rect
                            x="2"
                            y="4"
                            width="16"
                            height="4"
                            fill="white"
                            rx="2"
                        />

                        <circle cx="2" cy="6" r="2" fill="white" />

                        <rect
                            x="5"
                            y="5"
                            width="2"
                            height="1"
                            fill="#2563EB"
                            rx="0.5"
                        />
                        <rect
                            x="8"
                            y="5"
                            width="2"
                            height="1"
                            fill="#2563EB"
                            rx="0.5"
                        />
                        <rect
                            x="11"
                            y="5"
                            width="2"
                            height="1"
                            fill="#2563EB"
                            rx="0.5"
                        />
                        <rect
                            x="14"
                            y="5"
                            width="2"
                            height="1"
                            fill="#2563EB"
                            rx="0.5"
                        />

                        <circle cx="6" cy="9" r="1" fill="#64748B" />
                        <circle cx="10" cy="9" r="1" fill="#64748B" />
                        <circle cx="14" cy="9" r="1" fill="#64748B" />

                        <rect
                            x="0"
                            y="10"
                            width="20"
                            height="1"
                            fill="white"
                            opacity="0.6"
                            rx="0.5"
                        />
                    </g>
                </svg>
            </div>

            {showText && (
                <div className="ml-2">
                    <span
                        className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${textSizeClasses[size]}`}
                    >
                        Rail
                    </span>
                    <span
                        className={`font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent ${textSizeClasses[size]}`}
                    >
                        Buddy
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
