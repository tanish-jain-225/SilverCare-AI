import { route_endpoint } from "./helper";

const API_KEY = import.meta.env.VITE_WORLD_NEWS_API_KEY3 || import.meta.env.VITE_WORLD_NEWS_API_KEY2 || import.meta.env.VITE_WORLD_NEWS_API_KEY1;

if (!API_KEY) {
  throw new Error("World News API key is not defined. Please set VITE_WORLD_NEWS_API_KEY1, VITE_WORLD_NEWS_API_KEY2, or VITE_WORLD_NEWS_API_KEY3 in your environment variables.");
}

const API_URL = `https://api.worldnewsapi.com/search-news?api-key=${API_KEY}`;

/**
 * Fetch news articles by text search from the World News API.
 * @param {string} text - The text to search news articles by.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of news articles matching the text.
 */
export async function fetchNewsByText(text) {
  if (!text) {
    throw new Error("Text is required to search news articles.");
  }

  try {
    const url = `${API_URL}&text=${encodeURIComponent(text)}&language=en`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch news articles: ${response.status}`);
    }

    const data = await response.json();

    // Map API response to frontend format
    return data.news.map((article) => ({
      id: article.id,
      title: article.title,
      description: article.summary || article.text,
      url: article.url,
      urlToImage: article.image,
      source: { name: article.source_country },
      publishedAt: article.publish_date,
      category: article.category,
    }));
  } catch (error) {
    throw error;
  }
}

// --- Emergency Saved Contacts API (MongoDB) ---
// Use a static string for BASE_API to avoid process is not defined error in browser
const BASE_API = route_endpoint

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
