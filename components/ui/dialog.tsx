"use client";
import { useRef, useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./core";
import { trapDialogFocus } from "@/lib/dialog-focus";
export function Sheet({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opened = useRef(false);
  useEffect(() => {
    const close = () => {
      if (opened.current) {
        ref.current?.close();
        opened.current = false;
      }
    };
    window.addEventListener("popstate", close);
    return () => window.removeEventListener("popstate", close);
  }, []);
  function dismiss() {
    if (opened.current) history.back();
  }
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          history.pushState(
            { ...history.state, jadoSheet: true },
            "",
            `${location.pathname}${location.search}#jado-sheet`,
          );
          opened.current = true;
          ref.current?.showModal();
        }}
      >
        {trigger}
      </Button>
      <dialog
        ref={ref}
        className="sheet"
        aria-label={title}
        onKeyDown={trapDialogFocus}
        onCancel={(e) => {
          e.preventDefault();
          dismiss();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) dismiss();
        }}
      >
        <div className="sheet-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={dismiss}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
