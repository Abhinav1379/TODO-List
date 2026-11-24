import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Repeat,
  RotateCcw,
  Timer,
  Trash2,
  X,
} from 'lucide-react';
import { Priority, Recurrence, Task, TaskDraft } from '../types/task';
import {
  addDaysToIsoDate,
  formatCreatedTime,
  formatDueDate,
  formatTagsInput,
  getLocalDateString,
  isTaskDueToday,
  isTaskOverdue,
  parseTagsInput,
  validateTaskTitle,
} from '../utils/taskUtils';

interface TaskItemProps {
  task: Task;
  isArchiveView: boolean;
  isCustomSort: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selectionMode: boolean;
  isSelected: boolean;
  selectedTag: string | null;
  onToggleSelect: (id: string) => void;
  onSelectTag: (tag: string | null) => void;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: TaskDraft) => void;
  onDelete: (id: string) => void;
  onRestoreArchived: (id: string) => void;
  onDeleteArchived: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onStartFocus: (taskId: string) => void;
  onMoveStep: (taskId: string, direction: 'up' | 'down') => void;
  onDragStartTask: (taskId: string) => void;
  onDropOnTask: (targetTaskId: string) => void;
}

const PRIORITY_STYLES: Record<Priority, { label: string; classes: string }> = {
  high: {
    label: 'High',
    classes:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/70',
  },
  medium: {
    label: 'Medium',
    classes:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/70',
  },
  low: {
    label: 'Low',
    classes:
      'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

const RECURRENCE_LABELS: Record<Exclude<Recurrence, 'none'>, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function TaskItem({
  task,
  isArchiveView,
  isCustomSort,
  canMoveUp,
  canMoveDown,
  selectionMode,
  isSelected,
  selectedTag,
  onToggleSelect,
  onSelectTag,
  onToggle,
  onUpdate,
  onDelete,
  onRestoreArchived,
  onDeleteArchived,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onStartFocus,
  onMoveStep,
  onDragStartTask,
  onDropOnTask,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editDueDate, setEditDueDate] = useState(task.dueDate ?? '');
  const [editTagsText, setEditTagsText] = useState(formatTagsInput(task.tags ?? []));
  const [editRecurrence, setEditRecurrence] = useState<Recurrence>(task.recurrence ?? 'none');
  const [editError, setEditError] = useState<string | null>(null);

  const today = getLocalDateString();
  const tomorrow = addDaysToIsoDate(today, 1);
  const nextWeek = addDaysToIsoDate(today, 7);

  const overdue = !isArchiveView && isTaskOverdue(task, today);
  const dueToday = !isArchiveView && isTaskDueToday(task, today);
  const priorityMeta = PRIORITY_STYLES[task.priority];

  const subtasks = task.subtasks ?? [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;

  const startEditing = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ?? '');
    setEditTagsText(formatTagsInput(task.tags ?? []));
    setEditRecurrence(task.recurrence ?? 'none');
    setEditError(null);
    setIsConfirmingDelete(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateTaskTitle(editTitle);
    if (validation.valid === false) {
      setEditError(validation.error);
      return;
    }

    onUpdate(task.id, {
      title: validation.title,
      description: editDescription.trim(),
      priority: editPriority,
      dueDate: editDueDate.trim() !== '' ? editDueDate.trim() : null,
      tags: parseTagsInput(editTagsText),
      recurrence: editRecurrence,
    });
    setIsEditing(false);
    setEditError(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    window.setTimeout(() => {
      if (isArchiveView) {
        onDeleteArchived(task.id);
      } else {
        onDelete(task.id);
      }
    }, 120);
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newSubtaskTitle.trim();
    if (!trimmed) return;
    onAddSubtask(task.id, trimmed);
    setNewSubtaskTitle('');
  };

  if (isEditing) {
    return (
      <li className="px-5 py-4 sm:px-6 bg-slate-50/80 dark:bg-slate-800/40 animate-task-enter">
        <form onSubmit={handleSaveEdit} onKeyDown={handleEditKeyDown} noValidate className="space-y-3">
          <div>
            <label
              htmlFor={`edit-title-${task.id}`}
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Title <span className="text-red-600 dark:text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id={`edit-title-${task.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                if (editError && e.target.value.trim().length > 0) {
                  setEditError(null);
                }
              }}
              aria-invalid={editError !== null}
              aria-describedby={editError ? `edit-error-${task.id}` : undefined}
              autoFocus
              className={`w-full min-h-[40px] px-3 py-1.5 text-sm rounded-lg border bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 ${
                editError
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {editError && (
              <p
                id={`edit-error-${task.id}`}
                role="alert"
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{editError}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor={`edit-description-${task.id}`}
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Description
            </label>
            <textarea
              id={`edit-description-${task.id}`}
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`edit-priority-${task.id}`}
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Priority
              </label>
              <select
                id={`edit-priority-${task.id}`}
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={`edit-due-${task.id}`}
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Due date
              </label>
              <input
                id={`edit-due-${task.id}`}
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  { label: 'Today', value: today },
                  { label: 'Tomorrow', value: tomorrow },
                  { label: 'Next week', value: nextWeek },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEditDueDate(preset.value)}
                    className="px-2 py-0.5 text-[11px] rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
                {editDueDate && (
                  <button
                    type="button"
                    onClick={() => setEditDueDate('')}
                    className="px-2 py-0.5 text-[11px] rounded border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={`edit-tags-${task.id}`}
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Tags
              </label>
              <input
                id={`edit-tags-${task.id}`}
                type="text"
                value={editTagsText}
                onChange={(e) => setEditTagsText(e.target.value)}
                placeholder="work, personal"
                className="w-full min-h-[40px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
              />
            </div>

            <div>
              <label
                htmlFor={`edit-recurrence-${task.id}`}
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Repeat
              </label>
              <select
                id={`edit-recurrence-${task.id}`}
                value={editRecurrence}
                onChange={(e) => setEditRecurrence(e.target.value as Recurrence)}
                className="w-full min-h-[40px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelEditing}
              className="min-h-[36px] px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[36px] px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
            >
              Save changes
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      data-overdue={overdue ? 'true' : 'false'}
      data-completed={task.completed ? 'true' : 'false'}
      draggable={isCustomSort && !isArchiveView}
      onDragStart={() => onDragStartTask(task.id)}
      onDragOver={(e) => {
        if (!isCustomSort || isArchiveView) return;
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        if (!isCustomSort || isArchiveView) return;
        e.preventDefault();
        setIsDragOver(false);
        onDropOnTask(task.id);
      }}
      className={`px-5 py-4 sm:px-6 transition-all duration-150 ease-out animate-task-enter ${
        isDeleting ? 'opacity-0 -translate-y-1 pointer-events-none' : 'opacity-100 translate-y-0'
      } ${
        isDragOver
          ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
          : overdue
          ? 'bg-red-50/70 dark:bg-red-950/25'
          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
      }`}
    >
      <div className="flex items-start gap-3">
        {isCustomSort && !isArchiveView && (
          <div className="pt-0.5 flex items-center gap-0.5 shrink-0 text-slate-400 dark:text-slate-500">
            <span className="p-1 cursor-grab active:cursor-grabbing" title="Drag to reorder" aria-hidden="true">
              <GripVertical className="w-4 h-4" />
            </span>
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => onMoveStep(task.id, 'up')}
                disabled={!canMoveUp}
                aria-label={`Move "${task.title}" up`}
                className="p-0.5 rounded hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <ArrowUp className="w-3 h-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onMoveStep(task.id, 'down')}
                disabled={!canMoveDown}
                aria-label={`Move "${task.title}" down`}
                className="p-0.5 rounded hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 cursor-pointer disabled:cursor-default"
              >
                <ArrowDown className="w-3 h-3" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {selectionMode && !isArchiveView && (
          <div className="pt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(task.id)}
              aria-label={`Select "${task.title}"`}
              className="w-5 h-5 rounded accent-indigo-600 cursor-pointer mt-0.5"
            />
          </div>
        )}

        {!isArchiveView && (
          <div className="pt-0.5 shrink-0">
            <div className="relative inline-flex items-center justify-center w-6 h-6">
              <input
                id={`task-toggle-${task.id}`}
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                className={`peer appearance-none w-5 h-5 rounded-md border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  task.completed
                    ? 'bg-indigo-600 border-indigo-600 dark:bg-indigo-500 dark:border-indigo-500'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 hover:border-indigo-500 dark:hover:border-indigo-400'
                }`}
              />
              {task.completed && (
                <Check
                  className="w-3.5 h-3.5 stroke-[2.5] text-white pointer-events-none absolute"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm sm:text-[15px] font-medium break-words transition-colors ${
                task.completed
                  ? 'line-through text-slate-400 dark:text-slate-500'
                  : overdue
                  ? 'text-red-900 dark:text-red-200'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {task.title}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${priorityMeta.classes}`}
            >
              {priorityMeta.label}
            </span>
            {(task.tags ?? []).map((tag) => {
              const isTagActive = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(isTagActive ? null : tag)}
                  className={`px-1.5 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer ${
                    isTagActive
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          {task.description && (
            <p
              className={`mt-1 text-sm break-words ${
                task.completed
                  ? 'line-through text-slate-400/90 dark:text-slate-500/90'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {task.dueDate && (
              <>
                <span
                  className={
                    overdue
                      ? 'inline-flex items-center gap-1 font-medium text-red-700 dark:text-red-400'
                      : dueToday
                      ? 'font-medium text-indigo-700 dark:text-indigo-400'
                      : undefined
                  }
                >
                  {overdue && <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  <span>
                    Due {formatDueDate(task.dueDate)}
                    {overdue ? ' · Overdue' : dueToday ? ' · Today' : ''}
                  </span>
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            {task.recurrence && task.recurrence !== 'none' && (
              <>
                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Repeat className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{RECURRENCE_LABELS[task.recurrence]}</span>
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span>Added {formatCreatedTime(task.createdAt)}</span>
            {!isArchiveView && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => setSubtasksExpanded((prev) => !prev)}
                  aria-expanded={subtasksExpanded}
                  aria-label={`Toggle subtasks for "${task.title}"`}
                  className="inline-flex items-center gap-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                >
                  {subtasksExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>
                    {subtasks.length > 0
                      ? `Subtasks (${completedSubtasksCount}/${subtasks.length})`
                      : 'Subtasks'}
                  </span>
                </button>
              </>
            )}
          </div>

          {!isArchiveView && subtasksExpanded && (
            <div className="mt-3 pl-3 border-l border-slate-200 dark:border-slate-700 space-y-2">
              {subtasks.length > 0 && (
                <ul className="space-y-1.5" aria-label={`Subtasks for "${task.title}"`}>
                  {subtasks.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between gap-2 text-xs">
                      <label className="inline-flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={sub.completed}
                          onChange={() => onToggleSubtask(task.id, sub.id)}
                          aria-label={`Mark subtask "${sub.title}" as ${
                            sub.completed ? 'incomplete' : 'complete'
                          }`}
                          className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                        />
                        <span
                          className={`truncate ${
                            sub.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {sub.title}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => onDeleteSubtask(task.id, sub.id)}
                        aria-label={`Remove subtask "${sub.title}"`}
                        className="p-1 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a subtask..."
                  aria-label={`Add subtask to "${task.title}"`}
                  className="flex-1 min-h-[34px] px-2.5 py-1 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isConfirmingDelete ? (
            <div
              role="group"
              aria-label={`Confirm delete "${task.title}"`}
              className="flex items-center gap-1.5"
            >
              <button
                type="button"
                onClick={handleConfirmDelete}
                aria-label={`Confirm delete "${task.title}"`}
                className="min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                aria-label={`Cancel delete "${task.title}"`}
                className="min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Cancel
              </button>
            </div>
          ) : isArchiveView ? (
            <>
              <button
                type="button"
                onClick={() => onRestoreArchived(task.id)}
                aria-label={`Restore "${task.title}"`}
                className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Restore</span>
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                aria-label={`Delete "${task.title}"`}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              {!task.completed && (
                <button
                  type="button"
                  onClick={() => onStartFocus(task.id)}
                  aria-label={`Start focus timer for "${task.title}"`}
                  title="Start 25m focus timer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
                >
                  <Timer className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={startEditing}
                aria-label={`Edit "${task.title}"`}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
              >
                <Pencil className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                aria-label={`Delete "${task.title}"`}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
