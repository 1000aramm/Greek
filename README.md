# Greek Flashcards (Ἑλληνικά)

그리스어 → 영어 플래시카드 웹앱(PWA)이에요. 폰 브라우저에서 열고 **홈 화면에 추가**하면 앱처럼 쓸 수 있어요. 아이폰이랑 안드로이드 둘 다 돼요.

## 기능

- **플래시카드**: 카드를 탭하면 뒤집히면서 영어 뜻이 나와요. 뒤집은 다음 *알아요 / 몰라요*를 누르면 모르는 단어가 그 세션 끝에 다시 나와요.
- **사진으로 단어 추가**: 단어장 사진을 찍거나 앨범에서 고르면 Gemini가 그리스어랑 영어 뜻을 읽어서 목록으로 보여줘요. 체크하고, 고치고, 저장하면 끝이에요.
  - 어느 리스트에 넣을지 고를 수 있어요 (List 1, 2, 3, 4, + 새 리스트).
  - 품사(명사/동사/형용사…)를 한꺼번에 정하거나 단어마다 따로 정할 수 있어요.
- **골라서 공부하기**: 리스트별, 품사별로 고를 수 있고 둘을 같이 써도 돼요 (예: List 2의 동사만).
- **옵션**: 영어 → 그리스어 반대 모드, 섞기 (모르는 단어 먼저).
- **단어 관리**: 검색, 직접 추가/수정/삭제, 리스트 통째로 삭제.
- **백업**: JSON 파일로 내보내기 / 불러오기 (관리자).
- 오프라인에서도 공부할 수 있어요 (사진 읽기만 인터넷이 필요해요).

## 관리자 모드 (Firebase)

Firebase를 연결하면 단어장이 클라우드에 **하나만** 저장되고 모두가 그걸 봐요.

- **관리자(admin)**: ⚙️ Settings → Admin에서 로그인하면 *Add Words from Photo*, *Manage Words*가 보여요. 추가/수정/삭제하면 모든 사람 앱에 바로 반영돼요.
- **다른 사람들**: 로그인 없이 열자마자 공부만 할 수 있어요. 수정 버튼은 안 보여요.
- *Know it / Don't know* 학습 기록은 사람마다 자기 기기에 따로 저장돼요.
- 인터넷이 없어도 마지막으로 받은 단어로 공부할 수 있어요.
- 보안은 `firestore.rules`가 맡아요: 누구나 읽을 수 있고, 관리자 UID만 쓸 수 있어요.

`src/firebaseConfig.ts`의 `projectId`가 비어 있으면 Firebase 없이 **로컬 모드**로 돌아가요 (단어가 그 기기 안에만 저장돼요).

### Firebase 설정 순서

1. https://console.firebase.google.com → **프로젝트 추가**
2. **Authentication** → 시작하기 → Sign-in method에서 **이메일/비밀번호** 사용 설정
3. Authentication → **Users** → 사용자 추가 (관리자 이메일 + 비밀번호) → 생긴 **User UID** 복사
4. (권장) Authentication → Settings → 사용자 작업에서 **가입(생성) 허용** 끄기
5. **Firestore Database** → 데이터베이스 만들기 (프로덕션 모드) → **규칙** 탭에 `firestore.rules` 내용 붙여넣고 `ADMIN_UID_HERE`를 3번의 UID로 바꾼 다음 게시
6. 프로젝트 설정 → 내 앱 → 웹(`</>`) 앱 등록 → `firebaseConfig` 값을 `src/firebaseConfig.ts`에 붙여넣고, `ADMIN_UID`에도 3번의 UID를 넣기

## Gemini API 키

1. https://aistudio.google.com/apikey 에서 키를 만들어요 (무료 사용량 있음).
2. 앱 → ⚙️ 설정 → API 키 붙여넣기 → 저장.

기본 모델은 `gemini-3.6-flash`이고, 설정에서 바꿀 수 있어요.

## 개발

```bash
npm install
npm run dev      # http://localhost:5173 (같은 와이파이 폰에서도 접속 가능)
npm run build    # dist/ 에 빌드
```

## 배포 (GitHub Pages)

1. GitHub 레포 → **Settings → Pages → Source**를 **GitHub Actions**로 설정해요.
2. `main`에 푸시하면 자동으로 배포돼요 (Actions 탭에서 수동으로 돌려도 돼요).
3. 주소: `https://<유저명>.github.io/<레포명>/`

## 폰에 설치하기

- **아이폰 (Safari)**: 공유 버튼 → **홈 화면에 추가**
- **안드로이드 (Chrome)**: ⋮ 메뉴 → **홈 화면에 추가** / **앱 설치**
