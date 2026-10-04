'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Archive, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger' | 'warning';
  iconType?: 'archive' | 'danger' | 'warning' | 'check';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  iconType = 'archive',
  isLoading = false,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pb-16 sm:pb-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-up"
      >
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {iconType === 'archive' && (
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Archive className="w-5 h-5" />
              </div>
            )}
            {iconType === 'danger' && (
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
            )}
            {iconType === 'warning' && (
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {iconType === 'check' && (
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}

            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80">
          {description}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-300 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : variant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 font-black'
                : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:opacity-95 text-slate-950 shadow-emerald-500/30'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </span>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
