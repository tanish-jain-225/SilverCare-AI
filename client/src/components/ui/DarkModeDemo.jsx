import React from "react";
import { useDarkMode } from "../../hooks/useDarkMode";

export const DarkModeDemo = () => {
  // Custom hook to manage dark mode and color system
  // This hook should provide the necessary color classes and component styles
  const { isDarkMode, colors, components, getColorClass, getComponentClass } =
    useDarkMode();

  return (
    <div
      className={`min-h-screen ${getColorClass("background", "primary")} transition-colors duration-300`}
    >
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1
            className={`text-4xl font-bold ${getColorClass("text", "primary")}`}
          >
            Dark Mode Demo
          </h1>
          <p className={`text-lg ${getColorClass("text", "secondary")}`}>
            Current theme:{" "}
            <span className="font-semibold">
              {isDarkMode ? "Dark" : "Light"}
            </span>
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className={getComponentClass("card") + " p-6 space-y-4"}>
            <h3
              className={`text-xl font-semibold ${getColorClass("text", "primary")}`}
            >
              Sample Card
            </h3>
            <p className={getColorClass("text", "secondary")}>
              This card demonstrates the dark mode color system with proper
              contrast and transitions.
            </p>
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${getComponentClass("button", "primary")}`}
              >
                Primary
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${getComponentClass("button", "secondary")}`}
              >
                Secondary
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className={getComponentClass("card") + " p-6 space-y-4"}>
            <h3
              className={`text-xl font-semibold ${getColorClass("text", "primary")}`}
            >
              Color Palette
            </h3>
            <div className="space-y-2">
              <div
                className={`p-2 rounded ${getColorClass("background", "secondary")}`}
              >
                <span className={getColorClass("text", "secondary")}>
                  Secondary Background
                </span>
              </div>
              <div
                className={`p-2 rounded ${getColorClass("background", "tertiary")}`}
              >
                <span className={getColorClass("text", "secondary")}>
                  Tertiary Background
                </span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className={getComponentClass("card") + " p-6 space-y-4"}>
            <h3
              className={`text-xl font-semibold ${getColorClass("text", "primary")}`}
            >
              Status Colors
            </h3>
            <div className="space-y-2">
              <div className={getColorClass("status", "success")}>
                Success Message
              </div>
              <div className={getColorClass("status", "warning")}>
                Warning Message
              </div>
              <div className={getColorClass("status", "error")}>
                Error Message
              </div>
              <div className={getColorClass("status", "info")}>
                Info Message
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className={getComponentClass("card") + " p-6 space-y-6"}>
          <h2
            className={`text-2xl font-bold ${getColorClass("text", "primary")}`}
          >
            Form Elements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${getColorClass("text", "secondary")}`}
              >
                Name
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 ${getComponentClass("input")} ${getColorClass("text", "primary")}`}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${getColorClass("text", "secondary")}`}
              >
                Email
              </label>
              <input
                type="email"
                className={`w-full px-3 py-2 ${getComponentClass("input")} ${getColorClass("text", "primary")}`}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${getColorClass("text", "secondary")}`}
            >
              Message
            </label>
            <textarea
              className={`w-full px-3 py-2 ${getComponentClass("input")} ${getColorClass("text", "primary")} resize-none`}
              rows={4}
              placeholder="Enter your message"
            />
          </div>

          <div className="flex gap-3">
            <button
              className={`px-6 py-2 rounded-md font-medium transition-colors ${getComponentClass("button", "primary")}`}
            >
              Submit
            </button>
            <button
              className={`px-6 py-2 rounded-md font-medium transition-colors ${getComponentClass("button", "outline")}`}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Interactive Elements */}
        <div className={getComponentClass("card") + " p-6 space-y-4"}>
          <h2
            className={`text-2xl font-bold ${getColorClass("text", "primary")}`}
          >
            Interactive Elements
          </h2>

          <div className="flex flex-wrap gap-4">
            <button
              className={`px-4 py-2 rounded-md transition-colors ${getColorClass("interactive", "hover")} ${getColorClass("text", "secondary")}`}
            >
              Hover Effect
            </button>

            <button
              className={`px-4 py-2 rounded-md transition-colors ${getColorClass("interactive", "active")} ${getColorClass("text", "secondary")}`}
            >
              Active State
            </button>

            <button
              className={`px-4 py-2 rounded-md transition-colors ${getColorClass("interactive", "focus")} ${getColorClass("text", "secondary")}`}
            >
              Focus State
            </button>
          </div>
        </div>

        {/* Code Example */}
        <div className={getComponentClass("card") + " p-6"}>
          <h2
            className={`text-2xl font-bold mb-4 ${getColorClass("text", "primary")}`}
          >
            Usage Example
          </h2>
          <pre
            className={`p-4 rounded-md ${getColorClass("background", "secondary")} overflow-x-auto`}
          >
            <code className={`text-sm ${getColorClass("text", "secondary")}`}>
              {`import { useDarkMode } from '../hooks/useDarkMode';

const MyComponent = () => {
  const { colors, components, getColorClass } = useDarkMode();
  
  return (
    <div className={getColorClass('background', 'primary')}>
      <h1 className={getColorClass('text', 'primary')}>
        My Component
      </h1>
      <div className={getComponentClass('card')}>
        Content here
      </div>
    </div>
  );
};`}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
