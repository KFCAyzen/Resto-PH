import { useCallback, useEffect, useRef, useState } from "react";

type ToastState = { message: string; kind: "info" | "error" } | null;

// Notification discrète en bas de l'écran, à la place des alert() bloquants
export function useToast(duration = 2500) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, kind: "info" | "error" = "info") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, kind });
      timer.current = setTimeout(() => setToast(null), kind === "error" ? duration * 2 : duration);
    },
    [duration]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toastElement = toast ? (
    <div className={`toast ${toast.kind === "error" ? "error" : ""}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  ) : null;

  return { showToast, toastElement };
}
