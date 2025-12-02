# 요구사항 문서

## 소개

사용자가 화면에 표시된 단어들을 순차적으로 선택하면, FAISS 기반 유사도 검색으로 다음 단어를 추천하고, 선택된 단어들을 Ollama LLM으로 자연스러운 문장으로 생성한 후 Coqui TTS로 음성 출력하는 웹 애플리케이션입니다.

## 용어 사전

- **Application**: 단어 선택 및 TTS 변환 웹 애플리케이션
- **User**: 애플리케이션을 사용하는 사용자
- **Word Grid**: 화면을 4개 영역으로 분할하여 단어를 표시하는 UI 컴포넌트
- **FAISS Engine**: 단어 임베딩 기반 유사도 검색을 수행하는 시스템
- **Ollama Service**: 로컬호스트 11434에서 실행 중인 gemma2:2b 모델 서비스
- **TTS Engine**: Coqui TTS를 사용한 음성 합성 엔진
- **Selected Words**: 사용자가 선택한 단어들의 순서가 있는 목록
- **Generate Button**: 우측 상단에 위치한 문장 생성 트리거 버튼

## 요구사항

### 요구사항 1

**사용자 스토리:** 사용자로서, 화면에 4개의 단어가 표시되어 그 중 하나를 선택할 수 있기를 원합니다. 이를 통해 원하는 단어를 선택하여 문장을 구성할 수 있습니다.

#### 인수 기준

1. THE Application SHALL display four distinct words in a grid layout with equal-sized quadrants
2. WHEN the User clicks on a word quadrant, THE Application SHALL add the selected word to the Selected Words list
3. WHEN the User clicks on a word quadrant, THE Application SHALL visually highlight the selected quadrant
4. THE Application SHALL display the Selected Words list in chronological order on the screen

### 요구사항 2

**사용자 스토리:** 사용자로서, 단어를 선택하면 FAISS 기반으로 다음에 올 가능성이 높은 4개의 단어가 자동으로 추천되기를 원합니다. 이를 통해 문맥에 맞는 단어를 빠르게 선택할 수 있습니다.

#### 인수 기준

1. WHEN the User selects a word, THE Application SHALL send the selected word to the FAISS Engine
2. WHEN the FAISS Engine receives a word query, THE Application SHALL return four semantically similar words based on embedding similarity
3. WHEN the Application receives recommended words from FAISS Engine, THE Application SHALL update the Word Grid with the four new words within 500 milliseconds
4. THE Application SHALL initialize the Word Grid with four predefined starter words on first load

### 요구사항 3

**사용자 스토리:** 사용자로서, 우측 상단의 생성 버튼을 클릭하여 선택한 단어들로 자연스러운 문장을 생성하고 싶습니다. 이를 통해 단편적인 단어들을 완전한 문장으로 변환할 수 있습니다.

#### 인수 기준

1. THE Application SHALL display a Generate Button in the top-right corner of the screen
2. WHEN the User clicks the Generate Button, THE Application SHALL send the Selected Words to the Ollama Service at localhost:11434
3. WHEN the Ollama Service receives the Selected Words, THE Application SHALL generate a coherent sentence using the gemma2:2b model
4. WHEN the Ollama Service returns a generated sentence, THE Application SHALL display the sentence on the screen
5. IF the Selected Words list is empty, THEN THE Application SHALL disable the Generate Button

### 요구사항 4

**사용자 스토리:** 사용자로서, 생성된 문장이 자동으로 음성으로 변환되어 들을 수 있기를 원합니다. 이를 통해 시각적 확인뿐만 아니라 청각적으로도 결과를 확인할 수 있습니다.

#### 인수 기준

1. WHEN the Application receives a generated sentence from Ollama Service, THE Application SHALL send the sentence to the TTS Engine
2. WHEN the TTS Engine receives a sentence, THE Application SHALL convert the text to speech using Coqui TTS
3. WHEN the TTS Engine completes audio generation, THE Application SHALL play the audio through the User's default audio output device
4. THE Application SHALL display a loading indicator while audio generation is in progress

### 요구사항 5

**사용자 스토리:** 사용자로서, 선택한 단어들을 초기화하고 처음부터 다시 시작할 수 있기를 원합니다. 이를 통해 잘못된 선택을 수정하거나 새로운 문장을 만들 수 있습니다.

#### 인수 기준

1. THE Application SHALL display a Reset Button on the screen
2. WHEN the User clicks the Reset Button, THE Application SHALL clear the Selected Words list
3. WHEN the User clicks the Reset Button, THE Application SHALL reset the Word Grid to the initial four starter words
4. WHEN the User clicks the Reset Button, THE Application SHALL clear any displayed generated sentence

### 요구사항 6

**사용자 스토리:** 사용자로서, 시스템 오류가 발생했을 때 명확한 오류 메시지를 받고 싶습니다. 이를 통해 문제를 이해하고 적절히 대응할 수 있습니다.

#### 인수 기준

1. IF the FAISS Engine fails to return recommendations, THEN THE Application SHALL display an error message to the User
2. IF the Ollama Service is unreachable at localhost:11434, THEN THE Application SHALL display a connection error message
3. IF the TTS Engine fails to generate audio, THEN THE Application SHALL display an audio generation error message
4. WHEN an error occurs, THE Application SHALL allow the User to retry the failed operation
