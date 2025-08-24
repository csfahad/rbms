import { Link } from "react-router-dom";
import {
    Train,
    Search,
    Calendar,
    CreditCard,
    Clock,
    CalendarIcon,
    SearchIcon,
    TrainIcon,
} from "lucide-react";

const HomePage = () => {
    return (
        <div className="fade-in">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-primary to-primary-light text-white py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                                Book Your Railway Journey With Ease
                            </h1>
                            <p className="text-lg md:text-xl mb-8 text-gray-100">
                                Fast, secure, and convenient online railway
                                ticket booking platform for your travel needs.
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <Link
                                    to="/search"
                                    className="btn bg-white text-primary hover:bg-gray-100 transition-colors"
                                >
                                    Search Trains
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn bg-accent text-white hover:bg-accent/90 transition-colors"
                                >
                                    Register Now
                                </Link>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center md:justify-end">
                            <img
                                src="https://img.onmanorama.com/content/dam/mm/en/travel/travel-news/images/2025/1/3/new-trivandrum-kasaragod-vande-bharat-20-coach.jpg?w=1120&h=583"
                                alt="Railway Train"
                                className="rounded-lg shadow-2xl max-w-full h-auto"
                                style={{ maxHeight: "400px" }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Why Choose RailBooking?
                        </h2>
                        <p className="mt-4 text-xl text-gray-600">
                            Designed to make your travel planning seamless and
                            efficient
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex justify-center mb-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Search className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-center mb-2">
                                Easy Search
                            </h3>
                            <p className="text-gray-600 text-center">
                                Quickly find trains with our intelligent search
                                system featuring station auto-suggestions.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex justify-center mb-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Train className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-center mb-2">
                                Multiple Classes
                            </h3>
                            <p className="text-gray-600 text-center">
                                Book tickets in various classes - Sleeper, 3AC,
                                2AC, and 1AC as per your comfort and budget.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex justify-center mb-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <Calendar className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-center mb-2">
                                Instant Booking
                            </h3>
                            <p className="text-gray-600 text-center">
                                Secure your seats instantly with our efficient
                                booking system and get immediate confirmation.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex justify-center mb-4">
                                <div className="bg-primary/10 p-3 rounded-full">
                                    <CreditCard className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-center mb-2">
                                Secure Payments
                            </h3>
                            <p className="text-gray-600 text-center">
                                Safe and hassle-free payment options to complete
                                your booking process securely.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">
                            How It Works
                        </h2>
                        <p className="mt-4 text-xl text-gray-600">
                            Simple steps to book your railway tickets online
                        </p>
                    </div>

                    <div className="relative">
                        {/* Connector Line (visible on md and larger screens) */}
                        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            <div className="flex flex-col items-center">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4">
                                    1
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    Search
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Enter source, destination and date to find
                                    available trains
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4">
                                    2
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    Select
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Choose your preferred train and class based
                                    on availability
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4">
                                    3
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    Book
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Enter passenger details and select your
                                    seats
                                </p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4">
                                    4
                                </div>
                                <h3 className="text-lg font-semibold mb-2">
                                    Pay
                                </h3>
                                <p className="text-gray-600 text-center">
                                    Complete secure payment and receive your
                                    e-ticket
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-8 md:mb-0 md:mr-8">
                            <h2 className="text-3xl font-bold mb-4">
                                Ready to Book Your Journey?
                            </h2>
                            <p className="text-xl text-gray-300">
                                Join thousands of travelers who book their
                                railway tickets hassle-free through our
                                platform.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                            <Link
                                to="/search"
                                className="btn bg-white text-primary hover:bg-gray-100 transition-colors"
                            >
                                Search Trains
                            </Link>
                            <Link
                                to="/register"
                                className="btn bg-accent text-white hover:bg-accent/90 transition-colors"
                            >
                                Register Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
