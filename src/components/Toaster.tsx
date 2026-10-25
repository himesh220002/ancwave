"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

let lastToastKey = "";
let lastToastTime = 0;
const toastListeners = new Set<(toast: ToastMessage) => void>();

export function toast(message: Omit<ToastMessage, "id">) {
  // Deduplicate identical toasts within 400ms (prevents double triggers / StrictMode duplicate displays)
  const signature = `${message.type}|${message.title}|${message.description || ""}`;
  const now = Date.now();
  if (signature === lastToastKey && now - lastToastTime < 400) {
    return;
  }
  lastToastKey = signature;
  lastToastTime = now;

  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastMessage = { ...message, id };

  // Dispatch via microtask so it never runs synchronously inside a component's render or state reducer
  const dispatch = () => {
    toastListeners.forEach((listener) => listener(newToast));
  };

  if (typeof queueMicrotask === "function") {
    queueMicrotask(dispatch);
  } else {
    setTimeout(dispatch, 0);
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (newToast: ToastMessage) => {
      setToasts((prev) => {
        if (prev.some((t) => t.id === newToast.id)) return prev;
        return [...prev, newToast];
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4500);
    };

    toastListeners.add(handler);
    return () => {
      toastListeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border bg-white/95 backdrop-blur-md border-[#E8E8E2] text-zinc-900 transition-all duration-300 transform translate-y-0"
        >
          {t.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          )}
          {t.type === "error" && (
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          )}
          {t.type === "info" && (
            <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-medium text-zinc-900">{t.title}</p>
            {t.description && (
              <p className="text-zinc-500 text-xs mt-0.5">{t.description}</p>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="text-zinc-400 hover:text-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
