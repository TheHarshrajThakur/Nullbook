from typing import Optional
from fastapi import APIRouter, Query
from app.schemas import SearchQuery, SearchResponse, SearchResultItem
from app.services.search_service import SearchService

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("", response_model=SearchResponse)
def search_notes_get(
    q: str = Query("", description="Search keywords or semantic query"),
    category_id: Optional[str] = None,
    language: Optional[str] = None,
    tag: Optional[str] = None,
    search_type: str = Query("all", description="'all', 'keyword', or 'semantic'"),
    limit: int = Query(25, ge=1, le=100)
):
    items = SearchService.search(
        query=q,
        category_id=category_id,
        language=language,
        tag=tag,
        search_type=search_type,
        limit=limit
    )
    return SearchResponse(
        items=[SearchResultItem(**item) for item in items],
        total=len(items),
        query=q,
        search_type=search_type
    )

@router.post("", response_model=SearchResponse)
def search_notes_post(payload: SearchQuery):
    items = SearchService.search(
        query=payload.query,
        category_id=payload.category_id,
        language=payload.language,
        tag=payload.tag,
        search_type=payload.search_type,
        limit=payload.limit
    )
    return SearchResponse(
        items=[SearchResultItem(**item) for item in items],
        total=len(items),
        query=payload.query,
        search_type=payload.search_type
    )
