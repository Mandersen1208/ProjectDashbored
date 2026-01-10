import { JobSearchDashboard } from "./components/job-search-dashboard";
import { LoginModal } from "./components/login-modal";
import { SignupModal } from "./components/signup-modal";
import { HomePage } from "./components/home-page";
import { ProfilePage } from "./components/profile-page";
import { SavedQueriesPage } from "./components/saved-queries-page";
import { ApplicationsPage } from "./components/applications-page";
import { LogIn, Home, LogOut, Search, UserCircle, BookmarkCheck, Briefcase } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "./services/api";
import type { SavedQuery } from "./types";

export default function App() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState<"home" | "dashboard">("home");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [activeTab, setActiveTab] = useState<"search" | "profile" | "saved-queries" | "applications">("search");
    const [logoutMessage, setLogoutMessage] = useState<string | null>(null);
    const [savedQueryToExecute, setSavedQueryToExecute] = useState<SavedQuery | null>(null);
    const [refreshSavedQueries, setRefreshSavedQueries] = useState(0); // Counter to trigger refresh

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

    // Listen for forced logout events (from API errors or other tabs)
    useEffect(() => {
        const handleForceLogout = (event: Event) => {
            const customEvent = event as CustomEvent;
            const reason = customEvent.detail || 'Session expired';
            
            // Clear all state
            setIsLoggedIn(false);
            setCurrentPage("home");
            setActiveTab("search");
            setIsLoginModalOpen(false);
            setIsSignupModalOpen(false);
            
            // Show logout message
            setLogoutMessage(reason);
            
            // Clear message after 5 seconds
            setTimeout(() => setLogoutMessage(null), 5000);
        };

        // Listen for storage events (logout from another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'authToken' && !e.newValue) {
                // Token was removed in another tab
                handleForceLogout(new CustomEvent('forceLogout', { detail: 'Logged out from another tab' }));
            }
        };

        window.addEventListener('forceLogout', handleForceLogout);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('forceLogout', handleForceLogout);
            window.removeEventListener('storage', handleStorageChange);
        };
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
        localStorage.clear(); // Clear all localStorage to prevent cache issues
        // Force reload to clear any cached components
        window.location.href = '/';
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

    const handleExecuteSavedQuery = (query: SavedQuery) => {
        setSavedQueryToExecute(query);
        setActiveTab("search");
        setCurrentPage("dashboard");
        localStorage.setItem('currentPage', 'dashboard');
    };

    const handleQuerySaved = () => {
        // Trigger refresh of saved queries list
        setRefreshSavedQueries(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500">
            {/* Logout Message Alert */}
            {logoutMessage && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-top">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold">{logoutMessage}</span>
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20">
                <div className="px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-white">Project Dashboard</h1>
                        {!isLoggedIn && (
                            <button
                                onClick={() => setCurrentPage("home")}
                                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Home
                            </button>
                        )}
                        {/* Tabs in Toolbar - Show when logged in */}
                        {isLoggedIn && (
                            <>
                                <button
                                    onClick={() => {
                                        setActiveTab("search");
                                        setCurrentPage("dashboard");
                                        localStorage.setItem('currentPage', 'dashboard');
                                    }}
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
                                    onClick={() => {
                                        setActiveTab("profile");
                                        setCurrentPage("dashboard");
                                        localStorage.setItem('currentPage', 'dashboard');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        activeTab === "profile"
                                            ? "bg-white/30 text-white border border-white/40"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    <UserCircle className="w-4 h-4" />
                                    My Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab("saved-queries");
                                        setCurrentPage("dashboard");
                                        localStorage.setItem('currentPage', 'dashboard');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        activeTab === "saved-queries"
                                            ? "bg-white/30 text-white border border-white/40"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    <BookmarkCheck className="w-4 h-4" />
                                    Saved Searches
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab("applications");
                                        setCurrentPage("dashboard");
                                        localStorage.setItem('currentPage', 'dashboard');
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                        activeTab === "applications"
                                            ? "bg-white/30 text-white border border-white/40"
                                            : "text-white/80 hover:text-white hover:bg-white/10"
                                    }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    My Applications
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
                ) : isLoggedIn ? (
                    <>
                        {/* Tab Content - Only accessible when logged in */}
                        {activeTab === "search" ? (
                            <JobSearchDashboard 
                                savedQueryToExecute={savedQueryToExecute}
                                onQueryExecuted={() => setSavedQueryToExecute(null)}
                                onQuerySaved={handleQuerySaved}
                            />
                        ) : activeTab === "profile" ? (
                            <ProfilePage />
                        ) : activeTab === "saved-queries" ? (
                            <SavedQueriesPage 
                                onExecuteQuery={handleExecuteSavedQuery}
                                key={refreshSavedQueries}
                            />
                        ) : (
                            <ApplicationsPage />
                        )}
                    </>
                ) : (
                    <HomePage onSwitchToSignup={() => setIsSignupModalOpen(true)} />
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