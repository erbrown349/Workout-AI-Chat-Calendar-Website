from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from pymongo import MongoClient
from bson.json_util import dumps
import datetime
import os
import uuid
from dotenv import load_dotenv
load_dotenv()
import certifi

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.Workout
calendar_collection = db.calendarEvents
chat_collection = db.chatMessages

LM_API_URL = "http://localhost:1234/v1/chat/completions"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer no-key-needed"
}

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_msg = data.get("message", "")
    session_id = data.get("session_id", str(uuid.uuid4()))
    if not user_msg:
        return jsonify({"reply": "Please ask a workout question."})

    try:
        chat_collection.insert_one({
            "session_id": session_id,
            "role": "user",
            "content": user_msg,
            "timestamp": datetime.datetime.utcnow()
        })

        payload = {
            "model": "mistral",
            "messages": [
                {"role": "system", "content": "You are FlexBot, a helpful fitness coach."},
                {"role": "user", "content": user_msg}
            ],
            "temperature": 0.7
        }

        response = requests.post(LM_API_URL, headers=HEADERS, json=payload, timeout=40)
        response.raise_for_status()
        result = response.json()
        reply = result["choices"][0]["message"]["content"].strip()

        chat_collection.insert_one({
            "session_id": session_id,
            "role": "assistant",
            "content": reply,
            "timestamp": datetime.datetime.utcnow()
        })

        return jsonify({"reply": reply, "session_id": session_id})

    except Exception as e:
        return jsonify({"reply": f"Error contacting LM Studio API: {str(e)}"})

@app.route("/chat/sessions", methods=["GET"])
def get_sessions():
    sessions = chat_collection.aggregate([
        {"$group": {
            "_id": "$session_id",
            "first_message": {"$first": "$content"},
            "timestamp": {"$min": "$timestamp"}
        }},
        {"$sort": {"timestamp": -1}}
    ])
    return dumps(list(sessions)), 200 

@app.route("/chat/session/<session_id>", methods=["DELETE"])
def delete_session(session_id):
    result = chat_collection.delete_many({"session_id": session_id})
    return jsonify({"deleted": result.deleted_count})

@app.route("/chat/session/<session_id>", methods=["GET"])
def get_session(session_id):
    messages = chat_collection.find({"session_id": session_id}).sort("timestamp", 1)
    return dumps(list(messages)), 200

@app.route("/calendar", methods=["GET", "POST"])
def calendar():
    if request.method == "POST":
        event = request.get_json()
        event["timestamp"] = datetime.datetime.utcnow()
        calendar_collection.insert_one(event) 
        event["_id"] = str(event["_id"])  
        return jsonify({"status": "success", "event": event})
    elif request.method == "GET":
        events = calendar_collection.find()
        return dumps(events), 200

if __name__ == "__main__":
    app.run(debug=True, port=5001)