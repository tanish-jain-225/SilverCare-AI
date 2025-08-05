import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff } from 'lucide-react';

export const Input = forwardRef(function Input({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  type = 'text',
  id,
  required = false,
  voiceButton = null,
  ...props
}, ref) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    // Input component
    <div className="w-full mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-base md:text-lg font-medium mb-2 ${error ? 'text-red-600' : 'text-gray-700'}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {typeof Icon === 'string' ? (
              <img src={Icon} alt="icon" className={`w-5 h-5 ${error ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'}`} aria-hidden="true" />
            ) : (
              <Icon className={`w-5 h-5 ${error ? 'text-red-500' : isFocused ? 'text-blue-500' : 'text-gray-400'}`} aria-hidden="true" />
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={inputType}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`
            w-full px-4 py-3 text-base md:text-lg border-2 rounded-2xl
            focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-100
            disabled:bg-gray-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-100 text-red-800' 
              : 'border-gray-300 focus:border-blue-500'
            }
            ${Icon ? 'pl-12' : ''}
            ${className}
          `}
          {...props}
        />
        {/* Voice Button (if provided by parent) */}
        {type === 'password' && voiceButton && (
          <div className="absolute inset-y-0 right-12 flex items-center">
            {voiceButton}
          </div>
        )}
        {/* Password Eye Toggle (if password) */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
          >
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        )}
      </div>
      
      {error && (
        <p id={`${inputId}-error`} className="mt-2 text-red-600 text-sm font-medium" role="alert">{error}</p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-2 text-gray-500 text-sm">{helperText}</p>
      )}
    </div>
  );
});

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.string,
  icon: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.object, // allow React components
    PropTypes.string
  ]),
  helperText: PropTypes.string,
  className: PropTypes.string,
  type: PropTypes.string,
  id: PropTypes.string,
  required: PropTypes.bool,
  voiceButton: PropTypes.node,
};

Input.defaultProps = {
  className: '',
  type: 'text',
  required: false,
  voiceButton: null,
};