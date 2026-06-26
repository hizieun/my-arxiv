"use client";

import { useFormStatus } from "react-dom";

interface Props {
  message: string; // 확인 다이얼로그 문구
  children: React.ReactNode;
  className?: string;
  pendingChildren?: React.ReactNode;
}

// 서버액션 폼의 파괴적 제출 버튼: 클릭 시 confirm으로 한 번 더 확인하고,
// 제출 중에는 비활성화한다. (글/댓글 삭제 등)
export function ConfirmButton({ message, children, className, pendingChildren }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {pending ? (pendingChildren ?? children) : children}
    </button>
  );
}
