import React, { useState, useEffect } from "react";
import { BlogCard } from "../components/BlogCard";
import { fetchNewsByText } from "../utils/apiService";
import { motion } from "framer-motion";
import { useVoice } from "../hooks/useVoice";

export function BlogSection() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [welcomeShown, setWelcomeShown] = useState(false);
  
  const { speak } = useVoice();

  const fallbackArticles = [
    {
      id: 1,
      title: "Fallback Article 1",
      description: "This is a dummy description for fallback article 1.",
      url: "#",
      urlToImage: "/logo.png",
      publishedAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Fallback Article 2",
      description: "This is a dummy description for fallback article 2.",
      url: "#",
      urlToImage: "/logo.png",
      publishedAt: new Date().toISOString(),
    },
  ];

  // Only text search, no category logic
  const fetchArticles = async (text) => {
    try {
      setLoading(true);
      setError(null);
      const articles = await fetchNewsByText(text || "latest news");
      const filteredArticles = articles.filter(
        (article) => article.urlToImage && article.description
      );
      const sortedArticles = filteredArticles.sort(
        (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
      );
      setFeaturedArticles(sortedArticles.slice(0, 3));
      setArticles(sortedArticles.length > 0 ? sortedArticles : fallbackArticles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      setError("Failed to load news articles. Please try again later.");
      setArticles(fallbackArticles);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchArticles(searchText);
  };

  useEffect(() => {
    fetchArticles(""); // Initial load with latest news
    
    // Show welcome message when component loads
    if (!welcomeShown) {
      setWelcomeShown(true);
      const welcomeMessage = "Welcome to the Blog Section! Here you can find the latest health and wellness news articles.";
      speak(welcomeMessage);
    }
  }, [welcomeShown, speak]);

  // Manual carousel controls only - no auto-rotation
  
  const goToPrevious = () => {
    setCurrentFeaturedIndex((prev) =>
      prev === 0 ? featuredArticles.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentFeaturedIndex((prev) =>
      prev === featuredArticles.length - 1 ? 0 : prev + 1
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 pb-20">
      {/* Search Bar */}
      <div className="w-full p-4 flex flex-col items-center bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearch} className="flex w-full max-w-2xl gap-3 flex-col sm:flex-row items-center">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search news articles..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white text-base shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors text-base shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && <div className="text-red-500 mt-3 text-sm text-center max-w-2xl">{error}</div>}
      </div>

      {/* Hero Section with Featured Posts */}
      {featuredArticles.length > 0 && (
        <section className="relative w-full h-[200px] xs:h-[240px] sm:h-[300px] md:h-[350px] lg:h-[420px] overflow-hidden shadow-lg bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          {featuredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${index === currentFeaturedIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentFeaturedIndex ? 1 : 0 }}
              transition={{ duration: 1 }}
            >
              <div className="relative w-full h-full flex flex-col justify-end">
                <img
                  src={article.urlToImage}
                  alt="Featured Article"
                  className="w-full h-full object-cover object-center absolute inset-0 brightness-90 dark:brightness-75"
                  style={{ zIndex: 0 }}
                />
                <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 xs:p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col gap-2 sm:gap-3 max-w-full">
                  <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 max-w-full sm:max-w-2xl md:max-w-3xl line-clamp-2 drop-shadow-lg">
                    {article.title}
                  </h2>
                  <p className="text-gray-200 text-xs xs:text-sm sm:text-base md:text-lg mb-3 sm:mb-4 max-w-full sm:max-w-xl md:max-w-2xl line-clamp-2 sm:line-clamp-3 drop-shadow-sm">
                    {article.description}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-fit bg-white/95 text-gray-900 px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-white transition-colors duration-300 text-xs sm:text-sm md:text-base shadow-md hover:shadow-lg"
                  >
                    Read Full Story
                  </a>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Navigation Arrows */}
          {featuredArticles.length > 1 && (
            <>
              {/* Previous Arrow */}
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 md:left-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                aria-label="Previous article"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Arrow */}
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 md:right-6 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all duration-300 hover:scale-110 group"
                aria-label="Next article"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Featured Post Indicators */}
          <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {featuredArticles.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeaturedIndex(index)}
                className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 border border-white/70 ${index === currentFeaturedIndex
                  ? "bg-white scale-125 shadow-lg"
                  : "bg-white/50 hover:bg-white/80"
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Divider with decorative element */}
        <div className="relative mt-8 mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-1 p-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span>
              Latest Articles
              </span>
            </span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl font-medium">No News to Show</p>
            <p className="text-sm mt-2 text-gray-400">Try searching for something else</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 pb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {articles.map((article, index) => (
              <motion.div key={article.id} variants={itemVariants} className="h-full">
                <BlogCard article={article} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}