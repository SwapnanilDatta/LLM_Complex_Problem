import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    GROQ_API_KEY1 = os.environ.get("GROQ_API_KEY1", "")
    GROQ_API_KEY2 = os.environ.get("GROQ_API_KEY2", "")
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
    
    # Other potential configs
    MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017")
    DB_NAME = os.environ.get("DB_NAME", "math_agent_db")

config = Config()
