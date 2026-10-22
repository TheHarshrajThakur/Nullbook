import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import notes, ai, categories, search, validation, voice, system

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("intellinote")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables
    logger.info("Initializing IntelliNote database schema...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("IntelliNote backend shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Offline Intelligent Notepad and Code Generator Local Backend Service",
    lifespan=lifespan
)

# Enable CORS for local Electron/Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(notes.router)
app.include_router(ai.router)
app.include_router(categories.router)
app.include_router(search.router)
app.include_router(validation.router)
app.include_router(voice.router)
app.include_router(system.router)

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "offline_ready": True
    }
