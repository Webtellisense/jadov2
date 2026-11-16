"use client";
import type { ButtonHTMLAttributes } from "react";
import { useHydrated } from "@/lib/use-hydrated";
export function Button({
  variant = "primary",
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) {
  const ready = useHydrated();
  return (
    <button
      className={`button ${variant} ${className}`}
      disabled={disabled || !ready}
      {...props}
    />
  );
}
