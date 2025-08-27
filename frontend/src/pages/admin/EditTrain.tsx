import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";
import { getTrainById, updateTrain } from "../../services/trainService";

const EditTrain = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        number: "",
        name: "",
        source: "",
        sourceCode: "",
        destination: "",
        destinationCode: "",
        departureTime: "",
        arrivalTime: "",
        duration: "",
        distance: "",
        runningDays: [] as string[],
        classes: [
            { type: "SL", totalSeats: 200, fare: 0 },
            { type: "3A", totalSeats: 80, fare: 0 },
            { type: "2A", totalSeats: 40, fare: 0 },
            { type: "1A", totalSeats: 10, fare: 0 },
        ],
    });

    useEffect(() => {
        const loadTrain = async () => {
            try {
                if (!id) return;
                const train = await getTrainById(id);
                if (!train) {
                    toast.error("Train not found");
                    navigate("/admin/trains");
                    return;
                }
                setFormData({
                    number: train.number,
                    name: train.name,
                    source: train.source,
                    sourceCode: train.source_code,
                    destination: train.destination,
                    destinationCode: train.destination_code,
                    departureTime: train.departure_time,
                    arrivalTime: train.arrival_time,
                    duration: train.duration,
                    distance: train.distance,
                    runningDays: train.running_days,
                    classes: train.classes,
                });
            } catch (error) {
                console.error("Error loading train:", error);
                toast.error("Failed to load train details");
            } finally {
                setIsLoading(false);
            }
        };

        loadTrain();
    }, [id, navigate]);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const handleDayToggle = (day: string) => {
        setFormData((prev) => ({
            ...prev,
            runningDays: prev.runningDays.includes(day)
                ? prev.runningDays.filter((d) => d !== day)
                : [...prev.runningDays, day],
        }));
    };

    const handleClassChange = (index: number, field: string, value: number) => {
        const updatedClasses = [...formData.classes];
        updatedClasses[index] = { ...updatedClasses[index], [field]: value };
        setFormData((prev) => ({ ...prev, classes: updatedClasses }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!id) return;

        if (formData.runningDays.length === 0) {
            toast.error("Please select at least one running day");
            return;
        }

        setIsSaving(true);
        try {
            await updateTrain(id, formData);
            toast.success("Train updated successfully");
            navigate("/admin/trains");
        } catch (error) {
            console.error("Error updating train:", error);
            toast.error("Failed to update train");
        } finally {
            setIsSaving(false);
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

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Edit Train
                    </h1>
                    <p className="text-gray-600 mt-2">Update train details</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-white rounded-lg shadow-md p-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="number" className="form-label">
                                Train Number
                            </label>
                            <input
                                type="text"
                                id="number"
                                value={formData.number}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        number: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="name" className="form-label">
                                Train Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="source" className="form-label">
                                Source Station
                            </label>
                            <input
                                type="text"
                                id="source"
                                value={formData.source}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        source: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="sourceCode" className="form-label">
                                Source Station Code
                            </label>
                            <input
                                type="text"
                                id="sourceCode"
                                value={formData.sourceCode}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        sourceCode: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="destination" className="form-label">
                                Destination Station
                            </label>
                            <input
                                type="text"
                                id="destination"
                                value={formData.destination}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        destination: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="destinationCode"
                                className="form-label"
                            >
                                Destination Station Code
                            </label>
                            <input
                                type="text"
                                id="destinationCode"
                                value={formData.destinationCode}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        destinationCode: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="departureTime"
                                className="form-label"
                            >
                                Departure Time
                            </label>
                            <input
                                type="time"
                                id="departureTime"
                                value={formData.departureTime}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        departureTime: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="arrivalTime" className="form-label">
                                Arrival Time
                            </label>
                            <input
                                type="time"
                                id="arrivalTime"
                                value={formData.arrivalTime}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        arrivalTime: e.target.value,
                                    }))
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="duration" className="form-label">
                                Duration
                            </label>
                            <input
                                type="text"
                                id="duration"
                                value={formData.duration}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        duration: e.target.value,
                                    }))
                                }
                                className="form-input"
                                placeholder="e.g., 12h 30m"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="distance" className="form-label">
                                Distance
                            </label>
                            <input
                                type="text"
                                id="distance"
                                value={formData.distance}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        distance: e.target.value,
                                    }))
                                }
                                className="form-input"
                                placeholder="e.g., 1,234 km"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="form-label">Running Days</label>
                        <div className="flex flex-wrap gap-2">
                            {days.map((day) => (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayToggle(day)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        formData.runningDays.includes(day)
                                            ? "bg-primary text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="form-label">
                            Class Configuration
                        </label>
                        <div className="space-y-4">
                            {formData.classes.map((cls, index) => (
                                <div
                                    key={cls.type}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
                                >
                                    <div>
                                        <label className="form-label">
                                            Class Type
                                        </label>
                                        <input
                                            type="text"
                                            value={cls.type}
                                            className="form-input bg-gray-100"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            Total Seats
                                        </label>
                                        <input
                                            type="number"
                                            value={cls.totalSeats}
                                            onChange={(e) =>
                                                handleClassChange(
                                                    index,
                                                    "totalSeats",
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            className="form-input"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">
                                            Fare (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={cls.fare}
                                            onChange={(e) =>
                                                handleClassChange(
                                                    index,
                                                    "fare",
                                                    parseInt(e.target.value)
                                                )
                                            }
                                            className="form-input"
                                            min="0"
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => navigate("/admin/trains")}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn btn-primary flex items-center"
                        >
                            {isSaving ? (
                                <>
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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTrain;
