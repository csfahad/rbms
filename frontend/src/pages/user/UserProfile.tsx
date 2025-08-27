import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";
import { User, Mail, Phone, Lock, Save } from "lucide-react";
import { userService } from "../../services/userService";

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // initialize form data when user data is available
    useEffect(() => {
        if (user) {
            setFormData((prev) => ({
                ...prev,
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            toast.error("Name is required");
            return;
        }

        if (!formData.phone.trim()) {
            toast.error("Phone number is required");
            return;
        }

        // check if password change is requested
        const isPasswordChange =
            formData.currentPassword ||
            formData.newPassword ||
            formData.confirmPassword;

        if (isPasswordChange) {
            if (!formData.currentPassword) {
                toast.error("Current password is required to change password");
                return;
            }

            if (!formData.newPassword) {
                toast.error("New password is required");
                return;
            }

            if (formData.newPassword.length < 6) {
                toast.error("New password must be at least 6 characters");
                return;
            }

            if (formData.newPassword !== formData.confirmPassword) {
                toast.error("New passwords do not match");
                return;
            }
        }

        setIsLoading(true);

        try {
            // update profile (name and phone)
            const profileResponse = await userService.updateProfile(
                formData.name,
                formData.phone
            );

            // update user data in context
            updateUser(profileResponse.user);

            // change password if requested
            if (isPasswordChange) {
                await userService.changePassword(
                    formData.currentPassword,
                    formData.newPassword
                );

                setFormData((prev) => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                }));

                toast.success("Profile and password updated successfully");
            } else {
                toast.success("Profile updated successfully");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-10 fade-in">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Profile Settings
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="name" className="form-label">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
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
                                        className="form-input pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        readOnly
                                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Email cannot be changed
                                </p>
                            </div>{" "}
                            <div>
                                <label htmlFor="phone" className="form-label">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                phone: e.target.value,
                                            }))
                                        }
                                        className="form-input pl-10"
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="border-t border-gray-200 pt-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">
                                    Change Password
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="currentPassword"
                                            className="form-label"
                                        >
                                            Current Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                id="currentPassword"
                                                value={formData.currentPassword}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        currentPassword:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="form-input pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="newPassword"
                                            className="form-label"
                                        >
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                value={formData.newPassword}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        newPassword:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="form-input pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="form-label"
                                        >
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        confirmPassword:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="form-input pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary flex items-center"
                            >
                                {isLoading ? (
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
        </div>
    );
};

export default UserProfile;
