"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Severity = "success" | "error" | "info" | "warning";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastContextValue = {
  showToast: (message: string, severity?: Severity, action?: ToastAction | null, durationMs?: number) => void;
};

type ToastState = { id: number; message: string; severity: Severity; action: ToastAction | null; duration: number };

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<Severity, React.ReactNode> = {
  success: <CheckCircle2 className="text-[#86EFAC]" />,
  error: <XCircle className="text-[#F87171]" />,
  warning: <AlertTriangle className="text-[#FCD34D]" />,
  info: <Info className="text-current opacity-80" />,
};

/**
 * Ink toast (docs/DESIGN.md §4.15): bottom-center on mobile, bottom-left on
 * desktop, optional single action such as Undo. Errors are announced
 * assertively; everything else politely.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const showToast = useCallback((message: string, severity: Severity = "info", action: ToastAction | null = null, durationMs = 5000) => {
    counter.current += 1;
    setToast({ id: counter.current, message, severity, action, duration: durationMs });
  }, []);

  useEffect(() => {
    if (!toast) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), toast.duration);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 md:justify-start md:p-6">
        <div role={toast?.severity === "error" ? "alert" : "status"} aria-live={toast?.severity === "error" ? "assertive" : "polite"} className="contents">
          {toast ? (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex w-full max-w-[460px] items-center gap-3 rounded-lg bg-inverse py-3 pl-4 pr-2 text-body-ui text-on-inverse shadow-float animate-[yy-toast-in_240ms_cubic-bezier(0.2,0.8,0.2,1)]",
              )}
            >
              <span aria-hidden className="inline-flex shrink-0 [&_svg]:size-5">{icons[toast.severity]}</span>
              <p className="min-w-0 flex-1">{toast.message}</p>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss();
                  }}
                  className="shrink-0 rounded-full px-3 py-1.5 text-sm font-bold underline-offset-4 hover:underline"
                >
                  {toast.action.label}
                </button>
              ) : null}
              <button type="button" onClick={dismiss} aria-label="Dismiss" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100">
                <X aria-hidden className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
