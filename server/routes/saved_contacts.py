from flask import Blueprint, request, jsonify
from pymongo import MongoClient

import os

saved_contacts_bp = Blueprint('saved_contacts', __name__)

# MongoDB connection
MONGO_URI = os.environ.get('MONGO_URI')
db_name = os.environ.get('DB_NAME')
saved_contacts_collection_name = os.environ.get('SAVED_CONTACTS_COLLECTION')

if MONGO_URI is None or db_name is None or saved_contacts_collection_name is None:
    raise RuntimeError("Missing required environment variables for MongoDB connection.")

client = MongoClient(MONGO_URI)
db = client[db_name]
collection = db[saved_contacts_collection_name]

def get_user_id():
    # For demo, get user id from query param or header (replace with real auth in prod)
    return request.args.get('user_id') or request.headers.get('X-User-Id')

@saved_contacts_bp.route('/api/saved-contacts', methods=['GET'])
def get_contacts():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    contacts = list(collection.find({'user_id': user_id}, {'_id': 0}))
    return jsonify(contacts)

@saved_contacts_bp.route('/api/saved-contacts', methods=['POST'])
def add_contact():
    user_id = get_user_id()
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    data = request.json
    if not data or not data.get('name') or not data.get('phone'):
        return jsonify({'error': 'Missing name or phone'}), 400
    contact = {
        'user_id': user_id,
        'id': data.get('id') if data else None,
        'name': data.get('name') if data else None,
        'phone': data.get('phone') if data else None,
        'relationship': data.get('relationship', 'Custom') if data else 'Custom'
    }
    collection.insert_one(contact)
    contact.pop('_id', None)
    return jsonify(contact), 201

@saved_contacts_bp.route('/api/saved-contacts/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    user_id = get_user_id()
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
    result = collection.delete_one({'user_id': user_id, 'id': contact_id})
    if result.deleted_count == 0:
        return jsonify({'error': 'Contact not found'}), 404
    return jsonify({'success': True})
