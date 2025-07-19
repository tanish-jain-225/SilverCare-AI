import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PreventBackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Push current location to history stack
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (event) => {
      // Always push the user back to the current location
      window.history.pushState(null, "", window.location.href);
      // Optionally, force navigation to a specific route:
      // navigate(location.pathname, { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location, navigate]);

  return null;
}

export default PreventBackNavigation; 