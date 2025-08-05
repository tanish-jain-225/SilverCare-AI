export const storage = {
  // A simple wrapper for localStorage with JSON serialization
  // and error handling. It provides methods to set, get, remove,
  set: (key, value) => {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
    return true;
  },
  
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch (jsonError) {
        // If not valid JSON, return as string
        return item;
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
    return true;
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
    return true;
  },

  exists: (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error('Error checking localStorage:', error);
      return false;
    }
  }
};
