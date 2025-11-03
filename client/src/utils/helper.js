// Set route endpoint as per your environment
// client/src/utils/helper.js
// import { useState, useEffect } from 'react';
// Set route endpoint as per your environment
// client/src/utils/helper.js

// Set route endpoint as per your environment

let _route_endpoint;

if(import.meta.env.PROD) {
  // Use production endpoint
  _route_endpoint = import.meta.env.VITE_PRODUCTION_ROUTE_URL;
}
else {
  // Use local development endpoint
  _route_endpoint = import.meta.env.VITE_LOCAL_DEV_ROUTE_URL;
}

export const route_endpoint = _route_endpoint;

// ========== TIME FORMATTING UTILITIES ==========

/**
 * Convert 12-hour format to 24-hour format for Date object creation
 * @param {string} time12h - Time in 12-hour format (e.g., "3:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "15:30")
 */
export const convertTo24Hour = (time12h) => {
  if (!time12h) return "";
  
  // If already in 24-hour format, return as is
  if (/^\d{1,2}:\d{2}$/.test(time12h)) {
    return time12h.padStart(5, '0'); // Ensure HH:MM format
  }
  
  // Parse 12-hour format
  const match = time12h.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time12h; // Return original if can't parse
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Format time for display (ensure 12-hour format)
 * @param {string} time - Time in any format
 * @returns {string} Time in 12-hour format (e.g., "3:30 PM")
 */
export const formatTimeForDisplay = (time) => {
  if (!time) return "";
  
  // If already in 12-hour format, return as is
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(time)) {
    return time;
  }
  
  // Convert from 24-hour to 12-hour format
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  
  let [, hours, minutes] = match;
  hours = parseInt(hours);
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes} ${period}`;
};

/**
 * Format timestamp for display with consistent 12-hour format
 * @param {string|Date} timestamp - Timestamp to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted timestamp
 */
export const formatTimestamp = (timestamp, options = {}) => {
  if (!timestamp) return "Unknown";
  
  const date = new Date(timestamp);
  
  // Default options for 12-hour format
  const defaultOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options
  };
  
  return date.toLocaleTimeString("en-US", defaultOptions);
};

/**
 * Format date and time with consistent 12-hour format
 * @param {string|Date} timestamp - Timestamp to format
 * @param {boolean} includeDate - Whether to include date
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (timestamp, includeDate = true) => {
  if (!timestamp) return "Unknown";
  
  const date = new Date(timestamp);
  
  if (includeDate) {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } else {
    return formatTimestamp(timestamp);
  }
};

/**
 * Format time for voice reading (more natural)
 * @param {string} time - Time to format
 * @returns {string} Time formatted for speech
 */
export const formatTimeForSpeech = (time) => {
  if (!time) return "";
  
  const displayTime = formatTimeForDisplay(time);
  // Convert "3:00 PM" to "3 P M" for better speech synthesis
  return displayTime.replace(/([AP])M/g, '$1 M');
};

/**
 * Format date for consistent display across the project
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  
  const defaultOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options
  };
  
  return date.toLocaleDateString("en-US", defaultOptions);
};

/**
 * Format date and time for alarm/reminder displays
 * @param {string} date - Date string
 * @param {string} time - Time string  
 * @returns {string} Formatted date and time for display
 */
export const formatReminderDateTime = (date, time) => {
  const formattedDate = formatDate(date, { 
    weekday: "short", 
    month: "short", 
    day: "numeric" 
  });
  const formattedTime = formatTimeForDisplay(time);
  
  return `${formattedDate} at ${formattedTime}`;
};

export default route_endpoint;
