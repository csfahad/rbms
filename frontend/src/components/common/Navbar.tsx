import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import Logo from "./Logo";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, isAdmin, user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        setIsMenuOpen(false);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <Logo size="md" showText={true} />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link
                            to="/"
                            className="px-3 py-2 text-primary hover:text-primary-light transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            to="/search"
                            className="px-3 py-2 text-primary hover:text-primary-light transition-colors"
                        >
                            Search Trains
                        </Link>

                        {isAuthenticated ? (
                            <>
                                {isAdmin ? (
                                    <Link
                                        to="/admin/dashboard\"
                                        className="px-3 py-2 text-primary hover:text-primary-light transition-colors"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        to="/user/bookings"
                                        className="px-3 py-2 text-primary hover:text-primary-light transition-colors"
                                    >
                                        My Bookings
                                    </Link>
                                )}
                                <div className="relative ml-3 group">
                                    <button className="flex items-center text-primary hover:text-primary-light">
                                        <span className="mr-2">
                                            {user?.name}
                                        </span>
                                        <User className="h-5 w-5 text-primary hover:text-primary-light" />
                                    </button>
                                    <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                        {isAdmin ? (
                                            <Link
                                                to="/admin/dashboard\"
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-light hover:bg-gray-100"
                                            >
                                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                                Dashboard
                                            </Link>
                                        ) : (
                                            <Link
                                                to="/user/dashboard"
                                                className="w-full text-left flex items-center px-4 py-2 text-sm text-primary-light hover:bg-gray-100"
                                            >
                                                <LayoutDashboard className="h-4 w-4 mr-2" />
                                                Dashboard
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-secondary">
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex md:hidden items-center">
                        <button
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
                        >
                            {isMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white pt-2 pb-4 px-4 shadow-lg slide-up">
                    <div className="flex flex-col space-y-2">
                        <Link
                            to="/"
                            className="px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/search"
                            className="px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Search Trains
                        </Link>

                        {isAuthenticated ? (
                            <>
                                {isAdmin ? (
                                    <Link
                                        to="/admin/dashboard"
                                        className="px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        to="/user/bookings"
                                        className="px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        My Bookings
                                    </Link>
                                )}
                                <hr className="my-2" />
                                <div className="px-3 py-2 text-gray-700">
                                    Signed in as:{" "}
                                    <span className="font-medium text-[#3F51B5]">
                                        {user?.name}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-left flex items-center"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col space-y-2 pt-2">
                                <Link
                                    to="/login"
                                    className="btn btn-secondary w-full text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn btn-primary w-full text-center"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
