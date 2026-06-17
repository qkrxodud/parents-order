# 부모님 주문앱 — Firebase 구현 가이드

## 개요

| 항목 | 내용 |
|------|------|
| 자녀(관리자) | Google 로그인 → 가족방 생성 → 가게/메뉴 등록 |
| 부모님 | 링크만 열면 로그인 없이 바로 주문 화면 |
| 호스팅 | GitHub Pages |
| 비용 | 무료 (Firebase Spark 플랜) |

---

## 디렉토리 구조

```
parents-order/
├── index.html        # 메인 앱 (단일 파일)
└── README.md
```

---

## Step 1 — Firebase 설정 (콘솔에서)

### 1-1. 프로젝트 생성
1. [console.firebase.google.com](https://console.firebase.google.com) 접속
2. "프로젝트 추가" → 이름: `parents-order`
3. Google Analytics 끄고 생성

### 1-2. Realtime Database 생성
1. 왼쪽 메뉴 "빌드" → "Realtime Database" → "데이터베이스 만들기"
2. 위치: `asia-southeast1` (싱가포르)
3. 보안 규칙: **테스트 모드**로 시작

### 1-3. Authentication 설정
1. 왼쪽 메뉴 "빌드" → "Authentication" → "시작하기"
2. "Sign-in method" 탭 → Google → 사용 설정 → 저장

### 1-4. 웹 앱 등록 및 config 복사
1. 프로젝트 설정(톱니바퀴) → "내 앱" → `</>` 웹 앱 추가
2. 닉네임 입력 → 앱 등록
3. 아래 `firebaseConfig` 값 복사해두기

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## Step 2 — index.html 설정

최신 코드는 `index.html` 파일을 그대로 사용하세요. (전체 화면·로직이 담긴 단일 파일)

`index.html` 상단의 `firebaseConfig` 부분을 Step 1에서 복사한 값으로 교체하고,
`DEV_MODE`를 `false`로 설정하면 됩니다.

---

## Step 3 — GitHub Pages 배포

```bash
# 1. 로컬에서 repository 초기화
mkdir parents-order && cd parents-order
git init
git branch -M main

# 2. index.html, README.md 파일 추가
git add index.html
git commit -m "init: 부모님 주문앱"

# 3. GitHub에 push
git remote add origin https://github.com/[내아이디]/parents-order.git
git push -u origin main
```

GitHub 콘솔에서:
1. repository → Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` / `/ (root)` → Save

약 1~2분 후 `https://[내아이디].github.io/parents-order` 접속 가능.

---

## Step 4 — Firebase 보안 규칙 수정

테스트 모드는 30일 후 만료됨. Realtime Database → 규칙 탭에서 아래로 교체:

```json
{
  "rules": {
    "families": {
      "$familyId": {
        ".read": true,
        ".write": "auth != null && auth.uid == $familyId"
      }
    },
    "orders": {
      "$familyId": {
        ".read": "auth != null && auth.uid == $familyId",
        ".write": "auth != null && auth.uid == $familyId",
        "$orderId": {
          ".write": "!data.exists() && newData.exists()",
          ".validate": "newData.hasChildren(['storeName','ts'])"
        }
      }
    }
  }
}
```

- `families` — 읽기: 누구나(부모님 링크) / 쓰기: 로그인 본인만
- `orders` — 읽기: 자녀 본인만 / 생성: 누구나(비로그인 부모님 주문 기록), 수정·삭제 불가
- 주문 알림 기능을 쓰려면 `orders` 규칙을 반드시 배포할 것

---

## Step 5 — Firebase 승인된 도메인 추가

GitHub Pages 도메인을 Firebase에 등록해야 Google 로그인이 동작함.

1. Firebase 콘솔 → Authentication → Settings → 승인된 도메인
2. "도메인 추가" → `[내아이디].github.io` 입력 → 추가

---

## 사용 흐름 요약

```
[자녀]
앱 접속 → Google 로그인 → 가게 등록 → 링크 복사 → 카톡으로 부모님 전송

[부모님]
링크 클릭 → 바로 주문 화면 → 가게 탭 → 메뉴 선택 → 전화 주문하기
```

---

## Firebase 무료 한도 (Spark 플랜)

| 항목 | 무료 한도 |
|------|----------|
| 동시 접속 | 100명 |
| 데이터 저장 | 1GB |
| 월 다운로드 | 10GB |
| Authentication | 무제한 |

가족 단위 사용은 한도 초과 가능성 없음.