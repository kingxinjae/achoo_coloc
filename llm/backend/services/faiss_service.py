import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Optional, Dict, Set
import os
import random


# 단어 카테고리 정의 (연관성 높은 추천을 위해) - 확장된 버전
WORD_CATEGORIES: Dict[str, List[str]] = {
    "인사": ["안녕", "하세요", "감사", "고맙다", "미안", "사과", "축하", "인사", "소개", "반갑다", "환영"],
    "시간": ["오늘", "내일", "어제", "아침", "점심", "저녁", "밤", "낮", "시간", "분", "초", "주", "월", "년", "지금", "나중", "항상", "가끔", "자주", "매일"],
    "날씨": ["날씨", "비", "눈", "바람", "구름", "태양", "달", "별", "하늘", "맑다", "흐리다", "춥다", "덥다", "따뜻하다", "시원하다", "습하다", "건조하다"],
    "감정": ["좋다", "나쁘다", "행복", "슬픔", "기쁨", "화", "사랑", "기쁘다", "슬프다", "화나다", "행복하다", "불행하다", "즐겁다", "재미있다", "지루하다", "피곤하다", "편하다", "불편하다"],
    "사람": ["나", "너", "우리", "사람", "친구", "가족", "아버지", "어머니", "형", "누나", "동생", "언니", "오빠", "할머니", "할아버지", "선생님", "학생", "아이", "어른"],
    "장소": ["집", "학교", "회사", "병원", "공원", "식당", "카페", "마트", "은행", "도서관", "역", "공항", "바다", "산", "강", "길", "방", "거실", "부엌"],
    "음식": ["밥", "빵", "고기", "생선", "야채", "과일", "음식", "먹다", "마시다", "요리", "물", "커피", "차", "술", "국", "반찬", "디저트", "간식"],
    "동작": ["가다", "오다", "하다", "보다", "듣다", "말하다", "읽다", "쓰다", "만들다", "사다", "팔다", "주다", "받다", "놀다", "일하다", "공부하다", "자다", "일어나다", "앉다", "서다", "걷다", "뛰다"],
    "상태": ["크다", "작다", "많다", "적다", "빠르다", "느리다", "높다", "낮다", "길다", "짧다", "넓다", "좁다", "무겁다", "가볍다", "새롭다", "오래되다", "쉽다", "어렵다"],
    "의문": ["뭐", "누구", "어디", "언제", "왜", "어떻게", "얼마", "몇"],
    "연결": ["그리고", "하지만", "그래서", "그러나", "또", "그런데", "왜냐하면"],
    "필요": ["필요하다", "원하다", "싶다", "해야하다", "할수있다", "못하다", "안하다"],
}

# 카테고리 간 연관성 정의 (자연스러운 문장 구성을 위해)
CATEGORY_RELATIONS: Dict[str, List[str]] = {
    "인사": ["사람", "시간", "감정"],
    "시간": ["날씨", "동작", "장소"],
    "날씨": ["시간", "감정", "상태"],
    "감정": ["사람", "동작", "상태"],
    "사람": ["동작", "장소", "감정"],
    "장소": ["동작", "시간", "사람"],
    "음식": ["동작", "장소", "시간"],
    "동작": ["사람", "장소", "시간", "상태"],
    "상태": ["사람", "장소", "감정"],
    "의문": ["사람", "장소", "시간", "동작"],
    "연결": ["동작", "감정", "상태"],
    "필요": ["동작", "사람", "장소"],
}


class FAISSService:
    """
    FAISS 기반 단어 추천 서비스
    한국어 단어 임베딩을 생성하고 유사도 검색을 수행합니다.
    """
    
    def __init__(self, model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", 
                 vocabulary_file: str = "data/vocabulary.txt"):
        """
        FAISS 서비스 초기화
        
        Args:
            model_name: 사용할 sentence-transformers 모델명
            vocabulary_file: 단어 어휘 파일 경로
        """
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.vocabulary_file = vocabulary_file
        self.vocabulary: List[str] = []
        self.index: Optional[faiss.Index] = None
        self.embeddings: Optional[np.ndarray] = None
        
        # 어휘 로드 및 인덱스 구축
        self._load_vocabulary()
        self.build_index()
        
    def _load_vocabulary(self) -> None:
        """
        어휘 파일에서 단어 목록을 로드합니다.
        """
        if not os.path.exists(self.vocabulary_file):
            raise FileNotFoundError(f"Vocabulary file not found: {self.vocabulary_file}")
        
        with open(self.vocabulary_file, 'r', encoding='utf-8') as f:
            self.vocabulary = [line.strip() for line in f if line.strip()]
        
        print(f"Loaded {len(self.vocabulary)} words from vocabulary")
        
    def build_index(self) -> None:
        """
        단어 목록으로 FAISS 인덱스를 구축합니다.
        모든 단어의 임베딩을 생성하고 L2 거리 기반 인덱스를 만듭니다.
        """
        if not self.vocabulary:
            raise ValueError("Vocabulary is empty. Cannot build index.")
        
        print("Generating embeddings for vocabulary...")
        # 모든 단어의 임베딩 생성
        self.embeddings = self.model.encode(self.vocabulary, show_progress_bar=True)
        
        # FAISS 인덱스 생성 (L2 거리 기반)
        dimension = self.embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        
        # 인덱스에 임베딩 추가
        self.index.add(self.embeddings.astype('float32'))
        
        print(f"FAISS index built with {self.index.ntotal} vectors")
        
    def _get_word_category(self, word: str) -> Optional[str]:
        """단어가 속한 카테고리를 찾습니다."""
        for category, words in WORD_CATEGORIES.items():
            if word in words:
                return category
        return None
    
    def _get_category_words(self, category: str) -> List[str]:
        """카테고리에 속한 단어들 중 어휘에 있는 것만 반환합니다."""
        if category not in WORD_CATEGORIES:
            return []
        return [w for w in WORD_CATEGORIES[category] if w in self.vocabulary]

    def _get_related_categories(self, category: str) -> List[str]:
        """카테고리와 연관된 다른 카테고리들을 반환합니다."""
        return CATEGORY_RELATIONS.get(category, [])

    def recommend_words(self, word: str, k: int = 4, exclude_word: bool = True, 
                       context: List[str] = None, exclude_words: Set[str] = None) -> List[str]:
        """
        주어진 단어와 유사한 k개의 단어를 추천합니다.
        컨텍스트와 카테고리를 고려하여 더 연관성 높은 단어를 추천합니다.
        
        Args:
            word: 기준 단어
            k: 추천할 단어 개수
            exclude_word: 입력 단어를 결과에서 제외할지 여부
            context: 이미 선택된 단어들 (문맥)
            exclude_words: 제외할 단어 집합
        
        Returns:
            추천된 단어 목록
        """
        if self.index is None:
            raise ValueError("Index not built. Call build_index() first.")
        
        context = context or []
        exclude_words = exclude_words or set()
        
        # 제외할 단어 집합 구성
        words_to_exclude = set(exclude_words)
        if exclude_word:
            words_to_exclude.add(word)
        words_to_exclude.update(context)
        
        recommended_words = []
        
        # 1. 같은 카테고리에서 1개 추천 (연관성 높은 단어)
        word_category = self._get_word_category(word)
        if word_category:
            category_words = self._get_category_words(word_category)
            category_candidates = [w for w in category_words if w not in words_to_exclude]
            random.shuffle(category_candidates)
            for cw in category_candidates[:1]:
                if len(recommended_words) < k:
                    recommended_words.append(cw)
                    words_to_exclude.add(cw)
        
        # 2. 연관 카테고리에서 1-2개 추천 (문장 구성에 도움되는 단어)
        if word_category and len(recommended_words) < k:
            related_categories = self._get_related_categories(word_category)
            for related_cat in related_categories:
                if len(recommended_words) >= k:
                    break
                related_words = self._get_category_words(related_cat)
                related_candidates = [w for w in related_words if w not in words_to_exclude]
                if related_candidates:
                    selected = random.choice(related_candidates)
                    recommended_words.append(selected)
                    words_to_exclude.add(selected)
        
        # 3. 컨텍스트 기반 추천 (이미 선택된 단어들과 유사한 단어)
        if context and len(recommended_words) < k:
            # 컨텍스트 단어들의 평균 임베딩으로 검색
            context_embedding = self.model.encode(context)
            avg_context_embedding = np.mean(context_embedding, axis=0, keepdims=True)
            
            _, context_indices = self.index.search(avg_context_embedding.astype('float32'), k * 3)
            
            for idx in context_indices[0]:
                if idx < len(self.vocabulary):
                    candidate = self.vocabulary[idx]
                    if candidate not in words_to_exclude:
                        recommended_words.append(candidate)
                        words_to_exclude.add(candidate)
                        if len(recommended_words) >= k:
                            break
        
        # 4. 입력 단어 기반 유사도 검색으로 나머지 채우기
        if len(recommended_words) < k:
            query_embedding = self.model.encode([word])
            search_k = k * 4  # 충분히 많이 검색
            _, indices = self.index.search(query_embedding.astype('float32'), search_k)
            
            for idx in indices[0]:
                if idx < len(self.vocabulary):
                    candidate = self.vocabulary[idx]
                    if candidate not in words_to_exclude:
                        recommended_words.append(candidate)
                        words_to_exclude.add(candidate)
                        if len(recommended_words) >= k:
                            break
        
        # 5. 여전히 부족하면 랜덤으로 채우기
        while len(recommended_words) < k:
            random_word = random.choice(self.vocabulary)
            if random_word not in words_to_exclude:
                recommended_words.append(random_word)
                words_to_exclude.add(random_word)
        
        return recommended_words[:k]
    
    def recommend_diverse_words(self, k: int = 4, exclude_words: Set[str] = None) -> List[str]:
        """
        다양한 카테고리에서 단어를 추천합니다. (경계 넘어갈 때 사용)
        
        Args:
            k: 추천할 단어 개수
            exclude_words: 제외할 단어 집합
        
        Returns:
            다양한 카테고리의 단어 목록
        """
        exclude_words = exclude_words or set()
        recommended = []
        
        # 각 카테고리에서 하나씩 선택
        categories = list(WORD_CATEGORIES.keys())
        random.shuffle(categories)
        
        for category in categories:
            if len(recommended) >= k:
                break
            category_words = self._get_category_words(category)
            candidates = [w for w in category_words if w not in exclude_words and w not in recommended]
            if candidates:
                selected = random.choice(candidates)
                recommended.append(selected)
        
        # 부족하면 랜덤으로 채우기
        while len(recommended) < k:
            random_word = random.choice(self.vocabulary)
            if random_word not in exclude_words and random_word not in recommended:
                recommended.append(random_word)
        
        return recommended[:k]
    
    def get_initial_words(self, k: int = 4) -> List[str]:
        """
        초기 화면에 표시할 시작 단어들을 선택합니다.
        자주 사용되는 기본 단어들을 우선적으로 선택합니다.
        
        Args:
            k: 선택할 단어 개수
        
        Returns:
            초기 단어 목록
        """
        # 자주 사용되는 시작 단어들 (어휘에 있는 경우에만)
        preferred_starters = ["안녕", "오늘", "날씨", "좋다", "나", "너", "우리", "사람", "시간", "하다"]
        
        initial_words = []
        for word in preferred_starters:
            if word in self.vocabulary:
                initial_words.append(word)
                if len(initial_words) == k:
                    break
        
        # 부족한 경우 어휘 앞부분에서 추가
        idx = 0
        while len(initial_words) < k and idx < len(self.vocabulary):
            if self.vocabulary[idx] not in initial_words:
                initial_words.append(self.vocabulary[idx])
            idx += 1
        
        return initial_words[:k]
    
    def get_vocabulary_size(self) -> int:
        """
        어휘 크기를 반환합니다.
        
        Returns:
            어휘에 포함된 단어 개수
        """
        return len(self.vocabulary)
    
    def word_exists(self, word: str) -> bool:
        """
        단어가 어휘에 존재하는지 확인합니다.
        
        Args:
            word: 확인할 단어
        
        Returns:
            단어 존재 여부
        """
        return word in self.vocabulary
