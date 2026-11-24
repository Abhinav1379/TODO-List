import React, { useEffect, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { Task } from '../types/task';
import { formatTimerSeconds } from '../utils/taskUtils';

interface FocusTimerBarProps {
  task: Task;
  onCompleteTask: (id: string) => void;
  onClose: () => void;
}

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export function FocusTimerBar({ task, onCompleteTask, onClose }: FocusTimerBarProps) {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setMode('focus');
    setSecondsLeft(FOCUS_SECONDS);
    setIsRunning(true);
  }, [task.id]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const switchMode = (nextMode: 'focus' | 'break') => {
    setMode(nextMode);
    setIsRunning(false);
    setSecondsLeft(nextMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  return (
    <div
      role="region"
      aria-label="Focus timer"
      className="px-5 py-3.5 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-indigo-50/70 dark:bg-indigo-950/30 animate-task-enter"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <Timer className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <span>{mode === 'focus' ? 'Focus session' : 'Short break'}</span>
              {secondsLeft === 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Session complete</span>
                </>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {task.title}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex items-center rounded-lg bg-white/80 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900 p-0.5">
            <button
              type="button"
              onClick={() => switchMode('focus')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'focus'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              25m
            </button>
            <button
              type="button"
              onClick={() => switchMode('break')}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mode === 'break'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              5m
            </button>
          </div>

          <span
            data-testid="focus-timer-display"
            className="font-mono tabular-nums text-lg font-semibold text-slate-900 dark:text-slate-100 px-2"
          >
            {formatTimerSeconds(secondsLeft)}
          </span>

          <button
            type="button"
            onClick={() => setIsRunning((r) => !r)}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            className="inline-flex items-center gap-1 min-h-[34px] px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Start</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            aria-label="Reset timer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          {!task.completed && (
            <button
              type="button"
              onClick={() => {
                onCompleteTask(task.id);
                onClose();
              }}
              aria-label={`Mark "${task.title}" done and close timer`}
              className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Done</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close focus timer"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
