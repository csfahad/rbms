import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Train,
    Search,
    Calendar,
    CreditCard,
    ArrowRight,
    Repeat,
    Info,
} from "lucide-react";
import StationAutocomplete from "../components/search/StationAutocomplete";
import { Station } from "../services/trainService";

const HomePage = () => {
    const navigate = useNavigate();
    const [searchForm, setSearchForm] = useState({
        from: "",
        to: "",
        journeyDate: "",
        class: "All",
    });
    const [sourceStation, setSourceStation] = useState<Station | null>(null);
    const [destinationStation, setDestinationStation] =
        useState<Station | null>(null);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setSearchForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceStation || !destinationStation) {
            alert("Please select valid source and destination stations");
            return;
        }

        if (!searchForm.journeyDate) {
            alert("Please select a journey date");
            return;
        }

        navigate(
            `/search?from=${sourceStation.code}&to=${destinationStation.code}&date=${searchForm.journeyDate}`
        );
    };

    const handleSwap = () => {
        const tempFrom = searchForm.from;
        const tempSourceStation = sourceStation;

        setSearchForm((prev) => ({
            ...prev,
            from: prev.to,
            to: tempFrom,
        }));

        setSourceStation(destinationStation);
        setDestinationStation(tempSourceStation);
    };

    const classOptions = [
        { value: "All", label: "All Classes" },
        { value: "SLEEPER", label: "Sleeper" },
        { value: "AC_3_TIER", label: "AC 3 Tier" },
        { value: "AC_2_TIER", label: "AC 2 Tier" },
        { value: "AC_FIRST_CLASS", label: "AC First Class" },
    ];

    return (
        <div className="min-h-screen">
            {/* Beta Info Banner */}
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
                    <Info className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-sm text-primary-light text-center">
                        <span className="font-semibold">Beta Version:</span>{" "}
                        This website is currently in beta version. Only popular
                        route trains are available for now. See{" "}
                        <button
                            onClick={() => navigate("/search")}
                            className="text-primary hover:text-primary-light underline font-medium"
                        >
                            Search Page
                        </button>{" "}
                        for more information.
                    </p>
                </div>
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="./train.avif"
                        alt="ICF Train"
                        className="w-full h-full object-cover"
                        style={{ objectPosition: "98% center" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/60 to-white/70"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
                    <div className="text-center text-gray-900 mb-12 lg:mb-16">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 lg:mb-6 ">
                            Book Your Railway Journey With{" "}
                            <span className="text-orange-500">Ease</span>
                        </h1>
                        <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-4xl mx-auto">
                            Fast, secure, and convenient online railway ticket
                            booking platform for your travel needs.
                        </p>
                    </div>

                    <div className="flex justify-center">
                        <div className="w-full max-w-2xl">
                            {/* Search Form */}
                            <form
                                onSubmit={handleSearch}
                                className="bg-white/95 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl p-6 lg:p-8 border border-gray-200"
                            >
                                <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6">
                                    Search Trains
                                </h3>
                                <div className="space-y-4 lg:space-y-6">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                                        {/* From Station */}
                                        <div className="flex-1 w-full">
                                            <StationAutocomplete
                                                label="From (Source)"
                                                placeholder="Enter source station"
                                                value={searchForm.from}
                                                onChange={(value) =>
                                                    setSearchForm((prev) => ({
                                                        ...prev,
                                                        from: value,
                                                    }))
                                                }
                                                onStationSelect={(station) => {
                                                    setSourceStation(station);
                                                    setSearchForm((prev) => ({
                                                        ...prev,
                                                        from: `${station.name} (${station.code})`,
                                                    }));
                                                }}
                                            />
                                        </div>

                                        {/* Swap Button */}
                                        <div className="flex justify-center sm:items-end sm:justify-center">
                                            <button
                                                type="button"
                                                onClick={handleSwap}
                                                disabled={
                                                    !sourceStation ||
                                                    !destinationStation
                                                }
                                                className="h-12 w-12 sm:mb-0 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                                title="Swap Stations"
                                            >
                                                <Repeat className="h-5 w-5" />
                                            </button>
                                        </div>

                                        {/* To Station */}
                                        <div className="flex-1 w-full">
                                            <StationAutocomplete
                                                label="To (Destination)"
                                                placeholder="Enter destination station"
                                                value={searchForm.to}
                                                onChange={(value) =>
                                                    setSearchForm((prev) => ({
                                                        ...prev,
                                                        to: value,
                                                    }))
                                                }
                                                onStationSelect={(station) => {
                                                    setDestinationStation(
                                                        station
                                                    );
                                                    setSearchForm((prev) => ({
                                                        ...prev,
                                                        to: `${station.name} (${station.code})`,
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Journey Date */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Journey Date
                                            </label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <input
                                                    type="date"
                                                    name="journeyDate"
                                                    value={
                                                        searchForm.journeyDate
                                                    }
                                                    onChange={handleInputChange}
                                                    min={
                                                        new Date()
                                                            .toISOString()
                                                            .split("T")[0]
                                                    }
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Class Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Class
                                            </label>
                                            <div className="relative">
                                                <Train className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                <select
                                                    name="class"
                                                    value={searchForm.class}
                                                    onChange={handleInputChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm lg:text-base"
                                                >
                                                    {classOptions.map(
                                                        (option) => (
                                                            <option
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search Button */}
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-[#3F51B5] to-[#1a237e] text-white py-3 lg:py-4 px-6 rounded-lg lg:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center space-x-2 text-base lg:text-lg font-semibold shadow-lg hover:shadow-xl"
                                    >
                                        <Search className="h-5 w-5" />
                                        <span>Search Trains</span>
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Why Choose RailBooking?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Designed to make your travel planning seamless and
                            efficient with cutting-edge technology
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Search,
                                title: "Easy Search",
                                description:
                                    "Quickly find trains with our intelligent search system featuring station auto-suggestions and real-time availability.",
                            },
                            {
                                icon: Train,
                                title: "Multiple Classes",
                                description:
                                    "Book tickets in various classes - Sleeper, 3AC, 2AC, and 1AC as per your comfort and budget preferences.",
                            },
                            {
                                icon: Calendar,
                                title: "Instant Booking",
                                description:
                                    "Secure your seats instantly with our efficient booking system and get immediate confirmation via email and SMS.",
                            },
                            {
                                icon: CreditCard,
                                title: "Secure Payments",
                                description:
                                    "Safe and hassle-free payment options with multiple gateways to complete your booking process securely.",
                            },
                        ].map((feature, index) => (
                            <div key={index} className="group">
                                <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full">
                                    <div className="flex justify-center mb-6">
                                        <div className="bg-gradient-to-br from-primary to-indigo-600 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                                            <feature.icon className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-center mb-4 text-gray-900">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 text-center leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Simple and intuitive steps to book your railway
                            tickets online in just a few minutes
                        </p>
                    </div>

                    <div className="relative">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                            {[
                                {
                                    step: 1,
                                    title: "Search",
                                    description:
                                        "Enter source, destination and date to find available trains with real-time seat availability",
                                },
                                {
                                    step: 2,
                                    title: "Select",
                                    description:
                                        "Choose your preferred train and class based on availability, timing and your budget",
                                },
                                {
                                    step: 3,
                                    title: "Book",
                                    description:
                                        "Enter passenger details and select your seats with our interactive seat selection",
                                },
                                {
                                    step: 4,
                                    title: "Pay",
                                    description:
                                        "Complete secure payment and receive your e-ticket instantly via email and SMS",
                                },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col items-center group"
                                >
                                    <div className="bg-gradient-to-br from-primary to-indigo-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4 text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="text-gray-600 text-center leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
