import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import os
import random


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
        
    def recommend_words(self, word: str, k: int = 4, exclude_word: bool = True) -> List[str]:
        """
        주어진 단어와 유사한 k개의 단어를 추천합니다.
        
        Args:
            word: 기준 단어
            k: 추천할 단어 개수
            exclude_word: 입력 단어를 결과에서 제외할지 여부
        
        Returns:
            추천된 단어 목록
        """
        if self.index is None:
            raise ValueError("Index not built. Call build_index() first.")
        
        # 입력 단어의 임베딩 생성
        query_embedding = self.model.encode([word])
        
        # 유사한 단어 검색 (exclude_word가 True면 k+1개 검색)
        search_k = k + 1 if exclude_word else k
        distances, indices = self.index.search(query_embedding.astype('float32'), search_k)
        
        # 결과 단어 추출
        recommended_words = []
        for idx in indices[0]:
            if idx < len(self.vocabulary):
                candidate_word = self.vocabulary[idx]
                # exclude_word가 True면 입력 단어 제외
                if exclude_word and candidate_word == word:
                    continue
                recommended_words.append(candidate_word)
                if len(recommended_words) == k:
                    break
        
        # 충분한 단어를 찾지 못한 경우 랜덤 단어로 채우기
        while len(recommended_words) < k:
            random_word = random.choice(self.vocabulary)
            if random_word not in recommended_words and (not exclude_word or random_word != word):
                recommended_words.append(random_word)
        
        return recommended_words[:k]
    
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
