import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { VoiceButton } from "../components/voice/VoiceButton";
import { useApp } from "../context/AppContext";
import { useVoice } from "../hooks/useVoice";
import { useTheme } from "../context/ThemeContext";
import { motion } from "framer-motion";

export function Login() {
  const navigate = useNavigate();
  const {
    login,
    loginWithGoogle,
    isAuthenticated,
    loading,
    hasCompletedUserDetails,
  } = useApp();
  const { speak } = useVoice();
  const { setTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      // If we reach here, login was successful

      // Set Theme to light mode after login with moon icon
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("SilverCare_theme", "light");
      setTheme("light"); // Sync ThemeContext state for correct icon
      speak("Login successful. Welcome to SilverCare AI!");

      // Login always goes directly to home page
      navigate("/home");
    } catch (err) {
      // Display the detailed error message from AppContext
      const errorMessage = err.message || "Login failed. Please try again.";
      setError(errorMessage);
      speak("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const success = await loginWithGoogle();
      if (success) {
        // Set theme to light mode
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        localStorage.setItem("SilverCare_theme", "light");
        setTheme("light");
        speak("Google login successful. Welcome to SilverCare AI!");

        // Google login always goes directly to home page
        navigate("/home");
      } else {
        setError("Google login failed. Please try again.");
        speak("Google login failed. Please try again.");
      }
    } catch (err) {
      console.error("Google login error:", err);

      // Handle specific error types with user-friendly messages
      let errorMessage = "Google login failed. Please try again.";

      if (err.code === "network-request-failed") {
        errorMessage =
          "Network connection failed. Please check your internet connection and try again.";
      } else if (err.code === "popup-blocked") {
        errorMessage =
          "Popup was blocked by your browser. Please allow popups for this site and try again.";
      } else if (err.code === "popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (err.code === "cancelled-popup-request") {
        errorMessage =
          "Another sign-in request is in progress. Please wait and try again.";
      } else if (err.code === "internal-error") {
        errorMessage =
          "A temporary authentication error occurred. Please try again in a moment.";
      } else if (err.code === "account-exists-with-different-credential") {
        errorMessage =
          "An account already exists with this email using a different sign-in method. Please try signing in with email/password.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      speak(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleVoiceInput = (field) => (text) => {
    if (field === "email") {
      setEmail(text);
    } else {
      setPassword(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  React.useEffect(() => {
    speak("Welcome to SilverCare AI. Please enter your login details.");
  }, [speak]);

  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-blue-200 via-gray-200 to-yellow-100 flex items-center justify-center p-2 sm:p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto w-full max-w-md md:max-w-lg lg:max-w-xl px-2 sm:px-4"
      >
        <div className="text-center mb-4">
          <div className="flex items-center gap-2 md:flex-row justify-center flex-col">
            <div className="logo">
              <img
                src="/voice-search.png"
                alt="SilverCareAI Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto"
              />
            </div>
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl font-extrabold text-gray-700 bg-clip-text md:mb-2 leading-tight"
            >
              SilverCareAI
            </motion.h1>
          </div>
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600 tracking-wide leading-relaxed"
          >
            Login
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full"
        >
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="space-y-5 sm:space-y-6 md:space-y-8"
            autoComplete="off"
          >
            {/* Email Field */}
            <div className="relative flex items-center min-w-0">
              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={Mail}
                required
                className="pr-14 sm:pr-16 md:pr-20 min-w-0 text-base sm:text-lg md:text-xl"
              />
              <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                <VoiceButton
                  onResult={handleVoiceInput("email")}
                  size="sm"
                  className="!w-9 sm:!w-10"
                  type="button"
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="relative flex items-center min-w-0">
              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
                className="text-base sm:text-lg md:text-xl"
                voiceButton={
                  <VoiceButton
                    onResult={handleVoiceInput("password")}
                    size="sm"
                    className="!w-9 sm:!w-10"
                    type="button"
                    tabIndex={-1}
                  />
                }
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-red-600 text-center bg-red-50 p-3 rounded-lg w-full text-sm sm:text-base md:text-lg leading-relaxed"
              >
                {error}
              </motion.div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 text-lg sm:text-xl md:text-2xl font-semibold"
              size="xl"
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>

            {/* Divider with improved design */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 py-2 bg-white  text-gray-600  font-medium text-sm sm:text-base rounded-full shadow-md border border-gray-200  backdrop-blur-sm">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                pointerEvents: isLoading || isGoogleLoading ? "none" : "auto",
              }}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 font-medium text-lg sm:text-xl md:text-2xl">
                {isGoogleLoading ? "Signing in..." : "Sign in with Google"}
              </span>
            </div>
          </form>

          {/* Troubleshooting for Google Login Issues */}
          {error &&
            (error.includes("popup") ||
              error.includes("Network") ||
              error.includes("authentication error")) && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                  Having trouble with Google Sign-in?
                </h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  {error.includes("popup") && (
                    <p>
                      • Allow popups for this website in your browser settings
                    </p>
                  )}
                  {error.includes("Network") && (
                    <p>• Check your internet connection and try again</p>
                  )}
                  <p>• Try clearing your browser cache and cookies</p>
                  <p>• Disable ad blockers temporarily</p>
                  <p>• Try using email/password sign-in instead</p>
                </div>
              </div>
            )}

          {/* Signup Link */}
          <div className="text-center mt-4">
            <p className="text-gray-700 font-semibold text-sm sm:text-base md:text-lg leading-relaxed">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-500 hover:text-blue-800 font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
