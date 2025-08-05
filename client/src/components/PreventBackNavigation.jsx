import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

function PreventBackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useApp();

  useEffect(() => {
    if (!isAuthenticated) return;

    const handlePopState = (event) => {
      // Always force navigation to the current route, blocking all back/forward
      navigate(location.pathname, { replace: true });
      window.history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location, navigate, isAuthenticated]);

  return null;
}

export default PreventBackNavigation; 