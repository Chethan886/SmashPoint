'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export interface ToastMessage {
  id: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[9999] pointer-events-none flex flex-col gap-2.5">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto rounded-2xl p-3.5 sm:p-4 border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-down flex items-start gap-3 ${
        isSuccess
          ? 'bg-slate-900/95 border-emerald-500/40 text-white shadow-emerald-950/40'
          : isError
          ? 'bg-slate-900/95 border-rose-500/40 text-white shadow-rose-950/40'
          : 'bg-slate-900/95 border-slate-700 text-white shadow-slate-950/50'
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess && (
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}
        {isError && (
          <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
            <AlertCircle className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}
        {!isSuccess && !isError && (
          <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Info className="w-4 h-4 stroke-[2.5]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className="text-xs font-black text-white tracking-tight mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-slate-300 leading-snug break-words">
          {toast.message}
        </p>

        {/* Optional Action Button */}
        {toast.action && (
          <div className="mt-2">
            {toast.action.href ? (
              <Link
                href={toast.action.href}
                onClick={() => onDismiss(toast.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 active:scale-95 transition-all"
              >
                <span>{toast.action.label}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick?.();
                  onDismiss(toast.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 active:scale-95 transition-all"
              >
                <span>{toast.action.label}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
