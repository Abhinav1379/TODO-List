import React, { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Download, Upload, X } from 'lucide-react';
import { Task } from '../types/task';
import {
  getLocalDateString,
  parseImportedTasksJson,
  serializeTasksToCsv,
  serializeTasksToJson,
} from '../utils/taskUtils';

interface DataPortabilityModalProps {
  tasks: Task[];
  archivedTasks: Task[];
  onImport: (importedTasks: Task[], importedArchive: Task[], mode: 'merge' | 'replace') => void;
  onClose: () => void;
}

function triggerFileDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function DataPortabilityModal({
  tasks,
  archivedTasks,
  onImport,
  onClose,
}: DataPortabilityModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const today = getLocalDateString();

  const handleExportJson = () => {
    const json = serializeTasksToJson(tasks, archivedTasks);
    triggerFileDownload(`taskflow-backup-${today}.json`, json, 'application/json');
    setStatus({
      type: 'success',
      message: `Exported ${tasks.length} tasks and ${archivedTasks.length} archived items as JSON.`,
    });
  };

  const handleExportCsv = () => {
    const csv = serializeTasksToCsv([...tasks, ...archivedTasks]);
    triggerFileDownload(`taskflow-tasks-${today}.csv`, csv, 'text/csv;charset=utf-8;');
    setStatus({
      type: 'success',
      message: `Exported ${tasks.length + archivedTasks.length} tasks as CSV.`,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseImportedTasksJson(text);
      if (result.valid === false) {
        setStatus({ type: 'error', message: result.error });
        return;
      }
      onImport(result.tasks, result.archivedTasks, importMode);
      setStatus({
        type: 'success',
        message: `Imported ${result.tasks.length} tasks (${importMode} mode).`,
      });
    } catch {
      setStatus({ type: 'error', message: 'Could not read the selected file.' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="data-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-6 space-y-5 animate-task-enter"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2
              id="data-modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              Export & Import Data
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Back up your local tasks or restore from a JSON file.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close export and import modal"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">Export backup</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Import from JSON
          </h3>

          <div className="flex items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="accent-indigo-600"
              />
              <span>Merge with existing</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="import-mode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="accent-indigo-600"
              />
              <span>Replace all tasks</span>
            </label>
          </div>

          <input
            ref={fileInputRef}
            id="import-json-file"
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[40px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-sm font-semibold text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Choose JSON file</span>
          </button>
        </div>

        {status && (
          <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={`flex items-center gap-2 text-xs font-medium px-3 py-2.5 rounded-lg border ${
              status.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            {status.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{status.message}</span>
          </p>
        )}
      </div>
    </div>
  );
}
