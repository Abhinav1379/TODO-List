import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Database, Keyboard, Moon, Sun } from 'lucide-react';
import { DataPortabilityModal } from './components/DataPortabilityModal';
import { FilterBar } from './components/FilterBar';
import { FocusTimerBar } from './components/FocusTimerBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { UndoToast } from './components/UndoToast';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  FilterStatus,
  Priority,
  SortOption,
  Task,
  TaskDraft,
  ThemeMode,
  UndoSnapshot,
} from './types/task';
import {
  collectAllTags,
  countActiveTasks,
  createNextRecurringTask,
  createTask,
  filterTasks,
  generateTaskId,
  normalizeTask,
  reorderTasksInCustomOrder,
  sortTasks,
} from './utils/taskUtils';

export default function App() {
  const [rawTasks, setRawTasks] = useLocalStorage<Task[]>('todo-tasks', []);
  const [rawArchive, setRawArchive] = useLocalStorage<Task[]>('todo-archive', []);
  const [theme, setTheme] = useLocalStorage<ThemeMode>('todo-theme', 'light');

  const tasks = useMemo(() => rawTasks.map(normalizeTask), [rawTasks]);
  const archivedTasks = useMemo(() => rawArchive.map(normalizeTask), [rawArchive]);

  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [undoState, setUndoState] = useState<UndoSnapshot | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current !== null) {
        window.clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target !== null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('task-search')?.focus();
        return;
      }

      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isDataModalOpen) {
          setIsDataModalOpen(false);
          return;
        }
        if (target?.id === 'task-search') {
          if (searchQuery) {
            setSearchQuery('');
          } else {
            target.blur();
          }
        }
        return;
      }

      if (isEditable) return;

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('task-search')?.focus();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        document.getElementById('task-title')?.focus();
      } else if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDataModalOpen, isShortcutsOpen, searchQuery]);

  const pushUndo = (message: string, prevTasks: Task[], prevArchive: Task[]) => {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current);
    }
    setUndoState({
      id: generateTaskId(),
      message,
      tasks: prevTasks,
      archivedTasks: prevArchive,
    });
    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoState(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleUndo = () => {
    if (!undoState) return;
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setRawTasks(undoState.tasks);
    setRawArchive(undoState.archivedTasks);
    setUndoState(null);
  };

  const handleDismissUndo = () => {
    if (undoTimeoutRef.current !== null) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    setUndoState(null);
  };

  const handleAddTask = (draft: TaskDraft) => {
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
    const newTask = createTask(draft, Date.now(), generateTaskId(), maxOrder + 1);
    setRawTasks([newTask, ...tasks]);
  };

  const handleToggleTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const nextCompleted = !target.completed;
    let updated = tasks.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t));

    if (nextCompleted && target.recurrence !== 'none') {
      const nextOccurrence = createNextRecurringTask(target);
      if (nextOccurrence) {
        pushUndo(
          `Scheduled next ${target.recurrence} occurrence`,
          tasks,
          archivedTasks
        );
        updated = [nextOccurrence, ...updated];
      }
    }

    setRawTasks(updated);
  };

  const handleUpdateTask = (id: string, updates: TaskDraft) => {
    setRawTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              title: updates.title,
              description: updates.description,
              priority: updates.priority,
              dueDate: updates.dueDate,
              tags: updates.tags ?? task.tags,
              recurrence: updates.recurrence ?? task.recurrence,
            }
          : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    pushUndo(`Deleted "${target.title}"`, tasks, archivedTasks);
    setRawTasks(tasks.filter((t) => t.id !== id));
    if (focusTaskId === id) setFocusTaskId(null);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearCompleted = () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    if (completedCount === 0) return;
    pushUndo(
      `Cleared ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}`,
      tasks,
      archivedTasks
    );
    setRawTasks(tasks.filter((t) => !t.completed));
  };

  const handleArchiveCompleted = () => {
    const completed = tasks.filter((t) => t.completed);
    if (completed.length === 0) return;
    pushUndo(
      `Archived ${completed.length} completed ${completed.length === 1 ? 'task' : 'tasks'}`,
      tasks,
      archivedTasks
    );
    setRawTasks(tasks.filter((t) => !t.completed));
    setRawArchive([...completed, ...archivedTasks]);
  };

  const handleRestoreArchived = (id: string) => {
    const target = archivedTasks.find((t) => t.id === id);
    if (!target) return;
    pushUndo(`Restored "${target.title}"`, tasks, archivedTasks);
    setRawArchive(archivedTasks.filter((t) => t.id !== id));
    setRawTasks([target, ...tasks]);
  };

  const handleDeleteArchived = (id: string) => {
    const target = archivedTasks.find((t) => t.id === id);
    if (!target) return;
    pushUndo(`Deleted "${target.title}" from archive`, tasks, archivedTasks);
    setRawArchive(archivedTasks.filter((t) => t.id !== id));
  };

  const handleEmptyArchive = () => {
    if (archivedTasks.length === 0) return;
    pushUndo('Emptied archive', tasks, archivedTasks);
    setRawArchive([]);
  };

  const handleAddSubtask = (taskId: string, title: string) => {
    setRawTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: [
                ...task.subtasks,
                { id: generateTaskId(), title, completed: false },
              ],
            }
          : task
      )
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setRawTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : task
      )
    );
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setRawTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
            }
          : task
      )
    );
  };

  const handleFilterChange = (nextFilter: FilterStatus) => {
    setFilter(nextFilter);
    if (nextFilter === 'archive') {
      setSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const handleResetFilters = () => {
    setFilter('all');
    setSearchQuery('');
    setSelectedTag(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const activeCount = useMemo(() => countActiveTasks(tasks), [tasks]);
  const completedCount = tasks.length - activeCount;
  const availableTags = useMemo(() => collectAllTags(tasks), [tasks]);

  const visibleTasks = useMemo(() => {
    const source = filter === 'archive' ? archivedTasks : tasks;
    const filtered = filterTasks(
      source,
      filter === 'archive' ? 'all' : filter,
      searchQuery,
      filter === 'archive' ? null : selectedTag
    );
    return sortTasks(filtered, sortBy);
  }, [archivedTasks, filter, searchQuery, selectedTag, sortBy, tasks]);

  const handleToggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const visibleIdList = visibleTasks.map((t) => t.id);
    const allSelected = visibleIdList.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIdList));
    }
  };

  const handleBulkComplete = () => {
    if (selectedIds.size === 0) return;
    pushUndo(`Completed ${selectedIds.size} selected tasks`, tasks, archivedTasks);
    setRawTasks(
      tasks.map((t) => (selectedIds.has(t.id) ? { ...t, completed: true } : t))
    );
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkPriority = (priority: Priority) => {
    if (selectedIds.size === 0) return;
    setRawTasks(
      tasks.map((t) => (selectedIds.has(t.id) ? { ...t, priority } : t))
    );
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    pushUndo(`Deleted ${selectedIds.size} selected tasks`, tasks, archivedTasks);
    setRawTasks(tasks.filter((t) => !selectedIds.has(t.id)));
    if (focusTaskId && selectedIds.has(focusTaskId)) {
      setFocusTaskId(null);
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const handleMoveStep = (taskId: string, direction: 'up' | 'down') => {
    const index = visibleTasks.findIndex((t) => t.id === taskId);
    if (index === -1) return;
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= visibleTasks.length) return;
    const targetId = visibleTasks[swapIndex].id;
    setRawTasks(reorderTasksInCustomOrder(tasks, taskId, targetId));
  };

  const handleDropOnTask = (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;
    setRawTasks(reorderTasksInCustomOrder(tasks, draggedTaskId, targetTaskId));
    setDraggedTaskId(null);
  };

  const handleImportData = (
    importedTasks: Task[],
    importedArchive: Task[],
    mode: 'merge' | 'replace'
  ) => {
    pushUndo('Imported backup data', tasks, archivedTasks);
    if (mode === 'replace') {
      setRawTasks(importedTasks);
      setRawArchive(importedArchive);
      return;
    }

    const existingIds = new Set(tasks.map((t) => t.id));
    const mergedTasks = [
      ...importedTasks.filter((t) => !existingIds.has(t.id)),
      ...tasks,
    ];
    const existingArchiveIds = new Set(archivedTasks.map((t) => t.id));
    const mergedArchive = [
      ...importedArchive.filter((t) => !existingArchiveIds.has(t.id)),
      ...archivedTasks,
    ];
    setRawTasks(mergedTasks);
    setRawArchive(mergedArchive);
  };

  const focusTask = useMemo(
    () => tasks.find((t) => t.id === focusTaskId) ?? null,
    [focusTaskId, tasks]
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 px-4 py-6 sm:px-6 sm:py-12">
      <main className="mx-auto w-full max-w-3xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Taskflow
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Keep track of priorities, deadlines, and daily work.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            >
              <Keyboard className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDataModalOpen(true)}
              aria-label="Export or import data"
              className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            >
              <Database className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <span>Backup</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center gap-2 min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-600" aria-hidden="true" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>
        </header>

        <section
          aria-label="To-do workspace"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden"
        >
          <TaskForm onAddTask={handleAddTask} />
          <FilterBar
            filter={filter}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            availableTags={availableTags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
            activeCount={activeCount}
            completedCount={completedCount}
            archiveCount={archivedTasks.length}
            onClearCompleted={handleClearCompleted}
            onArchiveCompleted={handleArchiveCompleted}
            onEmptyArchive={handleEmptyArchive}
            selectionMode={selectionMode}
            selectedCount={selectedIds.size}
            visibleCount={visibleTasks.length}
            onToggleSelectionMode={handleToggleSelectionMode}
            onSelectAllVisible={handleSelectAllVisible}
            onBulkComplete={handleBulkComplete}
            onBulkPriority={handleBulkPriority}
            onBulkDelete={handleBulkDelete}
          />
          {focusTask && (
            <FocusTimerBar
              task={focusTask}
              onCompleteTask={handleToggleTask}
              onClose={() => setFocusTaskId(null)}
            />
          )}
          <TaskList
            tasks={visibleTasks}
            totalTaskCount={filter === 'archive' ? archivedTasks.length : tasks.length}
            isArchiveView={filter === 'archive'}
            isCustomSort={sortBy === 'custom'}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            selectedTag={selectedTag}
            onToggleSelect={handleToggleSelect}
            onSelectTag={setSelectedTag}
            onToggle={handleToggleTask}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            onRestoreArchived={handleRestoreArchived}
            onDeleteArchived={handleDeleteArchived}
            onAddSubtask={handleAddSubtask}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onStartFocus={(id) => setFocusTaskId(id)}
            onMoveStep={handleMoveStep}
            onDragStartTask={(id) => setDraggedTaskId(id)}
            onDropOnTask={handleDropOnTask}
            onResetFilters={handleResetFilters}
          />
        </section>
      </main>

      {undoState && (
        <UndoToast
          message={undoState.message}
          canUndo={true}
          onUndo={handleUndo}
          onDismiss={handleDismissUndo}
        />
      )}

      {isDataModalOpen && (
        <DataPortabilityModal
          tasks={tasks}
          archivedTasks={archivedTasks}
          onImport={handleImportData}
          onClose={() => setIsDataModalOpen(false)}
        />
      )}

      {isShortcutsOpen && <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />}
    </div>
  );
}
