import uvicorn
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    from app.config import settings
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True, reload_dirs=[backend_dir], log_level="info")
