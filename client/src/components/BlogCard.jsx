import React from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";

export function BlogCard({ article }) {
  const { title, description, url, urlToImage, publishedAt } = article;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSpeakTitle = () => {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create new speech utterance
      const utterance = new SpeechSynthesisUtterance(title);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Speak the title
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div
      className="group bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden h-40 sm:h-48 lg:h-52">
        {/* Speak Button - positioned at top right corner */}
        <button
          onClick={handleSpeakTitle}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:shadow-xl backdrop-blur-sm border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center group/speak"
          aria-label={`Read aloud: ${title}`}
          title="Click to hear article title"
        >
          <Volume2 className="w-4 h-4 text-gray-700 dark:text-gray-300 group-hover/speak:text-blue-600 dark:group-hover/speak:text-blue-400 transition-colors duration-200" />
        </button>
        
        {urlToImage ? (
          <img
            src={urlToImage}
            alt="Article Image"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
            <img src="/bot-image.png" alt="Fallback Image" className="h-12 sm:h-16 opacity-70" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 lg:p-6 flex flex-col flex-grow">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(publishedAt)}
        </div>

        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 leading-tight">
          {title}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 line-clamp-3 flex-grow leading-relaxed">
          {description || "No description available."}
        </p>

        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 text-sm sm:text-base group/link"
          >
            Read Full Article
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 ml-1 group-hover/link:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
