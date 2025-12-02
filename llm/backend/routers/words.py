from fastapi import APIRouter, HTTPException
from models.schemas import RecommendRequest, RecommendResponse, InitialWordsResponse
from services.faiss_service import FAISSService

router = APIRouter()

# FAISS 서비스 인스턴스 (싱글톤)
faiss_service: FAISSService = None


def get_faiss_service() -> FAISSService:
    """FAISS 서비스 인스턴스를 반환합니다."""
    global faiss_service
    if faiss_service is None:
        faiss_service = FAISSService()
    return faiss_service


@router.get("/initial-words", response_model=InitialWordsResponse)
async def get_initial_words():
    """초기 4개의 시작 단어를 반환합니다."""
    try:
        service = get_faiss_service()
        words = service.get_initial_words(k=4)
        return InitialWordsResponse(words=words)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get initial words: {str(e)}")


@router.post("/recommend", response_model=RecommendResponse)
async def recommend_words(request: RecommendRequest):
    """선택된 단어를 기반으로 다음 4개의 단어를 추천합니다."""
    try:
        service = get_faiss_service()
        
        # 단어가 어휘에 없는 경우 처리
        if not service.word_exists(request.word):
            # 어휘에 없는 단어면 초기 단어 반환
            recommendations = service.get_initial_words(k=4)
        else:
            recommendations = service.recommend_words(request.word, k=4)
        
        return RecommendResponse(recommendations=recommendations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recommend words: {str(e)}")
