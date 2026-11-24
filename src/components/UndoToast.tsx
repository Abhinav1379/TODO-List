import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  canUndo: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, canUndo, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 sm:max-w-sm animate-task-enter"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900 text-slate-100 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 shadow-lg">
        <span className="text-sm font-medium truncate">{message}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="inline-flex items-center gap-1 min-h-[32px] px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Undo</span>
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
