import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Calendar,
    Clock,
    MapPin,
    Train as TrainIcon,
    Repeat,
} from "lucide-react";
import StationAutocomplete from "../components/search/StationAutocomplete";
import {
    searchTrains,
    Train,
    TrainClass,
    Station,
    getStationSuggestions,
} from "../services/trainService";

const classOrder = ["SL", "3A", "2A", "1A"];

const classMappings: Record<TrainClass, string> = {
    SL: "Sleeper (SL)",
    "3A": "AC 3 Tier (3A)",
    "2A": "AC 2 Tier (2A)",
    "1A": "AC First Class (1A)",
};

const formatTimeDate = (time: string, date: string) => {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
    return `${time} | ${formattedDate}`;
};

const SearchTrainsPage = () => {
    const [searchParams] = useSearchParams();
    const [source, setSource] = useState("");
    const [destination, setDestination] = useState("");
    const [date, setDate] = useState(() => {
        const urlDate = searchParams.get("date");
        if (urlDate) return urlDate;
        const today = new Date();
        return today.toISOString().split("T")[0];
    });
    const [sourceStation, setSourceStation] = useState<Station | null>(null);
    const [destinationStation, setDestinationStation] =
        useState<Station | null>(null);
    const [trains, setTrains] = useState<Train[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const navigate = useNavigate();

    // Helper function to get station details by code
    const getStationByCode = async (code: string): Promise<Station | null> => {
        try {
            const stations = await getStationSuggestions(code);
            return stations.find((station) => station.code === code) || null;
        } catch (error) {
            console.error("Error fetching station details:", error);
            return null;
        }
    };

    // Handle URL parameters on component mount
    useEffect(() => {
        const fromCode = searchParams.get("from");
        const toCode = searchParams.get("to");
        const searchDate = searchParams.get("date");

        if (fromCode && toCode && searchDate) {
            // Set loading state
            setIsLoading(true);
            setHasSearched(true);

            const loadStationsAndSearch = async () => {
                try {
                    // Fetch station details for both source and destination
                    const [
                        sourceStationDetails,
                        destinationStationDetails,
                        trainResults,
                    ] = await Promise.all([
                        getStationByCode(fromCode),
                        getStationByCode(toCode),
                        searchTrains(fromCode, toCode, searchDate),
                    ]);

                    // Set station details and form values
                    if (sourceStationDetails) {
                        setSourceStation(sourceStationDetails);
                        setSource(
                            `${sourceStationDetails.name} (${sourceStationDetails.code})`
                        );
                    } else {
                        setSource(fromCode); // Fallback to code if station not found
                    }

                    if (destinationStationDetails) {
                        setDestinationStation(destinationStationDetails);
                        setDestination(
                            `${destinationStationDetails.name} (${destinationStationDetails.code})`
                        );
                    } else {
                        setDestination(toCode); // Fallback to code if station not found
                    }

                    setTrains(trainResults);
                    setDate(searchDate);
                } catch (error) {
                    console.error("Error loading data:", error);
                    // Fallback to codes if there's an error
                    setSource(fromCode);
                    setDestination(toCode);
                    setDate(searchDate);
                } finally {
                    setIsLoading(false);
                }
            };

            loadStationsAndSearch();
        }
    }, [searchParams]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceStation || !destinationStation) {
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

        try {
            const results = await searchTrains(
                sourceStation.code,
                destinationStation.code,
                date
            );
            setTrains(results);
        } catch (error) {
            console.error("Error searching trains:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBooking = (trainId: string, classType: TrainClass) => {
        navigate(`/booking/${trainId}?class=${classType}&date=${date}`);
    };

    const getClassAvailabilityColor = (availability: number, total: number) => {
        const ratio = availability / total;
        if (ratio > 0.5) return "text-green-600";
        if (ratio > 0.2) return "text-amber-500";
        return "text-red-600";
    };

    const handleSwap = () => {
        // Swap values
        const tempSource = source;
        const tempSourceStation = sourceStation;

        setSource(destination);
        setSourceStation(destinationStation);

        setDestination(tempSource);
        setDestinationStation(tempSourceStation);
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Search Trains
                    </h1>

                    <form onSubmit={handleSearch}>
                        <div className="flex flex-col md:flex-row md:items-end md:gap-3 gap-4">
                            {/* FROM */}
                            <div className="flex-1 w-full">
                                <StationAutocomplete
                                    label="From"
                                    placeholder="Enter source station"
                                    value={source}
                                    onChange={setSource}
                                    onStationSelect={(station) => {
                                        setSourceStation(station);
                                        setSource(
                                            `${station.name} (${station.code})`
                                        );
                                    }}
                                />
                            </div>

                            {/* SWAP */}
                            <div className="flex justify-center md:items-end md:justify-center">
                                <button
                                    type="button"
                                    onClick={handleSwap}
                                    disabled={!source || !destination}
                                    className="h-12 w-12 md:mb-0 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Swap From & To"
                                >
                                    <Repeat className="h-5 w-5" />
                                </button>
                            </div>

                            {/* TO */}
                            <div className="flex-1 w-full">
                                <StationAutocomplete
                                    label="To"
                                    placeholder="Enter destination station"
                                    value={destination}
                                    onChange={setDestination}
                                    onStationSelect={(station) => {
                                        setDestinationStation(station);
                                        setDestination(
                                            `${station.name} (${station.code})`
                                        );
                                    }}
                                />
                            </div>

                            {/* DATE */}
                            <div className="w-full md:w-48">
                                <label htmlFor="date" className="form-label">
                                    Journey Date
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        id="date"
                                        value={date}
                                        onChange={(e) =>
                                            setDate(e.target.value)
                                        }
                                        className="form-input pl-10 sm:py-2 lg:py-3"
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        max={(() => {
                                            const maxDate = new Date();
                                            maxDate.setDate(
                                                maxDate.getDate() + 120
                                            );
                                            return maxDate
                                                .toISOString()
                                                .split("T")[0];
                                        })()}
                                    />
                                </div>
                            </div>

                            {/* SEARCH BUTTON */}
                            <div className="w-full md:w-auto">
                                <button
                                    type="submit"
                                    className="btn btn-primary w-full md:w-auto sm:py-2 lg:py-3"
                                >
                                    Search Trains
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <svg
                            className="animate-spin h-10 w-10 text-primary"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            ></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                ) : (
                    <>
                        {hasSearched && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {trains.length} Results for{" "}
                                    {sourceStation?.name.split(" - ")[0]} to{" "}
                                    {destinationStation?.name.split(" - ")[0]} |{" "}
                                    {new Date(date).toLocaleDateString(
                                        "en-US",
                                        {
                                            weekday: "short",
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        }
                                    )}
                                </h2>
                            </div>
                        )}

                        {hasSearched && trains.length === 0 ? (
                            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                                <TrainIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    No Trains Available
                                </h3>
                                <p className="text-gray-600">
                                    There is no train available between{" "}
                                    {sourceStation?.name.split(" - ")[0]} and{" "}
                                    {destinationStation?.name.split(" - ")[0]}{" "}
                                    on{" "}
                                    {new Date(date).toLocaleDateString(
                                        "en-US",
                                        {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        }
                                    )}
                                    .
                                </p>
                                <p className="text-gray-600 mt-2">
                                    Try searching with different stations or
                                    dates.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {trains.map((train) => {
                                    const sourceName =
                                        train.source?.split(" - ")[0] || "";
                                    const destinationName =
                                        train.destination?.split(" - ")[0] ||
                                        "";

                                    const sortedAvailability = [
                                        ...train.availability,
                                    ].sort(
                                        (a, b) =>
                                            classOrder.indexOf(a.type) -
                                            classOrder.indexOf(b.type)
                                    );

                                    return (
                                        <div
                                            key={train.id}
                                            className="train-card slide-up border rounded-lg p-5 shadow-sm hover:shadow-md transition-all"
                                        >
                                            <div className="flex justify-between items-start mb-4 bg-gray-50 p-2 rounded-lg">
                                                <h3 className="text-xl font-bold text-primary">
                                                    {train.name} ({train.number}
                                                    )
                                                </h3>
                                                <p className="text-base font-semibold text-gray-800">
                                                    Runs on:{" "}
                                                    <span className="text-base font-bold tracking-wider text-gray-900">
                                                        {[
                                                            "M",
                                                            "T",
                                                            "W",
                                                            "T",
                                                            "F",
                                                            "S",
                                                            "S",
                                                        ].map((dayAbbr, i) => {
                                                            const daysMap = [
                                                                "Monday",
                                                                "Tuesday",
                                                                "Wednesday",
                                                                "Thursday",
                                                                "Friday",
                                                                "Saturday",
                                                                "Sunday",
                                                            ];
                                                            const isActive =
                                                                train.running_days?.includes(
                                                                    daysMap[i]
                                                                );
                                                            return (
                                                                <span
                                                                    key={i}
                                                                    className={`mr-1 ${
                                                                        isActive
                                                                            ? "text-gray-900"
                                                                            : "text-gray-400"
                                                                    }`}
                                                                >
                                                                    {dayAbbr}
                                                                </span>
                                                            );
                                                        })}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Route and timing */}
                                            <div className="flex flex-col md:flex-row justify-between items-center relative mb-6">
                                                {/* Source station */}
                                                <div className="text-center md:text-left">
                                                    <p className="text-lg font-semibold text-gray-800">
                                                        {sourceName} (
                                                        {train.source_code})
                                                    </p>
                                                    <p className="text-md font-semibold text-gray-700 mt-1">
                                                        {formatTimeDate(
                                                            train.departure_time,
                                                            date
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Connector with info */}
                                                <div className="flex flex-col items-center mx-6 my-4 md:my-0">
                                                    <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                                        {train.duration}
                                                    </div>

                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                        <div className="w-24 h-0.5 bg-gray-300 mx-2"></div>
                                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                    </div>

                                                    <div className="flex items-center text-sm font-medium text-gray-700 mt-1">
                                                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                                                        {train.distance}
                                                    </div>
                                                </div>

                                                {/* Destination station */}
                                                <div className="text-center md:text-right">
                                                    <p className="text-lg font-semibold text-gray-800">
                                                        {destinationName} (
                                                        {train.destination_code}
                                                        )
                                                    </p>
                                                    <p className="text-md font-semibold text-gray-700 mt-1">
                                                        {formatTimeDate(
                                                            train.arrival_time,
                                                            date
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Class availability */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                {sortedAvailability.map(
                                                    (classInfo) => (
                                                        <div
                                                            key={classInfo.type}
                                                            className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
                                                        >
                                                            <p className="font-semibold text-gray-900 mb-1">
                                                                {classMappings[
                                                                    classInfo
                                                                        .type
                                                                ] ||
                                                                    classInfo.type}
                                                            </p>

                                                            <div className="flex justify-between items-center text-sm mt-1">
                                                                <p className="text-gray-600 font-semibold text-base">
                                                                    Fare: ₹
                                                                    {
                                                                        classInfo.fare
                                                                    }
                                                                </p>
                                                                <p
                                                                    className={`font-semibold text-base ${getClassAvailabilityColor(
                                                                        classInfo.availableSeats,
                                                                        classInfo.totalSeats
                                                                    )}`}
                                                                >
                                                                    AVAILABLE -{" "}
                                                                    {
                                                                        classInfo.availableSeats
                                                                    }
                                                                </p>
                                                            </div>

                                                            <button
                                                                onClick={() =>
                                                                    handleBooking(
                                                                        train.id,
                                                                        classInfo.type
                                                                    )
                                                                }
                                                                disabled={
                                                                    classInfo.availableSeats ===
                                                                    0
                                                                }
                                                                className="w-full mt-3 py-2 px-4 rounded-md text-center text-sm font-medium text-white bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
                                                            >
                                                                Book Now
                                                            </button>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SearchTrainsPage;
