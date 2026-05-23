from pymongo import MongoClient
from dotenv import load_dotenv
import os

# ✅ Always load backend/.env explicitly (important for uvicorn reload/import order)
dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

# MongoDB connection string from .env
MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/")
DB_NAME = os.getenv("DB_NAME", "Ticket_Raising_System")

# MongoDB Client
client = MongoClient(MONGO_URI)
db = client[DB_NAME]  # Main database

# Print connection status
print(f"Connected to MongoDB database: {DB_NAME}")