"use client";
import { useSyncExternalStore } from "react";
const subscribe = (notify: () => void) => {
  window.addEventListener("jado-preferences", notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener("jado-preferences", notify);
    window.removeEventListener("storage", notify);
  };
};
const snapshot = () => {
  try {
    return (
      localStorage.getItem("jado-data-saver") === "true" ||
      (localStorage.getItem("jado-data-saver") === null &&
        !!(navigator as Navigator & { connection?: { saveData?: boolean } })
          .connection?.saveData)
    );
  } catch {
    return false;
  }
};
export function useDataSaver() {
  return useSyncExternalStore(subscribe, snapshot, () => true);
}
