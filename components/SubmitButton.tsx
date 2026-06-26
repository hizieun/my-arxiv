"use client";

import { useFormStatus } from "react-dom";

interface Props {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}

// 서버액션 폼 제출 버튼: 제출 중 비활성화 + "처리 중…" 표시로 중복 제출 방지·피드백.
export function SubmitButton({ children, pendingLabel = "처리 중…", className }: Props) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
