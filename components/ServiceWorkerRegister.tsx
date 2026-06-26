"use client";

import { useEffect } from "react";

// /sw.js 등록 (프로덕션에서만). 오프라인 캐시는 sw.js가 담당.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // 등록 실패는 치명적이지 않음 (앱은 그대로 동작)
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
