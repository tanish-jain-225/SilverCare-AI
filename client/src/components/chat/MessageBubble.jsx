import React from "react";
import { User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useApp } from "../../context/AppContext";
import { formatTimestamp } from "../../utils/helper";

export function MessageBubble({ message, isUser, isError, timestamp, index }) {
  const formatTime = (timestamp) => {
    return formatTimestamp(timestamp);
  };

  const { user, logout } = useApp();

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } animate-fade-in`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={`flex items-start gap-3 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%] ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-primary-200 text-white border border-neutral-400"
              : isError
              ? "bg-red-500 text-white"
              : " bg-white dark:bg-neutral-800 text-white  border border-neutral-400"
          }`}
        >
          {isUser ? (
            user?.profilePicture?.data ? (
              <img
                src={user.profilePicture.data}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-primary-200"
              />
            ) : (
              <User className="w-5 h-5" />
            )
          ) : (
            <img src="/bot-image.png" className="w-5 h-5" />
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
            isUser
              ? "bg-primary-200 text-white rounded-br-md"
              : isError
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md"
          }`}
        >
          <div className="text-sm sm:text-base leading-relaxed">
            {isUser ? (
              <span>{message}</span>
            ) : (
              <div
                className={`${
                  isError
                    ? "text-red-800 dark:text-red-200"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside mb-2 space-y-1">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside mb-2 space-y-1">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-sm">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-gray-200 dark:bg-gray-600 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                        {children}
                      </pre>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {message}
                </ReactMarkdown>
              </div>
            )}
          </div>
          <div
            className={`text-xs mt-2 opacity-70 ${
              isUser
                ? "text-blue-100"
                : isError
                ? "text-red-600 dark:text-red-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
