from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Use the new routers instead of building graphs directly here
from api.routes import router

@asynccontextmanager
async def lifespan(app):
    # Optional DB connection can be added here later
    yield

app = FastAPI(title="Deterministic AI Reasoning Engine", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(router)