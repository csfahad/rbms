import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Reply,
    Eye,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { supportService } from "../../services/supportService";
import { useAuth } from "../../contexts/AuthContext";

interface SupportMessage {
    id: string;
    user_id?: string;
    user_name?: string;
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

const AdminSupportMessages = () => {
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] =
        useState<SupportMessage | null>(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [response, setResponse] = useState("");
    const [isResponding, setIsResponding] = useState(false);
    const [isEditingResponse, setIsEditingResponse] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const { user } = useAuth();

    const fetchMessages = async (page = 1, status = statusFilter) => {
        setLoading(true);
        try {
            const data = await supportService.getMessages({
                status: status === "all" ? undefined : status,
                page,
                limit: pagination.limit,
            });
            setMessages(data.messages);
            setPagination(data.pagination);
        } catch (error: any) {
            toast.error(error.message || "Failed to load support messages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === "admin") {
            fetchMessages();
        }
    }, [user?.role]);

    const handleStatusFilterChange = (status: string) => {
        setStatusFilter(status);
        fetchMessages(1, status);
    };

    const handlePageChange = (page: number) => {
        fetchMessages(page, statusFilter);
    };

    const handleViewMessage = (message: SupportMessage) => {
        setSelectedMessage(message);
    };

    const handleRespondClick = (message: SupportMessage) => {
        setSelectedMessage(message);
        setResponse("");
        setIsEditingResponse(false);
        setShowResponseModal(true);
    };

    const handleEditResponseClick = (message: SupportMessage) => {
        setSelectedMessage(message);
        setResponse(message.admin_response || "");
        setIsEditingResponse(true);
        setShowResponseModal(true);
    };

    const handleSubmitResponse = async () => {
        if (!selectedMessage || !response.trim()) {
            toast.error("Please enter a response");
            return;
        }

        setIsResponding(true);
        try {
            await supportService.respondToMessage(selectedMessage.id, response);
            toast.success("Response sent successfully!");

            setShowResponseModal(false);
            setResponse("");
            setSelectedMessage(null);
            setIsEditingResponse(false);

            await fetchMessages(pagination.page, statusFilter);
        } catch (error: any) {
            toast.error(error.message || "Failed to send response");
        } finally {
            setIsResponding(false);
        }
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

    if (user?.role !== "admin") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-600">
                        You need admin privileges to view this page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Support Messages
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Manage customer support requests
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Filter className="h-5 w-5 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                                Status:
                            </span>
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    handleStatusFilterChange(e.target.value)
                                }
                                className="form-select text-sm"
                            >
                                <option value="all">All Messages</option>
                                <option value="pending">Pending</option>
                                <option value="responded">Responded</option>
                            </select>
                        </div>
                        <div className="text-sm text-gray-500">
                            Total: {pagination.total} messages
                        </div>
                    </div>
                </div>

                {/* Messages List */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                            <p className="mt-2 text-gray-600">
                                Loading messages...
                            </p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No messages found
                            </h3>
                            <p className="text-gray-600">
                                No support messages match your current filter.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Message
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {message.subject}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        From: {message.name} (
                                                        {message.email})
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                        {message.message}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(
                                                        message.status
                                                    )}
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                                            message.status
                                                        )}`}
                                                    >
                                                        {message.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(
                                                    message.created_at
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleViewMessage(
                                                                message
                                                            )
                                                        }
                                                        className="btn btn-secondary btn-sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleRespondClick(
                                                                message
                                                            )
                                                        }
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        <Reply className="h-4 w-4" />
                                                    </button>
                                                </div>
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
            {selectedMessage && !showResponseModal && (
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
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    From
                                </label>
                                <p className="mt-1 text-gray-900">
                                    {selectedMessage.name} (
                                    {selectedMessage.email})
                                </p>
                            </div>

                            {/* User Message Section */}
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                <div className="flex items-center mb-2">
                                    <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                                    <label className="text-sm font-medium text-blue-800">
                                        {selectedMessage.name}
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
                            {selectedMessage.admin_response && (
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
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="btn btn-secondary"
                            >
                                Close
                            </button>
                            <button
                                onClick={() =>
                                    selectedMessage.admin_response
                                        ? handleEditResponseClick(
                                              selectedMessage
                                          )
                                        : handleRespondClick(selectedMessage)
                                }
                                className="btn btn-primary flex items-center"
                            >
                                <Reply className="h-4 w-4 mr-2" />
                                {selectedMessage.admin_response
                                    ? "Edit Response"
                                    : "Respond"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Response Modal */}
            {showResponseModal && selectedMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {isEditingResponse
                                    ? "Edit Response"
                                    : "Respond to Message"}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Subject: {selectedMessage.subject}
                            </p>
                        </div>
                        <div className="p-6">
                            <div className="mb-6">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                    Original Message from {selectedMessage.name}
                                </label>
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                    <div className="flex items-center mb-2">
                                        <MessageSquare className="h-4 w-4 text-blue-600 mr-2" />
                                        <span className="text-sm font-medium text-blue-800">
                                            {selectedMessage.name}
                                        </span>
                                    </div>
                                    <p className="text-gray-900 text-sm whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                    <p className="mt-2 text-xs text-blue-600">
                                        From: {selectedMessage.email} | Sent:{" "}
                                        {new Date(
                                            selectedMessage.created_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {selectedMessage.admin_response && (
                                <div className="mb-6">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                                        Previous Response
                                    </label>
                                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                                        <div className="flex items-center mb-2">
                                            <Reply className="h-4 w-4 text-green-600 mr-2" />
                                            <span className="text-sm font-medium text-green-800">
                                                Previous Admin Response
                                            </span>
                                        </div>
                                        <p className="text-gray-900 text-sm whitespace-pre-wrap">
                                            {selectedMessage.admin_response}
                                        </p>
                                        <p className="mt-2 text-xs text-green-600">
                                            By: {selectedMessage.admin_name} |
                                            Sent:{" "}
                                            {new Date(
                                                selectedMessage.responded_at!
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="response"
                                    className="text-sm font-medium text-gray-700 mb-2 block"
                                >
                                    {isEditingResponse
                                        ? "Update Your Response"
                                        : "Your Response"}
                                </label>
                                <textarea
                                    id="response"
                                    rows={6}
                                    value={response}
                                    onChange={(e) =>
                                        setResponse(e.target.value)
                                    }
                                    className="form-input"
                                    placeholder="Type your response here..."
                                    required
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowResponseModal(false);
                                    setResponse("");
                                    setSelectedMessage(null);
                                    setIsEditingResponse(false);
                                }}
                                className="btn btn-secondary"
                                disabled={isResponding}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitResponse}
                                disabled={isResponding || !response.trim()}
                                className="btn btn-primary flex items-center"
                            >
                                {isResponding ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Reply className="h-4 w-4 mr-2" />
                                        {isEditingResponse
                                            ? "Update Response"
                                            : "Send Response"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSupportMessages;
