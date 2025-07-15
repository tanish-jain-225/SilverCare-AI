import { route_endpoint } from "./helper";

// Use backend API for news to avoid CORS issues
const BASE_API = route_endpoint;

/**
 * Fetch news articles by text search via backend proxy.
 * @param {string} text - The text to search news articles by.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of news articles matching the text.
 */
export async function fetchNewsByText(text) {
  if (!text) {
    throw new Error("Text is required to search news articles.");
  }

  try {
    const url = `${BASE_API}/fetch-news?text=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news articles: ${response.status}`);
    }

    const data = await response.json();

    // Check if the response indicates success
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch news articles');
    }

    // Return the articles array from the backend response
    return data.articles || [];
  } catch (error) {
    throw error;
  }
}

// --- Emergency Saved Contacts API (MongoDB) ---
// Use the same BASE_API constant defined above

export async function getSavedContacts(userId) {
  const res = await fetch(`${BASE_API}/api/saved-contacts?user_id=${userId}`);
  if (!res.ok) throw new Error('Failed to fetch saved contacts');
  return res.json();
}

export async function addSavedContact(userId, contact) {
  const res = await fetch(`${BASE_API}/api/saved-contacts?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  });
  if (!res.ok) throw new Error('Failed to add contact');
  return res.json();
}

export async function deleteSavedContact(userId, contactId) {
  const res = await fetch(`${BASE_API}/api/saved-contacts/${contactId}?user_id=${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete contact');
  return res.json();
}
