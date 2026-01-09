import { JobSearchDashboard } from "./components/job-search-dashboard";
import { LoginModal } from "./components/login-modal";
import { SignupModal } from "./components/signup-modal";
import { HomePage } from "./components/home-page";
import { ProfilePage } from "./components/profile-page";
import { LogIn, Home, LogOut, Search, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "./services/api";

export default function App() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<"home" | "dashboard">("home");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState<"search" | "profile">("search");

    // Check if user is already logged in on mount (restore state from localStorage)
    useEffect(() => {
        if (api.isAuthenticated()) {
            setIsLoggedIn(true);
            // If user was on dashboard before refresh, restore that view
            const savedPage = localStorage.getItem('currentPage');
            if (savedPage === 'dashboard') {
                setCurrentPage('dashboard');
            }
        }
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
        setCurrentPage("dashboard");
        localStorage.setItem('currentPage', 'dashboard');
    };

    const handleLogout = () => {
        // Call API logout to clear tokens
        api.logout();
        setIsLoggedIn(false);
        setCurrentPage("home");
        setActiveTab("search");
        localStorage.removeItem('currentPage');
    };

    const switchToSignup = () => {
        setIsLoginModalOpen(false);
        setIsSignupModalOpen(true);
    };

    const switchToLogin = () => {
        setIsSignupModalOpen(false);
        setIsLoginModalOpen(true);
    };

    const handleSignup = () => {
        // Add signup logic here
        setIsSignupModalOpen(false);
        setIsLoggedIn(true);
        setCurrentPage("dashboard");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
            {/* Toolbar */}
            <div className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-white">Project Dashboard</h1>
                        <button
                            onClick={() => setCurrentPage("home")}
                            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            Home
                        </button>
                        {/* Tabs in Toolbar - Only show when logged in and on dashboard */}
                        {isLoggedIn && currentPage === "dashboard" && (
                            <>
                                <button
                                    onClick={() => setActiveTab("search")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        activeTab === "search"
                                            ? "bg-white/30 text-white border border-white/40"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    <Search className="w-4 h-4" />
                                    Job Search
                                </button>
                                <button
                                    onClick={() => setActiveTab("profile")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        activeTab === "profile"
                                            ? "bg-white/30 text-white border border-white/40"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    <UserCircle className="w-4 h-4" />
                                    My Profile
                                </button>
                            </>
                        )}
                    </div>
                    <div>
                        {isLoggedIn ? (
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-white/30"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all backdrop-blur-sm border border-white/30"
                            >
                                <LogIn className="w-4 h-4" />
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
                {currentPage === "home" ? (
                    <HomePage onSwitchToSignup={() => setIsSignupModalOpen(true)} />
                ) : (
                    <>
                        {/* Tab Content */}
                        {isLoggedIn ? (
                            activeTab === "search" ? (
                                <JobSearchDashboard />
                            ) : (
                                <ProfilePage />
                            )
                        ) : (
                            <JobSearchDashboard />
                        )}
                    </>
                )}
            </div>

            {/* Login Modal */}
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLogin={handleLogin}
                onSwitchToSignup={switchToSignup}
            />

            {/* Signup Modal */}
            <SignupModal
                isOpen={isSignupModalOpen}
                onClose={() => setIsSignupModalOpen(false)}
                onSignup={handleSignup}
                onSwitchToLogin={switchToLogin}
            />
        </div>
    );
}