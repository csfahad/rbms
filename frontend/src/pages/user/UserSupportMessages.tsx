import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Eye,
    ChevronLeft,
    ChevronRight,
    Plus,
    Reply,
} from "lucide-react";
import { supportService } from "../../services/supportService";
import { useAuth } from "../../contexts/AuthContext";
import { Link } from "react-router-dom";

interface SupportMessage {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: "pending" | "responded";
    admin_response?: string;
    admin_name?: string;
    responded_at?: string;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const UserSupportMessages = () => {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] =
        useState<SupportMessage | null>(null);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const { user } = useAuth();

    const fetchMessages = async (page = 1) => {
        setLoading(true);
        console.log("fetchMessages called - user:", user);
        try {
            const data = await supportService.getUserMessages({
                page,
                limit: pagination.limit,
            });
            console.log("fetchMessages success - data:", data);
            setMessages(data.messages);
            setPagination(data.pagination);
        } catch (error: any) {
            console.error("fetchMessages error:", error);
            toast.error(
                error.message || "Failed to load your support messages"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchMessages();
        }
    }, [user]);

    const handlePageChange = (page: number) => {
        fetchMessages(page);
    };

    const handleViewMessage = (message: SupportMessage) => {
        setSelectedMessage(message);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending":
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case "responded":
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800";
            case "responded":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Please Log In
                    </h2>
                    <p className="text-gray-600">
                        You need to be logged in to view your support messages.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                My Support Messages
                            </h1>
                            <p className="mt-2 text-gray-600">
                                View your support requests and admin responses
                            </p>
                        </div>
                        <Link
                            to="/support"
                            className="btn btn-primary flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Support Messages
                            </h3>
                            <p className="text-gray-600 mb-4">
                                You haven't submitted any support messages yet.
                            </p>
                            <Link to="/support" className="btn btn-primary">
                                Submit Your First Message
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subject
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Created
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Response
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {messages.map((message) => (
                                        <tr
                                            key={message.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {message.subject}
                                                        </div>
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {message.message}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {getStatusIcon(
                                                        message.status
                                                    )}
                                                    <span
                                                        className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                            message.status
                                                        )}`}
                                                    >
                                                        {message.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(
                                                    message.created_at
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {message.responded_at
                                                    ? new Date(
                                                          message.responded_at
                                                      ).toLocaleDateString()
                                                    : "No response yet"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() =>
                                                        handleViewMessage(
                                                            message
                                                        )
                                                    }
                                                    className="btn btn-secondary btn-sm"
                                                    title="View message"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing{" "}
                                    {(pagination.page - 1) * pagination.limit +
                                        1}{" "}
                                    to{" "}
                                    {Math.min(
                                        pagination.page * pagination.limit,
                                        pagination.total
                                    )}{" "}
                                    of {pagination.total} results
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.page - 1
                                            )
                                        }
                                        disabled={pagination.page === 1}
                                        className="btn btn-secondary btn-sm flex justify-center items-center"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-700 mx-2">
                                        Page {pagination.page} of{" "}
                                        {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            handlePageChange(
                                                pagination.page + 1
                                            )
                                        }
                                        disabled={
                                            pagination.page ===
                                            pagination.totalPages
                                        }
                                        className="btn btn-secondary btn-sm flex justify-center items-center"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* View Message Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Support Message Details
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Subject
                                </label>
                                <p className="mt-1 text-gray-900">
                                    {selectedMessage.subject}
                                </p>
                            </div>

                            {/* Your Message Section */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                <div className="flex items-center mb-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                                    <label className="text-sm font-medium text-blue-800">
                                        Your Message
                                    </label>
                                </div>
                                <p className="text-gray-900 whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </p>
                                <p className="mt-2 text-sm text-blue-600">
                                    Sent on{" "}
                                    {new Date(
                                        selectedMessage.created_at
                                    ).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    {getStatusIcon(selectedMessage.status)}
                                    <span
                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                            selectedMessage.status
                                        )}`}
                                    >
                                        {selectedMessage.status}
                                    </span>
                                </div>
                            </div>

                            {/* Admin Response Section */}
                            {selectedMessage.admin_response ? (
                                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                                    <div className="flex items-center mb-2">
                                        <Reply className="h-5 w-5 text-green-600 mr-2" />
                                        <label className="text-sm font-medium text-green-800">
                                            Admin Response
                                        </label>
                                    </div>
                                    <p className="text-gray-900 whitespace-pre-wrap mb-2">
                                        {selectedMessage.admin_response}
                                    </p>
                                    <p className="text-sm text-green-600">
                                        Responded by{" "}
                                        {selectedMessage.admin_name} on{" "}
                                        {new Date(
                                            selectedMessage.responded_at!
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                    <div className="flex items-center">
                                        <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                                        <p className="text-sm text-yellow-800">
                                            Waiting for admin response...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                            <Link
                                to="/support"
                                className="btn btn-primary flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                New Message
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSupportMessages;
