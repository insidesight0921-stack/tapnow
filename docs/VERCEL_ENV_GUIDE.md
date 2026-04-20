# Vercel 환경변수 확인 가이드: FIREBASE_SERVICE_ACCOUNT

도장 삭제 시 Firebase Auth 사용자를 함께 삭제하려면, Vercel의 서버리스 함수(`api/delete-user.js`)가 Firebase Admin SDK로 인증해야 합니다. 이를 위해 아래 환경변수가 반드시 설정되어 있어야 합니다.

## 확인 방법

1. **Vercel 대시보드 접속**: https://vercel.com/dashboard
2. 프로젝트(`tapnow`) 클릭
3. 상단 메뉴에서 **Settings** 탭 클릭
4. 왼쪽 사이드바에서 **Environment Variables** 클릭
5. 목록에서 `FIREBASE_SERVICE_ACCOUNT` 항목이 있는지 확인

## 없는 경우: 환경변수 추가 방법

### Step 1: Firebase 서비스 계정 키 다운로드
1. **Firebase Console** 접속: https://console.firebase.google.com/
2. 프로젝트 선택 (`tapnow-f07e4`)
3. 좌측 톱니바퀴(⚙️) → **프로젝트 설정** 클릭
4. **서비스 계정** 탭 클릭
5. **새 비공개 키 생성** 버튼 클릭 → JSON 파일 다운로드

### Step 2: Vercel에 환경변수 등록
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. **Key**: `FIREBASE_SERVICE_ACCOUNT`
3. **Value**: 다운로드 받은 JSON 파일의 **전체 내용**을 복사하여 붙여넣기
4. Environment: `Production`, `Preview`, `Development` 모두 체크
5. **Save** 클릭
6. **⚠️ 중요**: 저장 후 프로젝트를 **Redeploy**(재배포) 해야 적용됩니다.
   - Deployments 탭 → 가장 최근 배포의 `...` 메뉴 → **Redeploy** 클릭
