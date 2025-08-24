/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "rgb(26, 35, 126)", // Deep Blue
                    light: "rgb(63, 81, 181)", // Lighter Blue
                },
                accent: {
                    DEFAULT: "rgb(211, 47, 47)", // Railway Red
                },
                success: {
                    DEFAULT: "rgb(56, 142, 60)", // Green
                },
                warning: {
                    DEFAULT: "rgb(255, 160, 0)", // Amber
                },
                error: {
                    DEFAULT: "rgb(213, 0, 0)", // Error Red
                },
            },
            fontFamily: {
                sans: [
                    "Inter",
                    "ui-sans-serif",
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "sans-serif",
                ],
            },
        },
    },
    plugins: [],
};
