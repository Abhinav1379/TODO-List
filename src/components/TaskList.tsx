import React from 'react';
import { Archive, ClipboardList } from 'lucide-react';
import { Task, TaskDraft } from '../types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  totalTaskCount: number;
  isArchiveView: boolean;
  isCustomSort: boolean;
  selectionMode: boolean;
  selectedIds: Set<string>;
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
  onResetFilters: () => void;
}

export function TaskList({
  tasks,
  totalTaskCount,
  isArchiveView,
  isCustomSort,
  selectionMode,
  selectedIds,
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
  onResetFilters,
}: TaskListProps) {
  if (isArchiveView && tasks.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="mx-auto w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
          <Archive className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {totalTaskCount === 0 ? 'No archived tasks' : 'No matching archived tasks'}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {totalTaskCount === 0
            ? 'Use "Archive completed" to move finished tasks here for safekeeping.'
            : 'Try clearing your search query.'}
        </p>
      </div>
    );
  }

  if (!isArchiveView && totalTaskCount === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="mx-auto w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3">
          <ClipboardList className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">No tasks yet</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add a task above to start organizing your list.
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          No matching tasks
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your search, tag, or filter selection.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-4 inline-flex items-center justify-center min-h-[36px] px-4 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          Reset filters
        </button>
      </div>
    );
  }

  return (
    <ul aria-label="Task list" className="divide-y divide-slate-200 dark:divide-slate-800">
      {tasks.map((task, idx) => (
        <TaskItem
          key={task.id}
          task={task}
          isArchiveView={isArchiveView}
          isCustomSort={isCustomSort}
          canMoveUp={idx > 0}
          canMoveDown={idx < tasks.length - 1}
          selectionMode={selectionMode}
          isSelected={selectedIds.has(task.id)}
          selectedTag={selectedTag}
          onToggleSelect={onToggleSelect}
          onSelectTag={onSelectTag}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onRestoreArchived={onRestoreArchived}
          onDeleteArchived={onDeleteArchived}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
          onStartFocus={onStartFocus}
          onMoveStep={onMoveStep}
          onDragStartTask={onDragStartTask}
          onDropOnTask={onDropOnTask}
        />
      ))}
    </ul>
  );
}
