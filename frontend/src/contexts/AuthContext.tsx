import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useCallback,
} from "react";
import { flushSync } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../services/api";

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "user" | "admin";
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithData: (user: User) => void;
    updateUser: (user: User) => void;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // try to verify if user is authenticated via HTTP-only cookie
        apiRequest("/auth/verify")
            .then((data) => {
                if (data.user) {
                    setUser(data.user);

                    // redirect from login/register pages if already authenticated
                    if (["/login", "/register"].includes(location.pathname)) {
                        navigate("/");
                    }
                }
            })
            .catch((error) => {
                console.error("Token verification failed:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [navigate, location]);

    const login = async (email: string, password: string) => {
        const data = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        setUser(data.user);
    };

    const register = async (name: string, email: string, password: string) => {
        const data = await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
        });
        setUser(data.user);
    };

    const loginWithData = (userData: User) => {
        // with HTTP-only cookies, we don't store the token client-side
        // the server should have already set the HTTP-only cookie
        setUser(userData);
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    const logout = useCallback(async () => {
        try {
            await apiRequest("/auth/logout", {
                method: "POST",
            });
        } catch (error) {
            console.error("Logout error:", error);
        }

        // force immediate state update
        flushSync(() => {
            setUser(null);
        });

        navigate("/login");
    }, [navigate]);

    if (isLoading) {
        return (
            <div>
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
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isAdmin: user?.role === "admin",
                login,
                loginWithData,
                updateUser,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
