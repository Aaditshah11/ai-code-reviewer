from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini import review_code

router = APIRouter()

class ReviewRequest(BaseModel):
    pr_title: str
    pr_diff: str
    repo_name: str
    author: str

class ReviewResponse(BaseModel):
    summary: str
    verdict: str  # approve/request_changes/comment
    score: int

@router.post("/", response_model=ReviewResponse)
def create_review(request: ReviewRequest):
    result = review_code(
        pr_title=request.pr_title,
        pr_diff=request.pr_diff,
        repo_name=request.repo_name,
        author=request.author
    )
    return result

