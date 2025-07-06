# Workout-AI-Chat-Calendar-Website 

This FullStack website gives basic information within how to get fit and healthy through weight lifting, and cardio. This website uses an Workout Based AI to give information on how to workout. In addition to this, you can use the website's calendar to log the type of workout you are doing, or what you are doing during the day, or log your reps and sets, and the duration of your workout/event. Additionally, the website saves chat logs with AI and Calendar Events to the MongoDB Database. 

# View Website (FrontEnd Only) ---> https://erbrown349.github.io/Workout-AI-Chat-Calendar-Website/

# Steps To make local Server to use Working AI and save Calendar Events across Multiple Devices to Database Below
# 1. Clone the Repository
git clone https://github.com/yourusername/fitness-calendar-ai.git
cd fitness-calendar-ai
Backend Setup (Flask + MongoDB + LM Studio)

# 2. Install Python Packages
Make sure Python 3.9+ is installed.

cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
<details> <summary><strong>requirements.txt</strong> (if you don’t have it yet)</summary>
Flask
flask-cors
pymongo
python-dotenv
requests
</details> 

# 3. Set Up .env File
Create a .env file inside the backend/ folder:

MONGO_URI=mongodb://localhost:27017
Make sure MongoDB is installed and running.

# 4. Run the Flask Server
python server.py
The backend should now be running at:
📡 http://localhost:5001

# 5. Frontend Setup: Open index.html
From the frontend/ folder, open index.html in your browser (or run with a Live Server extension):

frontend/index.html
Or use a simple Python HTTP server:

cd frontend
python -m http.server 5503
Then go to:
🌍 http://localhost:5503/index.html

🤖 LM Studio Setup (for FlexBot)

Download LM Studio
Load a local model like Mistral 7B Instruct and run the server at:
http://localhost:1234/v1/chat/completions
Make sure your server.py is pointed to this URL:
LM_API_URL = "http://localhost:1234/v1/chat/completions" 


# To Run Backend Test Files 

#  1. Clone your repo
git clone https://github.com/your-username/Workoutwebsite.git
cd Workoutwebsite/backend 

#  2. Create and activate a virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate   # on Mac/Linux
or venv\Scripts\activate on Windows 

#  3. Install dependencies
pip install -r requirements.txt 

#  4. Set environment variables (create .env file)
Your .env should contain:
MONGO_URI=your_mongodb_connection_string 

#  Run the server
python3 server.py 

#  Run tests
python3 test_server.py
