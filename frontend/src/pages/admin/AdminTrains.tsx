import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Edit,
    Trash2,
    Plus,
    Search,
    Calendar,
    MapPin,
    Train as TrainIcon,
} from "lucide-react";
import { toast } from "react-toastify";

const classMappings: Record<string, string> = {
    SL: "Sleeper",
    "3A": "AC 3 Tier",
    "2A": "AC 2 Tier ",
    "1A": "AC First Class (1A)",
};

interface Train {
    id: number;
    number: string;
    name: string;
    source: string;
    destination: string;
    departure_time: string; // match the column name in your DB
    arrival_time: string;
    running_days: string[];
    classes: string[];
}
const API_URL = "http://localhost:5000/api";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const AdminTrains = () => {
    const [trains, setTrains] = useState<Train[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);

    const openDeleteModal = (train: Train) => {
        setSelectedTrain(train);
        setShowModal(true);
    };

    const closeModal = () => {
        setSelectedTrain(null);
        setShowModal(false);
    };

    const confirmDelete = async () => {
        if (!selectedTrain) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/trains/${selectedTrain.id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            if (!response.ok) throw new Error("Failed to delete train");

            setTrains(trains.filter((train) => train.id !== selectedTrain.id));
        } catch (err: unknown) {
            if (err instanceof Error)
                toast.error("Error deleting train: " + err.message);
        } finally {
            closeModal();
        }
    };

    useEffect(() => {
        const fetchTrains = async () => {
            try {
                const response = await fetch(`${API_URL}/trains`, {
                    method: "GET",
                    headers: getHeaders(),
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch trains");
                }
                const data = await response.json();
                setTrains(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unknown error occurred");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTrains();
    }, []);

    const filteredTrains = trains.filter(
        (train) =>
            train.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            train.number.includes(searchQuery) ||
            train.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
            train.destination.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (loading)
        return (
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
        );
    if (error) return <p className="text-center py-10 text-red-600">{error}</p>;

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Manage Trains
                        </h1>
                        <p className="text-gray-600 mt-1">
                            View, add, edit or delete train details
                        </p>
                    </div>
                    <Link
                        to="/admin/trains/add"
                        className="btn btn-primary flex items-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Train
                    </Link>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-1/3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by train name, number, source or destination"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="form-input pl-10 w-full"
                                />
                            </div>
                        </div>

                        {/* Additional filters can be added here */}
                    </div>
                </div>

                {/* Trains Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Train Details
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Route
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Schedule
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Classes
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTrains.length > 0 ? (
                                    filteredTrains.map((train) => (
                                        <tr
                                            key={train.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <TrainIcon className="h-5 w-5 text-primary mr-3" />
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {train.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            #{train.number}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                                                    <div>
                                                        <div className="text-sm text-gray-900">
                                                            {train.source}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            to
                                                        </div>
                                                        <div className="text-sm text-gray-900">
                                                            {train.destination}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-start">
                                                    <Calendar className="h-4 w-4 text-gray-400 mr-1 mt-0.5" />
                                                    <div>
                                                        <div className="text-sm text-gray-500">
                                                            {
                                                                train.departure_time
                                                            }{" "}
                                                            -{" "}
                                                            {train.arrival_time}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Runs on:{" "}
                                                            {train.running_days.join(
                                                                ", "
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {train?.classes?.map(
                                                        (cls) => (
                                                            <span
                                                                key={cls}
                                                                className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800"
                                                            >
                                                                {
                                                                    classMappings[
                                                                        cls
                                                                    ]
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-2">
                                                    <Link
                                                        to={`/admin/trains/edit/${train.id}`}
                                                        className="text-primary hover:text-primary-light"
                                                        title="Edit Train"
                                                    >
                                                        <Edit className="h-5 w-5" />
                                                    </Link>

                                                    <button
                                                        onClick={() =>
                                                            openDeleteModal(
                                                                train
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Train"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-10 text-center text-gray-500"
                                        >
                                            No trains found matching your search
                                            criteria
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {showModal && selectedTrain && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Confirm Delete
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete{" "}
                            <strong>{selectedTrain.name}</strong> (#
                            {selectedTrain.number})?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTrains;
