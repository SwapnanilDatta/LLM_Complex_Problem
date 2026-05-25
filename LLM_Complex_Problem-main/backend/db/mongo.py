"""
Async MongoDB client using Motor.
Falls back gracefully when MONGODB_URI is not set (dev mode).
"""
from __future__ import annotations

import os
from typing import Optional

import motor.motor_asyncio

_client: Optional[motor.motor_asyncio.AsyncIOMotorClient] = None
_db = None


async def connect_db():
    global _client, _db
    uri = os.getenv("MONGODB_URI")
    if not uri:
        print("⚠  MONGODB_URI not set — DB logging disabled.")
        return
    try:
        _client = motor.motor_asyncio.AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        await _client.server_info()
        _db = _client[os.getenv("MONGODB_DB", "mathproof")]
        print("✅ MongoDB connected.")
    except Exception as e:
        print(f"⚠  MongoDB connection failed: {e}")
        _client = None
        _db = None


async def close_db():
    global _client
    if _client:
        _client.close()


async def save_run(doc: dict) -> dict:
    if _db is None:
        return doc
    await _db.runs.insert_one(doc)
    doc.pop("_id", None)
    return doc


async def get_runs(limit: int = 50) -> list:
    if _db is None:
        return []
    cursor = _db.runs.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    return await cursor.to_list(length=limit)


async def get_run_by_id(run_id: str) -> Optional[dict]:
    if _db is None:
        return None
    doc = await _db.runs.find_one({"run_id": run_id}, {"_id": 0})
    return doc