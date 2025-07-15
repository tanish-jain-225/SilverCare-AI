import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { VoiceButton } from "../components/voice/VoiceButton";
import { useApp } from "../context/AppContext";
import { useVoice } from "../hooks/useVoice";
import { motion } from "framer-motion";
import LoadingScreen from "../components/LoadingScreen";

export function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, isAuthenticated, loading } = useApp();
  const { speak } = useVoice();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPostSignupLoading, setIsPostSignupLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect to user-details if already authenticated (instead of home)
  React.useEffect(() => {
    if (!loading && isAuthenticated && location.pathname === "/signup") {
      navigate("/user-details", { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signup(name, email, password);
      // If we reach here, signup was successful
      setIsPostSignupLoading(true);
      speak("Account created successfully! Setting up your profile...");
      
      // Navigate after a brief loading period
      setTimeout(() => {
        navigate("/user-details");
      }, 2500);
    } catch (err) {
      // Display the detailed error message from AppContext, falling back to code-based messages
      let errorMessage = err.message;
      
      if (!errorMessage && err.code) {
        // Fallback error messages if AppContext didn't provide a message
        switch (err.code) {
          case "auth/email-already-in-use":
            errorMessage = "Account already in use. Please log in or use a different email.";
            break;
          case "auth/invalid-email":
            errorMessage = "Invalid email address. Please enter a valid email.";
            break;
          case "auth/weak-password":
            errorMessage = "Password is too weak. Please use at least 6 characters.";
            break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your connection and try again.";
            break;

          default:
            errorMessage = "Signup failed. Please try again.";
        }
      } else if (!errorMessage) {
        errorMessage = "Signup failed. Please try again.";
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = (field) => (text) => {
    if (field === "name") {
      setName(text);
    } else if (field === "email") {
      setEmail(text);
    } else {
      setPassword(text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  React.useEffect(() => {
    speak("Welcome! Let's create your SilverCare AI account.");
  }, [speak]);

  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  }, []);

  // Show post-signup loading screen
  if (isPostSignupLoading) {
    return <LoadingScreen message="Creating your account and setting up your profile..." />;
  }

  // Show loading while checking authentication status
  if (loading) {
    return <LoadingScreen message="Checking authentication status..." />;
  }

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-blue-200 via-gray-200 to-yellow-100
 flex items-center justify-center p-2 sm:p-4 font-sans"
    >
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
            Sign Up
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
            {/* Name Field */}
            <div className="relative flex items-center min-w-0">
              <Input
                type="text"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
                required
                className="pr-14 sm:pr-16 md:pr-20 min-w-0 text-base sm:text-lg md:text-xl"
              />
              <div className="absolute inset-y-0 right-4 top-4 flex items-center pointer-events-auto">
                <VoiceButton
                  onResult={handleVoiceInput("name")}
                  size="sm"
                  className="!w-9 sm:!w-10"
                  type="button"
                  tabIndex={-1}
                />
              </div>
            </div>

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
                className="text-base sm:text-lg md:text-2xl"
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

            {/* Signup Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 text-lg sm:text-xl md:text-2xl font-semibold"
              size="xl"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-4">
            <p className="text-gray-700 font-semibold text-sm sm:text-base md:text-lg leading-relaxed">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-800 font-semibold"
              >
                Log in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
