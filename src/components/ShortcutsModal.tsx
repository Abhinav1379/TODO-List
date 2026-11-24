import React from 'react';
import { X } from 'lucide-react';

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: '/ or Ctrl+K', action: 'Focus search box' },
  { keys: 'N', action: 'Focus new task title' },
  { keys: 'Enter', action: 'Add task (in form) or save edit' },
  { keys: 'Esc', action: 'Cancel edit or close modal' },
  { keys: '?', action: 'Toggle this shortcuts guide' },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-4 animate-task-enter"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="shortcuts-modal-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100"
          >
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts guide"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {SHORTCUTS.map((item) => (
            <li key={item.keys} className="py-2.5 flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-700 dark:text-slate-300">{item.action}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
