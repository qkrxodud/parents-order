# 단골집 주문 (부모님 주문앱)

부모님이 **링크만 열면 로그인 없이** 바로 단골 가게에 전화 주문할 수 있도록,
자녀가 가게와 메뉴를 대신 등록해 두는 단일 HTML 웹앱입니다.

| 항목 | 내용 |
|------|------|
| 자녀(관리자) | Google 로그인 → 가게/메뉴 등록 → 공유 링크 생성 |
| 부모님 | 링크만 열면 로그인 없이 바로 주문 화면 |
| 호스팅 | GitHub Pages |
| 백엔드 | Firebase (Realtime Database + Authentication) |
| 비용 | 무료 (Firebase Spark 플랜) |

## 사용 흐름

```
[자녀]
앱 접속 → Google 로그인 → 가게/주소 등록 → 링크 복사 → 카톡으로 부모님 전송

[부모님]
링크 클릭 → 바로 주문 화면 → 가게 선택 → 메뉴 선택 → 포장/배달 선택 → 📞 전화 주문하기
```

> 📖 단계별 사용법은 [`GUIDE.md`](GUIDE.md)에서 자세히 확인하세요.

## 파일 구조

```
parents-order/
├── index.html   # 메인 앱 (전체 화면·로직이 담긴 단일 파일)
├── GUIDE.md     # 사용 가이드 (자녀/부모님)
├── plan.md      # 상세 구현/배포 가이드
└── README.md
```

## 개발 모드 (Firebase 없이 바로 실행)

`index.html` 상단의 `const DEV_MODE = true;` 가 켜져 있으면 Firebase 설정 없이
**목(mock) 로그인 + localStorage 기반 가짜 DB**로 바로 동작합니다.

- 브라우저로 `index.html`을 열고 "Google로 시작하기"를 누르면 가짜 계정(`dev-user-001`)으로 로그인됩니다.
- 첫 실행 시 샘플 가게("단골 짜장면집")가 자동 등록됩니다.
- 데이터는 브라우저 localStorage에 저장됩니다. (`parents-order-mock-db` 키 삭제 시 초기화)
- 부모님 화면 테스트: `index.html?fid=dev-user-001` 로 접속.
- 화면 우상단에 빨간 `DEV` 배지가 표시됩니다.

> 실제 배포 전에는 `DEV_MODE`를 `false`로 바꾸고 아래 셋업 절차로 Firebase를 연결하세요.

## 셋업 절차 (실제 배포)

> `index.html`의 `firebaseConfig`는 플레이스홀더(`YOUR_API_KEY` 등) 상태입니다.
> 실제로 동작시키려면 `DEV_MODE = false`로 바꾸고 아래 단계를 진행하세요. 자세한 화면별 안내는 `plan.md` 참고.

### 1. Firebase 콘솔 설정
1. [console.firebase.google.com](https://console.firebase.google.com) 에서 프로젝트 생성
2. **Realtime Database** 생성 — 위치 `asia-southeast1`(싱가포르), 테스트 모드로 시작
3. **Authentication** → Sign-in method → **Google** 사용 설정
4. 프로젝트 설정 → 웹 앱(`</>`) 추가 → `firebaseConfig` 값 복사

### 2. firebaseConfig 교체
`index.html` 내 `const firebaseConfig = { ... }` 블록의 플레이스홀더를
1단계에서 복사한 실제 값으로 교체합니다.

### 3. GitHub Pages 배포
```bash
git init
git branch -M main
git add index.html README.md
git commit -m "init: 부모님 주문앱"
git remote add origin https://github.com/[내아이디]/parents-order.git
git push -u origin main
```
GitHub repository → Settings → Pages → Source: `Deploy from a branch`,
Branch: `main` / `/ (root)` 저장. 1~2분 후
`https://[내아이디].github.io/parents-order` 접속 가능.

### 4. 보안 규칙 적용
테스트 모드는 30일 후 만료됩니다. Realtime Database → 규칙 탭에서 교체:
```json
{
  "rules": {
    "families": {
      "$familyId": {
        ".read": true,
        ".write": "auth != null && auth.uid == $familyId"
      }
    }
  }
}
```
- 읽기: 누구나 (부모님 링크 접근)
- 쓰기: 로그인한 본인 uid만

### 5. 승인된 도메인 추가
Firebase 콘솔 → Authentication → Settings → 승인된 도메인 →
`[내아이디].github.io` 추가 (Google 로그인 동작에 필요).

## 데이터 구조

```
families/
  {uid}/
    owner: {uid}
    stores/
      {storeKey}/
        name:  "단골 짜장면집"
        phone: "02-1234-5678"
        menus: ["짜장면", "짬뽕", "탕수육"]
```
공유 링크는 `...?fid={uid}` 형태이며, 부모님 화면은 이 `fid`로 해당 가족의 가게를 읽어옵니다.

## Firebase 무료 한도 (Spark 플랜)

| 항목 | 무료 한도 |
|------|----------|
| 동시 접속 | 100명 |
| 데이터 저장 | 1GB |
| 월 다운로드 | 10GB |
| Authentication | 무제한 |

가족 단위 사용은 한도 초과 가능성이 사실상 없습니다.
