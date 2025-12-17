import { GET_STARTED_LINK, SIGN_IN_LINK } from "@/constants/links";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isBarcelonaApp(): boolean {
  if (typeof window === "undefined") return false;

  return /barcelona/i.test(navigator.userAgent);
}

const ALERT_MESSAGE = `[페이지 이동 전 안내]
  
  스레드 인앱브라우저에서는 구글로그인이 제한됩니다. (이메일/구글/깃허브 로그인이 가능합니다.) 구글로그인이 필요하시다면 크롬 등 외부브라우저에서 접속해주세요.`;

export function moveToSignIn() {
  if (isMobileDevice() && isBarcelonaApp()) {
    alert(ALERT_MESSAGE);
  }

  window.open(SIGN_IN_LINK, "_blank");
}

export function moveToGetStarted() {
  if (isMobileDevice() && isBarcelonaApp()) {
    alert(ALERT_MESSAGE);
  }

  window.open(GET_STARTED_LINK, "_blank");
}
