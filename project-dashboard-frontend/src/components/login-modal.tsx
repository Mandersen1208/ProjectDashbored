import { X } from "lucide-react";
import { useState } from "react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
    onSwitchToSignup: () => void;
}

export function LoginModal({ isOpen, onClose, onLogin, onSwitchToSignup }: LoginModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login attempt:", { email, password });
        // Add your login logic here
        onLogin();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 border border-purple-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Header */}
                <h2 className="mb-6 bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                    Login
                </h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block mb-2 text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-2 text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                            />
                            Remember me
                        </label>
                        <a href="#" className="text-purple-600 hover:text-purple-700 transition-colors">
                            Forgot password?
                        </a>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                        Login
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={onSwitchToSignup}
                            className="text-purple-600 hover:text-purple-700 transition-colors"
                        >
                            Don't have an account? Sign up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}