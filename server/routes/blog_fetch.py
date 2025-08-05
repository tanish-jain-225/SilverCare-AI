from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

import os
import requests

blog_fetch_bp = Blueprint('blog_fetch', __name__)

# Get API keys from environment variables
API_KEY = os.getenv('WORLD_NEWS_API_KEY1') or os.getenv('WORLD_NEWS_API_KEY2') or os.getenv('WORLD_NEWS_API_KEY3')

@blog_fetch_bp.route('/fetch-news', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin()
def fetch_news():
    """
    Fetch news articles by text search from the World News API.
    This route acts as a proxy to avoid CORS issues when calling the external API from the frontend.
    """
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Get search text from query parameters or request body
        if request.method == 'GET':
            text = request.args.get('text', 'latest news')
        else:  # POST request
            data = request.get_json() or {}
            text = data.get('text', 'latest news')
        
        if not text:
            return jsonify({'error': 'Text is required to search news articles.'}), 400
        
        if not API_KEY:
            return jsonify({'error': 'World News API key is not configured on the server.'}), 500
        
        # Construct the API URL
        api_url = f"https://api.worldnewsapi.com/search-news?api-key={API_KEY}&text={text}&language=en"
        
        # Make the request to the external API
        headers = {
            'x-api-key': API_KEY,
            'User-Agent': 'SilverCare-AI/1.0'
        }
        
        response = requests.get(api_url, headers=headers, timeout=10)
        
        if not response.ok:
            return jsonify({
                'error': f'Failed to fetch news articles: {response.status_code}',
                'details': response.text
            }), response.status_code
        
        data = response.json()
        
        # Check if the response has the expected structure
        if 'news' not in data:
            return jsonify({
                'error': 'Invalid response format from World News API',
                'response': data
            }), 500
        
        # Map API response to frontend format
        articles = []
        for article in data.get('news', []):
            mapped_article = {
                'id': article.get('id'),
                'title': article.get('title'),
                'description': article.get('summary') or article.get('text'),
                'url': article.get('url'),
                'urlToImage': article.get('image'),
                'source': {'name': article.get('source_country')},
                'publishedAt': article.get('publish_date'),
                'category': article.get('category'),
            }
            articles.append(mapped_article)
        
        return jsonify({
            'success': True,
            'articles': articles,
            'total': len(articles)
        }), 200
        
    except requests.exceptions.Timeout:
        return jsonify({'error': 'Request timeout while fetching news articles.'}), 504
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Network error: {str(e)}'}), 502
    
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500