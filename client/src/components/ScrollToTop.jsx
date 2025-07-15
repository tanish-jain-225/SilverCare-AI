import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({ behavior = 'smooth', excludeRoutes = [] }) => {
  const { pathname } = useLocation();
  const isInitialMount = useRef(true);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // Skip scroll to top on initial mount (page refresh/first load)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathname.current = pathname;
      return;
    }

    // Skip scroll for excluded routes
    if (excludeRoutes.includes(pathname)) {
      prevPathname.current = pathname;
      return;
    }

    // Only scroll if the pathname actually changed (navigation between different pages)
    if (prevPathname.current !== pathname) {
      // Use setTimeout to ensure the new route has rendered before scrolling
      const scrollTimer = setTimeout(() => {
        // Check if the document has content to scroll
        const hasScrollableContent = document.documentElement.scrollHeight > window.innerHeight;
        
        if (hasScrollableContent || window.scrollY > 0) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: behavior
          });
        }
      }, 0);

      // Update previous pathname
      prevPathname.current = pathname;

      // Cleanup timer
      return () => clearTimeout(scrollTimer);
    }
  }, [pathname, behavior, excludeRoutes]);

  return null;
};

export default ScrollToTop;
