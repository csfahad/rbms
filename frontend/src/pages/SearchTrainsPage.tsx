import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Calendar,
    Clock,
    MapPin,
    Train as TrainIcon,
    Repeat,
    X,
    Info,
} from "lucide-react";
import StationAutocomplete from "../components/search/StationAutocomplete";
import {
    searchTrains,
    searchTrainsByStoppage,
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

// calculate arrival date based on departure time and duration
const calculateArrivalDate = (
    departureDate: string,
    departureTime: string,
    arrivalTime: string
): string => {
    const [depHour, depMin] = departureTime.split(":").map(Number);
    const [arrHour, arrMin] = arrivalTime.split(":").map(Number);

    const departureMinutes = depHour * 60 + depMin;
    const arrivalMinutes = arrHour * 60 + arrMin;

    // if arrival time is less than departure time, it means next day
    const isNextDay = arrivalMinutes < departureMinutes;

    const baseDate = new Date(departureDate);
    if (isNextDay) {
        baseDate.setDate(baseDate.getDate() + 1);
    }

    return baseDate.toISOString().split("T")[0]; // Return YYYY-MM-DD format
};

const formatTimeDateWithArrival = (
    time: string,
    departureDate: string,
    departureTime?: string,
    isArrival?: boolean
) => {
    let dateToUse = departureDate;

    if (isArrival && departureTime) {
        dateToUse = calculateArrivalDate(departureDate, departureTime, time);
    }

    const dateObj = new Date(dateToUse);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
    return `${time} | ${formattedDate}`;
};

// calculate time difference between two time strings (HH:MM format)
const calculateDuration = (startTime: string, endTime: string): string => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);

    // handle next day arrival
    if (totalMinutes < 0) {
        totalMinutes += 24 * 60;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours.toString().padStart(2, "0")}h ${minutes
        .toString()
        .padStart(2, "0")}m`;
};

// get segment details based on source and destination stations
const getSegmentDetails = (
    train: Train,
    sourceStationName: string,
    destinationStationName: string
) => {
    if (!train.stoppages || train.stoppages.length === 0) {
        // no stoppages data, return main route details
        return {
            sourceName: train.source,
            sourceCode: train.source_code,
            destinationName: train.destination,
            destinationCode: train.destination_code,
            departureTime: train.departure_time,
            arrivalTime: train.arrival_time,
            duration: train.duration,
            distance: train.distance,
        };
    }

    // create a complete route array including source, stoppages, and destination
    const completeRoute = [
        {
            stationName: train.source,
            stationCode: train.source_code,
            departureTime: train.departure_time,
            arrivalTime: null,
            distanceFromSource: 0,
        },
        ...train.stoppages.map((stop) => ({
            stationName: stop.stationName,
            stationCode: stop.stationCode,
            departureTime: stop.departureTime,
            arrivalTime: stop.arrivalTime,
            distanceFromSource: stop.distanceFromSource || 0,
        })),
        {
            stationName: train.destination,
            stationCode: train.destination_code,
            departureTime: null,
            arrivalTime: train.arrival_time,
            distanceFromSource:
                parseInt(train.distance.replace(" km", "")) || 0,
        },
    ];

    // find source and destination in the route
    const sourceStation = completeRoute.find(
        (station) =>
            station.stationName
                .toLowerCase()
                .includes(sourceStationName.toLowerCase()) ||
            station.stationCode.toLowerCase() ===
                sourceStationName.toLowerCase()
    );

    const destinationStation = completeRoute.find(
        (station) =>
            station.stationName
                .toLowerCase()
                .includes(destinationStationName.toLowerCase()) ||
            station.stationCode.toLowerCase() ===
                destinationStationName.toLowerCase()
    );

    if (!sourceStation || !destinationStation) {
        // fallback to main route if stations not found
        return {
            sourceName: train.source,
            sourceCode: train.source_code,
            destinationName: train.destination,
            destinationCode: train.destination_code,
            departureTime: train.departure_time,
            arrivalTime: train.arrival_time,
            duration: train.duration,
            distance: train.distance,
        };
    }

    // calculate segment duration
    // for source station: use departureTime if available, otherwise arrivalTime (shouldn't happen), otherwise train departure time
    const segmentDepartureTime =
        sourceStation.departureTime ||
        sourceStation.arrivalTime ||
        train.departure_time;
    // for destination station: use arrivalTime if available, otherwise departureTime (for final destination), otherwise train arrival time
    const segmentArrivalTime =
        destinationStation.arrivalTime ||
        destinationStation.departureTime ||
        train.arrival_time;
    const segmentDuration = calculateDuration(
        segmentDepartureTime,
        segmentArrivalTime
    );

    // calculate segment distance
    const segmentDistance = Math.abs(
        destinationStation.distanceFromSource - sourceStation.distanceFromSource
    );

    return {
        sourceName: sourceStation.stationName,
        sourceCode: sourceStation.stationCode,
        destinationName: destinationStation.stationName,
        destinationCode: destinationStation.stationCode,
        departureTime: segmentDepartureTime,
        arrivalTime: segmentArrivalTime,
        duration: segmentDuration,
        distance: `${segmentDistance} km`,
    };
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
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
    const navigate = useNavigate();

    // helper function to get station details by code
    const getStationByCode = async (code: string): Promise<Station | null> => {
        try {
            const stations = await getStationSuggestions(code);
            return stations.find((station) => station.code === code) || null;
        } catch (error) {
            console.error("Error fetching station details:", error);
            return null;
        }
    };

    // handle URL parameters on component mount
    useEffect(() => {
        const fromCode = searchParams.get("from");
        const toCode = searchParams.get("to");
        const searchDate = searchParams.get("date");

        if (fromCode && toCode && searchDate) {
            setIsLoading(true);
            setHasSearched(true);

            const loadStationsAndSearch = async () => {
                try {
                    // fetch station details for both source and destination
                    const [sourceStationDetails, destinationStationDetails] =
                        await Promise.all([
                            getStationByCode(fromCode),
                            getStationByCode(toCode),
                        ]);

                    // set station details and form values
                    if (sourceStationDetails) {
                        setSourceStation(sourceStationDetails);
                        setSource(
                            `${sourceStationDetails.name} (${sourceStationDetails.code})`
                        );
                    } else {
                        setSource(fromCode);
                    }

                    if (destinationStationDetails) {
                        setDestinationStation(destinationStationDetails);
                        setDestination(
                            `${destinationStationDetails.name} (${destinationStationDetails.code})`
                        );
                    } else {
                        setDestination(toCode);
                    }

                    setDate(searchDate);

                    // perform comprehensive train search
                    if (sourceStationDetails && destinationStationDetails) {
                        const [regularResults, stoppageResults] =
                            await Promise.all([
                                searchTrains(fromCode, toCode, searchDate),
                                searchTrainsByStoppage(
                                    sourceStationDetails.name,
                                    destinationStationDetails.name,
                                    searchDate
                                ),
                            ]);

                        // combine results and remove duplicates
                        const combinedResults = [
                            ...regularResults,
                            ...stoppageResults,
                        ];
                        const uniqueTrains = combinedResults.filter(
                            (train, index, self) =>
                                index ===
                                self.findIndex((t) => t.id === train.id)
                        );
                        setTrains(uniqueTrains);
                    } else {
                        // fallback to code-based search
                        const trainResults = await searchTrains(
                            fromCode,
                            toCode,
                            searchDate
                        );
                        setTrains(trainResults);
                    }
                } catch (error) {
                    console.error("Error loading data:", error);
                    // fallback to codes if there's an error
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
            // try both regular search and stoppage-based search for comprehensive results
            const [regularResults, stoppageResults] = await Promise.all([
                searchTrains(sourceStation.code, destinationStation.code, date),
                searchTrainsByStoppage(
                    sourceStation.name,
                    destinationStation.name,
                    date
                ),
            ]);

            // combine results and remove duplicates based on train ID
            const combinedResults = [...regularResults, ...stoppageResults];
            const uniqueTrains = combinedResults.filter(
                (train, index, self) =>
                    index === self.findIndex((t) => t.id === train.id)
            );

            setTrains(uniqueTrains);
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
        // swap values
        const tempSource = source;
        const tempSourceStation = sourceStation;

        setSource(destination);
        setSourceStation(destinationStation);

        setDestination(tempSource);
        setDestinationStation(tempSourceStation);
    };

    // handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsScheduleModalOpen(false);
            }
        };

        if (isScheduleModalOpen) {
            document.addEventListener("keydown", handleEscape);
            return () => document.removeEventListener("keydown", handleEscape);
        }
    }, [isScheduleModalOpen]);

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

                {/* Beta Info Badge */}
                {!hasSearched && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <div className="flex items-start gap-3">
                            <Info className="h-6 w-6 text-primary-light flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                                    Beta Version Information
                                </h3>
                                <p className="text-primary-light mb-4">
                                    This website is currently in beta version.
                                    Only these route trains are available for
                                    now:
                                </p>

                                {/* Popular Routes */}
                                <div className="mb-4">
                                    <h4 className="font-medium text-blue-900 mb-2">
                                        Popular Available Routes:
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-primary-light">
                                                New Delhi → Mumbai
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-primary-light">
                                                New Delhi → Kolkata
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-primary-light">
                                                New Delhi → Chennai
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-primary-light">
                                                New Delhi → Bangalore
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-primary-light">
                                                Mumbai → Pune
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span className="text-primary-light">
                                                Delhi → Prayagraj
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Request New Route */}
                                <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                                    <p className="text-primary-light mb-3">
                                        <span className="font-medium">
                                            Need a different route train?
                                        </span>{" "}
                                        Submit a request for adding a new route
                                        train and we'll consider adding it soon.
                                    </p>
                                    <button
                                        onClick={() => navigate("/support")}
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition-colors text-sm font-medium"
                                    >
                                        Submit Route Request
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                    const segmentDetails =
                                        sourceStation && destinationStation
                                            ? getSegmentDetails(
                                                  train,
                                                  sourceStation.name,
                                                  destinationStation.name
                                              )
                                            : {
                                                  sourceName:
                                                      train.source?.split(
                                                          " - "
                                                      )[0] || "",
                                                  sourceCode: train.source_code,
                                                  destinationName:
                                                      train.destination?.split(
                                                          " - "
                                                      )[0] || "",
                                                  destinationCode:
                                                      train.destination_code,
                                                  departureTime:
                                                      train.departure_time,
                                                  arrivalTime:
                                                      train.arrival_time,
                                                  duration: train.duration,
                                                  distance: train.distance,
                                              };

                                    const sortedAvailability = [
                                        ...(train.availability || []),
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
                                            <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-lg">
                                                <div>
                                                    <h3 className="text-xl font-bold text-primary">
                                                        {train.name} (
                                                        {train.number})
                                                    </h3>
                                                </div>

                                                <div className="text-sm text-gray-600">
                                                    Runs On:{" "}
                                                    <span className="font-semibold tracking-wider">
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
                                                                "Mon",
                                                                "Tue",
                                                                "Wed",
                                                                "Thu",
                                                                "Fri",
                                                                "Sat",
                                                                "Sun",
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
                                                                            ? "text-primary font-bold"
                                                                            : "text-gray-400"
                                                                    }`}
                                                                >
                                                                    {dayAbbr}
                                                                </span>
                                                            );
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Train Schedule Button */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedTrain(train);
                                                        setIsScheduleModalOpen(
                                                            true
                                                        );
                                                    }}
                                                    className="text-primary hover:text-primary-light text-sm font-medium flex items-center"
                                                >
                                                    <Info className="h-4 w-4 mr-1" />
                                                    Train Schedule
                                                </button>
                                            </div>

                                            {/* Route and timing */}
                                            <div className="flex flex-col md:flex-row justify-between items-center relative mb-6">
                                                {/* Source station */}
                                                <div className="text-center md:text-left">
                                                    <p className="text-lg font-semibold text-gray-800">
                                                        {
                                                            segmentDetails.sourceName
                                                        }{" "}
                                                        (
                                                        {
                                                            segmentDetails.sourceCode
                                                        }
                                                        )
                                                    </p>
                                                    <p className="text-md font-semibold text-gray-700 mt-1">
                                                        {formatTimeDateWithArrival(
                                                            segmentDetails.departureTime,
                                                            date,
                                                            segmentDetails.departureTime,
                                                            false
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Connector with info */}
                                                <div className="flex flex-col items-center mx-6 my-4 md:my-0">
                                                    <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                                        {
                                                            segmentDetails.duration
                                                        }
                                                    </div>

                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                        <div className="w-24 h-0.5 bg-gray-300 mx-2"></div>
                                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                    </div>

                                                    <div className="flex items-center text-sm font-medium text-gray-700 mt-1">
                                                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                                                        {
                                                            segmentDetails.distance
                                                        }
                                                    </div>
                                                </div>

                                                {/* Destination station */}
                                                <div className="text-center md:text-right">
                                                    <p className="text-lg font-semibold text-gray-800">
                                                        {
                                                            segmentDetails.destinationName
                                                        }{" "}
                                                        (
                                                        {
                                                            segmentDetails.destinationCode
                                                        }
                                                        )
                                                    </p>
                                                    <p className="text-md font-semibold text-gray-700 mt-1">
                                                        {formatTimeDateWithArrival(
                                                            segmentDetails.arrivalTime,
                                                            date,
                                                            segmentDetails.departureTime,
                                                            true
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

            {/* Train Schedule Modal */}
            {isScheduleModalOpen && selectedTrain && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsScheduleModalOpen(false);
                        }
                    }}
                >
                    <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-primary text-white">
                            <div className="flex justify-between items-center px-6 py-3 border-b border-primary">
                                <h2 className="text-xl font-bold">
                                    Train Schedule
                                </h2>
                                <button
                                    onClick={() =>
                                        setIsScheduleModalOpen(false)
                                    }
                                    className="text-white hover:text-blue-200 transition-colors"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {/* Header Row with Column Labels */}
                            <div className="grid grid-cols-12 gap-1 px-4 py-2 border-b ">
                                <div className="col-span-2 text-center font-semibold">
                                    Train Number
                                </div>
                                <div className="col-span-3 text-center font-semibold">
                                    Train Name
                                </div>
                                <div className="col-span-2 text-center font-semibold">
                                    From Station
                                </div>
                                <div className="col-span-2 text-center font-semibold">
                                    Destination Station
                                </div>
                                <div className="col-span-3 text-center font-semibold">
                                    Runs On
                                </div>
                            </div>

                            {/* Data Row */}
                            <div className="grid grid-cols-12 gap-1 px-4 py-3 bg-white text-gray-900 ">
                                <div className="col-span-2 text-center font-medium">
                                    {selectedTrain.number}
                                </div>
                                <div className="col-span-3 text-center font-medium">
                                    {selectedTrain.name}
                                </div>
                                <div className="col-span-2 text-center font-medium">
                                    {selectedTrain.source?.split(" - ")[0] ||
                                        "NEW DELHI"}
                                </div>
                                <div className="col-span-2 text-center font-medium">
                                    {selectedTrain.destination?.split(
                                        " - "
                                    )[0] || "PRAYAGRAJ JN."}
                                </div>
                                <div className="col-span-3 flex justify-center items-center gap-1 flex-wrap">
                                    {[
                                        "MON",
                                        "TUE",
                                        "WED",
                                        "THU",
                                        "FRI",
                                        "SAT",
                                        "SUN",
                                    ].map((day, i) => {
                                        const daysMap = [
                                            "Mon",
                                            "Tue",
                                            "Wed",
                                            "Thu",
                                            "Fri",
                                            "Sat",
                                            "Sun",
                                        ];
                                        const isActive =
                                            selectedTrain.running_days?.includes(
                                                daysMap[i]
                                            );
                                        return (
                                            <span
                                                key={i}
                                                className={`inline-block px-1 py-1 rounded text-xs font-medium ${
                                                    isActive
                                                        ? "bg-green-500 text-white"
                                                        : "bg-gray-200 text-gray-600"
                                                }`}
                                            >
                                                {day}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            <hr className="border-gray-300" />
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-primary text-white">
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                S.N.
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Station Code
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Station Name
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Arrival Time
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Departure Time
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Halt Time(In minutes)
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Distance
                                            </th>
                                            <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                                                Day
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Origin Station */}
                                        <tr className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                1
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {selectedTrain.source_code}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {
                                                    selectedTrain.source?.split(
                                                        " - "
                                                    )[0]
                                                }
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                --
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {selectedTrain.departure_time}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                --
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                0
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                1
                                            </td>
                                        </tr>

                                        {/* Intermediate Stations */}
                                        {selectedTrain.stoppages
                                            ?.sort(
                                                (a, b) =>
                                                    a.stopNumber - b.stopNumber
                                            )
                                            .map((stoppage, index) => (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                                        {stoppage.stopNumber +
                                                            1}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                        {stoppage.stationCode}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                        {
                                                            stoppage.stationName?.split(
                                                                " - "
                                                            )[0]
                                                        }
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                                        {stoppage.arrivalTime ||
                                                            "--"}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                                        {stoppage.departureTime ||
                                                            "--"}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                                        {stoppage.haltDuration
                                                            ? `${stoppage.haltDuration}:00`
                                                            : "--"}
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                                        {
                                                            stoppage.distanceFromSource
                                                        }
                                                    </td>
                                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                                        {stoppage.arrivalTime &&
                                                        selectedTrain.departure_time
                                                            ? // Calculate if next day based on arrival time vs departure time
                                                              parseInt(
                                                                  stoppage.arrivalTime.split(
                                                                      ":"
                                                                  )[0]
                                                              ) <
                                                              parseInt(
                                                                  selectedTrain.departure_time.split(
                                                                      ":"
                                                                  )[0]
                                                              )
                                                                ? 2
                                                                : 1
                                                            : 1}
                                                    </td>
                                                </tr>
                                            ))}

                                        {/* Destination Station */}
                                        <tr className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {(selectedTrain.stoppages
                                                    ?.length || 0) + 2}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {selectedTrain.destination_code}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {
                                                    selectedTrain.destination?.split(
                                                        " - "
                                                    )[0]
                                                }
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                                {selectedTrain.arrival_time}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                --
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                --
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                {selectedTrain.distance?.replace(
                                                    " km",
                                                    ""
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-3 text-center">
                                                {selectedTrain.arrival_time &&
                                                selectedTrain.departure_time
                                                    ? // Calculate if next day based on arrival time vs departure time
                                                      parseInt(
                                                          selectedTrain.arrival_time.split(
                                                              ":"
                                                          )[0]
                                                      ) <
                                                      parseInt(
                                                          selectedTrain.departure_time.split(
                                                              ":"
                                                          )[0]
                                                      )
                                                        ? 2
                                                        : 1
                                                    : 1}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchTrainsPage;
