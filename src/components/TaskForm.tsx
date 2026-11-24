import React, { useState } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { Priority, Recurrence, TaskDraft } from '../types/task';
import {
  addDaysToIsoDate,
  getLocalDateString,
  parseTagsInput,
  validateTaskTitle,
} from '../utils/taskUtils';

interface TaskFormProps {
  onAddTask: (draft: TaskDraft) => void;
}

export function TaskForm({ onAddTask }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [error, setError] = useState<string | null>(null);

  const today = getLocalDateString();
  const tomorrow = addDaysToIsoDate(today, 1);
  const nextWeek = addDaysToIsoDate(today, 7);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateTaskTitle(title);
    if (validation.valid === false) {
      setError(validation.error);
      return;
    }

    onAddTask({
      title: validation.title,
      description,
      priority,
      dueDate: dueDate || null,
      tags: parseTagsInput(tagsText),
      recurrence,
    });

    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTagsText('');
    setRecurrence('none');
    setError(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (error && value.trim().length > 0) {
      setError(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800"
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Task title <span className="text-red-600 dark:text-red-400" aria-hidden="true">*</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="task-title"
              name="title"
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="What needs to be done?"
              aria-required="true"
              aria-invalid={error !== null}
              aria-describedby={error ? 'task-title-error' : undefined}
              className={`flex-1 min-h-[42px] px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 ${
                error
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add</span>
            </button>
          </div>
          {error && (
            <p
              id="task-title-error"
              role="alert"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6">
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Description
            </label>
            <input
              id="task-description"
              name="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or details"
              className="w-full min-h-[40px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="task-priority"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Priority
            </label>
            <select
              id="task-priority"
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full min-h-[40px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="task-due-date"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Due date
            </label>
            <input
              id="task-due-date"
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full min-h-[40px] px-3 py-2 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label
              htmlFor="task-tags"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Tags
            </label>
            <input
              id="task-tags"
              name="tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="work, personal (comma-separated)"
              className="w-full min-h-[40px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              htmlFor="task-recurrence"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
            >
              Repeat
            </label>
            <select
              id="task-recurrence"
              name="recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              className="w-full min-h-[40px] px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 cursor-pointer"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="sm:col-span-4 flex flex-wrap items-center gap-1.5 sm:justify-end">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-0.5">
              Quick date:
            </span>
            {[
              { label: 'Today', value: today },
              { label: 'Tomorrow', value: tomorrow },
              { label: 'Next week', value: nextWeek },
            ].map((preset) => {
              const active = dueDate === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setDueDate(active ? '' : preset.value)}
                  className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    active
                      ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                      : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </form>
  );
}
