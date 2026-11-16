"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { trapDialogFocus } from "@/lib/dialog-focus";
import { X } from "lucide-react";
export function AuthGate({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="sheet auth-sheet"
      ref={ref}
      onKeyDown={trapDialogFocus}
      aria-label="Sign in to continue"
      onCancel={(e) => {
        e.preventDefault();
        router.replace("/");
      }}
    >
      <button
        className="icon-button auth-close"
        onClick={() => router.replace("/")}
        aria-label="Close sign-in and continue browsing"
      >
        <X aria-hidden="true" />
      </button>
      {children}
    </dialog>
  );
}
