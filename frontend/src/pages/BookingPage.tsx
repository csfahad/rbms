import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { getTrainById, TrainClass } from "../services/trainService";
import { createBooking, Passenger } from "../services/bookingService";
import {
    Calendar,
    CreditCard,
    MapPin,
    Clock,
    Trash2,
    Plus,
    UserCircle,
    User,
} from "lucide-react";

type PassengerForm = Omit<Passenger, "id" | "seatNumber">;

const BookingPage = () => {
    const { trainId } = useParams<{ trainId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [train, setTrain] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState<TrainClass>("SL");
    const [travelDate, setTravelDate] = useState("");
    const [passengers, setPassengers] = useState<PassengerForm[]>([
        { name: "", age: 0, gender: "Male" },
    ]);
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [step, setStep] = useState(1);

    const classMappings: Record<TrainClass, string> = {
        SL: "Sleeper (SL)",
        "3A": "AC 3 Tier (3A)",
        "2A": "AC 2 Tier (2A)",
        "1A": "AC First Class (1A)",
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const classParam = params.get("class") as TrainClass;
        const dateParam = params.get("date");

        if (classParam && Object.keys(classMappings).includes(classParam)) {
            setSelectedClass(classParam);
        }

        if (dateParam) {
            setTravelDate(dateParam);
        } else {
            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setTravelDate(tomorrow.toISOString().split("T")[0]);
        }

        const fetchTrain = async () => {
            try {
                if (!trainId) return;
                const trainData = await getTrainById(trainId);
                if (!trainData) {
                    toast.error("Train not found");
                    navigate("/search");
                    return;
                }
                setTrain(trainData);
            } catch (error) {
                console.error("Error fetching train:", error);
                toast.error("Failed to load train details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrain();
    }, [trainId, location.search, navigate]);

    const handleAddPassenger = () => {
        if (passengers.length < 6) {
            setPassengers([
                ...passengers,
                { name: "", age: 0, gender: "Male" },
            ]);
        } else {
            toast.info("Maximum 6 passengers allowed per booking");
        }
    };

    const handleRemovePassenger = (index: number) => {
        if (passengers.length > 1) {
            setPassengers(passengers.filter((_, i) => i !== index));
        } else {
            toast.info("At least one passenger is required");
        }
    };

    const handlePassengerChange = (
        index: number,
        field: keyof PassengerForm,
        value: any
    ) => {
        const updatedPassengers = [...passengers];
        updatedPassengers[index] = {
            ...updatedPassengers[index],
            [field]: value,
        };
        setPassengers(updatedPassengers);
    };

    const validatePassengers = () => {
        for (const passenger of passengers) {
            if (!passenger.name.trim()) {
                toast.error("Passenger name is required");
                return false;
            }

            if (!passenger.age || passenger.age < 1 || passenger.age > 120) {
                toast.error("Valid passenger age is required (1-120)");
                return false;
            }
        }
        return true;
    };

    const handleContinueToPayment = () => {
        if (!validatePassengers()) return;
        setStep(2);
        window.scrollTo(0, 0);
    };

    const handleConfirmBooking = async () => {
        if (!train || !user) return;

        setIsBookingLoading(true);

        try {
            const booking = await createBooking(
                user.id,
                train,
                selectedClass,
                passengers,
                travelDate
            );

            toast.success("Booking successful!");
            navigate(`/user/bookings?new=${booking.id}`);
        } catch (error) {
            console.error("Booking error:", error);
            toast.error("Booking failed. Please try again.");
        } finally {
            setIsBookingLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <svg
                    className="animate-spin h-10 w-10 text-primary\"
                    xmlns="http://www.w3.org/2000/svg\"
                    fill="none\"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25\"
                        cx="12\"
                        cy="12\"
                        r="10\"
                        stroke="currentColor\"
                        strokeWidth="4"
                    ></circle>
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
            </div>
        );
    }

    if (!train) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Train Not Found
                    </h3>
                    <p className="text-gray-600">
                        The train you are looking for could not be found.
                    </p>
                    <button
                        onClick={() => navigate("/search")}
                        className="mt-4 btn btn-primary"
                    >
                        Back to Search
                    </button>
                </div>
            </div>
        );
    }

    const selectedClassInfo = train?.classes?.find(
        (c: any) => c.type === selectedClass
    );
    const totalFare = selectedClassInfo
        ? selectedClassInfo.fare * passengers.length
        : 0;

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Stepper */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        <div
                            className={`flex items-center ${
                                step >= 1 ? "text-primary" : "text-gray-400"
                            }`}
                        >
                            <div
                                className={`rounded-full h-8 w-8 flex items-center justify-center ${
                                    step >= 1
                                        ? "bg-primary text-white"
                                        : "bg-gray-200"
                                }`}
                            >
                                1
                            </div>
                            <span className="ml-2 font-medium">
                                Passenger Details
                            </span>
                        </div>
                        <div
                            className={`h-1 w-16 mx-2 ${
                                step >= 2 ? "bg-primary" : "bg-gray-200"
                            }`}
                        ></div>
                        <div
                            className={`flex items-center ${
                                step >= 2 ? "text-primary" : "text-gray-400"
                            }`}
                        >
                            <div
                                className={`rounded-full h-8 w-8 flex items-center justify-center ${
                                    step >= 2
                                        ? "bg-primary text-white"
                                        : "bg-gray-200"
                                }`}
                            >
                                2
                            </div>
                            <span className="ml-2 font-medium">
                                Payment & Confirmation
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Book Your Train Tickets
                    </h1>

                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {train.name}
                        </h2>
                        <p className="text-gray-600">
                            Train Number: {train.number}
                        </p>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
                            <div className="flex items-start mb-4 md:mb-0">
                                <div className="text-right mr-3">
                                    <p className="text-xl font-bold">
                                        {train.departure_time}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {train.source_code}
                                    </p>
                                </div>
                                <div className="flex flex-col items-center mx-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <div className="w-0.5 h-16 bg-gray-300"></div>
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                </div>
                                <div className="ml-3">
                                    <p className="text-xl font-bold">
                                        {train.arrival_time}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {train.destination_code}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center mx-4">
                                <div className="flex items-center mb-1">
                                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                                    <span className="text-gray-700">
                                        {train.duration}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                                    <span className="text-gray-700">
                                        {train.distance}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex flex-col md:flex-row gap-6 mb-6">
                            <div className="w-full md:w-1/2">
                                <label
                                    htmlFor="travelDate"
                                    className="form-label"
                                >
                                    Travel Date
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="date"
                                        id="travelDate"
                                        value={travelDate}
                                        onChange={(e) =>
                                            setTravelDate(e.target.value)
                                        }
                                        className="form-input pl-10"
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
                                        }
                                        max={(() => {
                                            const maxDate = new Date();
                                            maxDate.setDate(
                                                maxDate.getDate() + 120
                                            ); // 4 months ahead
                                            return maxDate
                                                .toISOString()
                                                .split("T")[0];
                                        })()}
                                    />
                                </div>
                            </div>

                            <div className="w-full md:w-1/2">
                                <label htmlFor="class" className="form-label">
                                    Travel Class
                                </label>
                                <select
                                    id="class"
                                    value={selectedClass}
                                    onChange={(e) =>
                                        setSelectedClass(
                                            e.target.value as TrainClass
                                        )
                                    }
                                    className="form-input"
                                >
                                    {train.classes.map((c: any) => (
                                        <option key={c.type} value={c.type}>
                                            {
                                                classMappings[
                                                    c.type as TrainClass
                                                ]
                                            }{" "}
                                            - ₹{c.fare} ({c.totalSeats} seats
                                            available)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {step === 1 && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Passenger Details
                            </h2>
                            <button
                                onClick={handleAddPassenger}
                                className="flex items-center text-primary hover:text-primary-light"
                            >
                                <Plus className="h-5 w-5 mr-1" />
                                Add Passenger
                            </button>
                        </div>

                        {passengers.map((passenger, index) => (
                            <div
                                key={index}
                                className="border-t border-gray-200 pt-4 mb-4"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-medium text-gray-900">
                                        Passenger {index + 1}
                                    </h3>
                                    {passengers.length > 1 && (
                                        <button
                                            onClick={() =>
                                                handleRemovePassenger(index)
                                            }
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label
                                            htmlFor={`name-${index}`}
                                            className="form-label"
                                        >
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                id={`name-${index}`}
                                                value={passenger.name}
                                                onChange={(e) =>
                                                    handlePassengerChange(
                                                        index,
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                className="form-input pl-10"
                                                placeholder="Passenger Name"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor={`age-${index}`}
                                            className="form-label"
                                        >
                                            Age
                                        </label>
                                        <input
                                            type="number"
                                            id={`age-${index}`}
                                            value={passenger.age || ""}
                                            onChange={(e) =>
                                                handlePassengerChange(
                                                    index,
                                                    "age",
                                                    parseInt(e.target.value) ||
                                                        0
                                                )
                                            }
                                            className="form-input"
                                            placeholder="Age"
                                            min="1"
                                            max="120"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor={`gender-${index}`}
                                            className="form-label"
                                        >
                                            Gender
                                        </label>
                                        <select
                                            id={`gender-${index}`}
                                            value={passenger.gender}
                                            onChange={(e) =>
                                                handlePassengerChange(
                                                    index,
                                                    "gender",
                                                    e.target.value as
                                                        | "Male"
                                                        | "Female"
                                                        | "Other"
                                                )
                                            }
                                            className="form-input"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">
                                                Female
                                            </option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="border-t border-gray-200 pt-6 mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-lg font-semibold">
                                        Total Fare:
                                    </p>
                                    <p className="text-gray-600">
                                        {passengers.length} passenger
                                        {passengers.length > 1 ? "s" : ""} × ₹
                                        {selectedClassInfo?.fare || 0}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-primary">
                                    ₹{totalFare}
                                </p>
                            </div>

                            <button
                                onClick={handleContinueToPayment}
                                className="btn btn-primary w-full mt-4"
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            Payment & Confirmation
                        </h2>

                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-2">
                                Trip Summary
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Train
                                        </p>
                                        <p className="font-medium">
                                            {train.name} ({train.number})
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Travel Date
                                        </p>
                                        <p className="font-medium">
                                            {new Date(
                                                travelDate
                                            ).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            From - To
                                        </p>
                                        <p className="font-medium">
                                            {train.source} - {train.destination}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Class
                                        </p>
                                        <p className="font-medium">
                                            {classMappings[selectedClass]}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Departure - Arrival
                                        </p>
                                        <p className="font-medium">
                                            {train.departure_time} -{" "}
                                            {train.arrival_time}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Passengers
                                        </p>
                                        <p className="font-medium">
                                            {passengers.length} passenger
                                            {passengers.length > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-2">
                                Passenger Details
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-md">
                                <div className="divide-y divide-gray-200">
                                    {passengers.map((passenger, index) => (
                                        <div
                                            key={index}
                                            className={
                                                index > 0 ? "pt-3 mt-3" : ""
                                            }
                                        >
                                            <div className="flex items-start">
                                                <UserCircle className="h-5 w-5 text-gray-400 mt-0.5 mr-2" />
                                                <div>
                                                    <p className="font-medium">
                                                        {passenger.name}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {passenger.age} years,{" "}
                                                        {passenger.gender}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-medium text-gray-900 mb-2">
                                Payment Method
                            </h3>
                            <div className="border rounded-md p-4">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="creditCard"
                                        name="paymentMethod"
                                        checked
                                        readOnly
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                    />
                                    <label
                                        htmlFor="creditCard"
                                        className="ml-2 block"
                                    >
                                        <div className="flex items-center">
                                            <CreditCard className="h-5 w-5 text-primary mr-2" />
                                            <span className="font-medium">
                                                Credit/Debit Card
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="cardNumber"
                                            className="form-label"
                                        >
                                            Card Number
                                        </label>
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            className="form-input"
                                            placeholder="1234 5678 9012 3456"
                                            maxLength={19}
                                            value="4111 1111 1111 1111"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="cardName"
                                            className="form-label"
                                        >
                                            Name on Card
                                        </label>
                                        <input
                                            type="text"
                                            id="cardName"
                                            className="form-input"
                                            placeholder="John Doe"
                                            value="Test User"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="expiry"
                                            className="form-label"
                                        >
                                            Expiry Date
                                        </label>
                                        <input
                                            type="text"
                                            id="expiry"
                                            className="form-input"
                                            placeholder="MM/YY"
                                            value="12/25"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="cvv"
                                            className="form-label"
                                        >
                                            CVV
                                        </label>
                                        <input
                                            type="text"
                                            id="cvv"
                                            className="form-input"
                                            placeholder="123"
                                            value="123"
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 bg-yellow-50 p-3 rounded-md">
                                    <p className="text-yellow-800 text-sm">
                                        <strong>Note:</strong> This is a demo
                                        application. No actual payment will be
                                        processed.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-lg font-semibold">
                                        Total Amount:
                                    </p>
                                    <p className="text-gray-600">
                                        {passengers.length} passenger
                                        {passengers.length > 1 ? "s" : ""} × ₹
                                        {selectedClassInfo?.fare || 0}
                                    </p>
                                </div>
                                <p className="text-2xl font-bold text-primary">
                                    ₹{totalFare}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="btn btn-secondary"
                                >
                                    Back to Passenger Details
                                </button>
                                <button
                                    onClick={handleConfirmBooking}
                                    disabled={isBookingLoading}
                                    className="btn btn-primary flex-1 flex justify-center items-center"
                                >
                                    {isBookingLoading ? (
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white\"
                                            xmlns="http://www.w3.org/2000/svg\"
                                            fill="none\"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25\"
                                                cx="12\"
                                                cy="12\"
                                                r="10\"
                                                stroke="currentColor\"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                    ) : (
                                        "Confirm & Pay"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingPage;
