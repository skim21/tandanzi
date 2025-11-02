# 탄단지 - 음식 영양 정보 검색 웹사이트

음식 이름을 입력하면 열량, 칼로리, 영양소 정보를 제공하고 건강 평가를 해주는 웹 애플리케이션입니다.

## 기능

- 🔍 음식 이름으로 영양 정보 검색
- 📊 열량(kcal), 탄수화물, 단백질, 지방, 섬유질 등 영양소 표시
- 💚 칼로리 기준 건강 점수 및 평가
- 💡 영양 정보에 따른 건강 팁 제공

## 기술 스택

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Axios

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

## API 설정 (선택사항)

더 많은 음식 데이터를 사용하려면 Edamam Food Database API를 사용할 수 있습니다:

1. [Edamam](https://www.edamam.com/)에서 계정 생성
2. Food Database API 앱 생성
3. `.env` 파일 생성:

```
VITE_EDAMAM_APP_ID=your_app_id
VITE_EDAMAM_APP_KEY=your_app_key
```

API 키가 없어도 기본 제공되는 한국 음식 데이터로 테스트할 수 있습니다.

## 지원 음식 (기본 데이터)

- 사과, 바나나
- 치킨, 삼겹살, 두부
- 김밥, 비빔밥, 라면
- 된장찌개, 김치

등등...

