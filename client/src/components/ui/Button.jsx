import React from "react";
import PropTypes from "prop-types";

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  icon: Icon,
  disabled = false,
  type = "button",
  fullWidth = false,
  className = "",
  ariaLabel,
  ...props
}) {
  const improvedBaseClasses =
    "font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 focus:outline-none focus-visible:ring-2 sm:focus-visible:ring-4 focus-visible:ring-offset-1 sm:focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-200",
    secondary:
      "bg-green-600 hover:bg-green-700 text-white focus-visible:ring-green-200",
    danger: "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-200",
    outline:
      "border-2 border-gray-300 hover:border-blue-400 text-gray-700 bg-white focus-visible:ring-blue-100",
    subtle: "bg-gray-100 hover:bg-gray-200 text-gray-800 focus-visible:ring-gray-200",
  };
  const sizeClasses = {
    sm: "px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm",
    md: "px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base",
    lg: "px-5 sm:px-7 py-2.5 sm:py-3 text-base sm:text-lg",
    xl: "px-6 sm:px-9 py-3 sm:py-4 text-lg sm:text-xl",
  };

  return (
    // Button component
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      tabIndex={0}
      className={`
        ${improvedBaseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {Icon &&
        (typeof Icon === "string" ? (
          <img
            src={Icon}
            alt="icon"
            className={disabled ? "opacity-50" : ""}
            style={{
              width:
                size === "xl"
                  ? 28
                  : size === "lg"
                  ? 24
                  : size === "md"
                  ? 20
                  : 16,
              height: "auto",
            }}
          />
        ) : (
          <Icon
            size={
              size === "xl" ? 28 : size === "lg" ? 24 : size === "md" ? 20 : 16
            }
            className={disabled ? "opacity-50" : ""}
            aria-hidden="true"
          />
        ))}
      <span className={Icon ? "ml-2 truncate" : "truncate"}>{children}</span>
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "outline", "subtle"]),
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]), // Allow object for lucide-react icons
  disabled: PropTypes.bool,
  type: PropTypes.string,
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};
