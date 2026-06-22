from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from app.routers import review

app = FastAPI(title="AI Code Review Service")

app.include_router(review.router, prefix="/review", tags=["review"])

@app.get("/")
def read_root():
    return { "status": "ok", "service": "AI Code Review" }
