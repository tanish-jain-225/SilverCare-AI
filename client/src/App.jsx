import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { ThemeProvider } from "./context/ThemeContext";
import { RootLayout } from "./components/layout/RootLayout";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { UserDetails } from "./pages/UserDetails";
import { Home } from "./pages/Home";
import { BlogSection } from "./pages/BlogSection";
import { Reminders } from "./pages/Reminders";
import Emergency from "./pages/Emergency";
import { AskQueries } from "./pages/AskQueries";
import { Profile } from "./pages/Profile";
import { Header } from "./components/layout/Header";
import { BottomNavigation } from "./components/layout/BottomNavigation";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingScreen from "./components/LoadingScreen";

// ProtectedRoute component - defined outside to ensure proper context access
function ProtectedRoute({ children }) {
  try {
    const { isAuthenticated, loading } = useApp();
    // While auth state is loading, show the loading screen
    if (loading) return <LoadingScreen />;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  } catch (error) {
    console.error("ProtectedRoute error:", error);
    // Fallback to redirect to login if context is not available
    return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  const location = useLocation();

  // Define routes where layout should be hidden
  const hideLayoutRoutes = ["/login", "/signup", "/user-details"];

  // Define routes where only bottom navigation should be hidden
  const hideBottomNavRoutes = ["/ask-queries"];

  // Check if current path matches any of the hideLayoutRoutes
  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname);

  // Check if current path matches any of the hideBottomNavRoutes
  const shouldHideBottomNav = hideBottomNavRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideLayout && <Header />}
      <RootLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/user-details"
              element={
                <ProtectedRoute>
                  <UserDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/blog"
              element={
                <ProtectedRoute>
                  <BlogSection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reminders"
              element={
                <ProtectedRoute>
                  <Reminders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency"
              element={
                <ProtectedRoute>
                  <Emergency />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ask-queries"
              element={
                <ProtectedRoute>
                  <AskQueries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            {/* Catch-all: redirect unknown paths to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </RootLayout>
      {!shouldHideLayout && !shouldHideBottomNav && <BottomNavigation />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppProvider>
            <AppRoutes />
          </AppProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
