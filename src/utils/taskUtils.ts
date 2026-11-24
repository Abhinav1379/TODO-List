import {
  FilterStatus,
  Priority,
  Recurrence,
  SortOption,
  Subtask,
  Task,
  TaskDraft,
} from '../types/task';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function validateTaskTitle(
  rawTitle: string
): { valid: true; title: string } | { valid: false; error: string } {
  const trimmed = rawTitle.trim();
  if (!trimmed) {
    return { valid: false, error: 'Please enter a task title.' };
  }
  return { valid: true, title: trimmed };
}

export function generateTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of raw.split(',')) {
    const cleaned = part.trim().replace(/^#+/, '').toLowerCase();
    if (cleaned && !seen.has(cleaned)) {
      seen.add(cleaned);
      result.push(cleaned);
    }
  }
  return result;
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(', ');
}

export function normalizeTask(raw: Partial<Task> & { id: string; title: string }): Task {
  const createdAt = typeof raw.createdAt === 'number' ? raw.createdAt : Date.now();
  const priority: Priority =
    raw.priority === 'low' || raw.priority === 'medium' || raw.priority === 'high'
      ? raw.priority
      : 'medium';
  const recurrence: Recurrence =
    raw.recurrence === 'daily' || raw.recurrence === 'weekly' || raw.recurrence === 'monthly'
      ? raw.recurrence
      : 'none';
  const subtasks: Subtask[] = Array.isArray(raw.subtasks)
    ? raw.subtasks
        .filter((s) => s && typeof s.title === 'string' && s.title.trim().length > 0)
        .map((s) => ({
          id: typeof s.id === 'string' ? s.id : generateTaskId(),
          title: s.title.trim(),
          completed: Boolean(s.completed),
        }))
    : [];
  const tags: string[] = Array.isArray(raw.tags)
    ? Array.from(
        new Set(
          raw.tags
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
            .filter(Boolean)
        )
      )
    : [];

  return {
    id: raw.id,
    title: raw.title.trim(),
    description: typeof raw.description === 'string' ? raw.description.trim() : '',
    priority,
    dueDate: typeof raw.dueDate === 'string' && raw.dueDate.trim() !== '' ? raw.dueDate.trim() : null,
    completed: Boolean(raw.completed),
    createdAt,
    tags,
    subtasks,
    recurrence,
    order: typeof raw.order === 'number' ? raw.order : createdAt,
  };
}

export function createTask(
  draft: TaskDraft,
  now: number = Date.now(),
  id: string = generateTaskId(),
  order: number = now
): Task {
  const validation = validateTaskTitle(draft.title);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  return {
    id,
    title: validation.title,
    description: draft.description.trim(),
    priority: draft.priority,
    dueDate: draft.dueDate && draft.dueDate.trim() !== '' ? draft.dueDate.trim() : null,
    completed: false,
    createdAt: now,
    tags: draft.tags ?? [],
    subtasks: draft.subtasks ?? [],
    recurrence: draft.recurrence ?? 'none',
    order,
  };
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

export function addMonthsToIsoDate(isoDate: string, months: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const targetMonthIndex = month - 1 + months;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  return getLocalDateString(new Date(targetYear, normalizedMonth, clampedDay));
}

export function getNextRecurrenceDate(
  dueDate: string | null,
  recurrence: Recurrence,
  todayIsoDate: string = getLocalDateString()
): string | null {
  if (recurrence === 'none') return dueDate;
  const baseDate = dueDate ?? todayIsoDate;
  if (recurrence === 'daily') return addDaysToIsoDate(baseDate, 1);
  if (recurrence === 'weekly') return addDaysToIsoDate(baseDate, 7);
  return addMonthsToIsoDate(baseDate, 1);
}

export function createNextRecurringTask(
  completedTask: Task,
  now: number = Date.now(),
  todayIsoDate: string = getLocalDateString(),
  nextId: string = generateTaskId()
): Task | null {
  if (completedTask.recurrence === 'none') return null;
  const nextDueDate = getNextRecurrenceDate(
    completedTask.dueDate,
    completedTask.recurrence,
    todayIsoDate
  );
  return {
    id: nextId,
    title: completedTask.title,
    description: completedTask.description,
    priority: completedTask.priority,
    dueDate: nextDueDate,
    completed: false,
    createdAt: now,
    tags: [...completedTask.tags],
    subtasks: completedTask.subtasks.map((s) => ({
      ...s,
      id: generateTaskId(),
      completed: false,
    })),
    recurrence: completedTask.recurrence,
    order: completedTask.order + 1,
  };
}

export function isTaskOverdue(
  task: Pick<Task, 'completed' | 'dueDate'>,
  todayIsoDate: string = getLocalDateString()
): boolean {
  if (task.completed || !task.dueDate) {
    return false;
  }
  return task.dueDate < todayIsoDate;
}

export function isTaskDueToday(
  task: Pick<Task, 'completed' | 'dueDate'>,
  todayIsoDate: string = getLocalDateString()
): boolean {
  if (task.completed || !task.dueDate) {
    return false;
  }
  return task.dueDate === todayIsoDate;
}

export function collectAllTags(tasks: Task[]): string[] {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    for (const tag of task.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.keys()).sort((a, b) => a.localeCompare(b));
}

export function filterTasks(
  tasks: Task[],
  filter: FilterStatus,
  searchQuery: string,
  selectedTag: string | null = null,
  todayIsoDate: string = getLocalDateString()
): Task[] {
  const query = searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filter === 'active' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'today' && !isTaskDueToday(task, todayIsoDate)) return false;
    if (filter === 'overdue' && !isTaskOverdue(task, todayIsoDate)) return false;

    if (selectedTag && !(task.tags ?? []).includes(selectedTag)) {
      return false;
    }

    if (query.length > 0) {
      const inTitle = task.title.toLowerCase().includes(query);
      const inDescription = task.description.toLowerCase().includes(query);
      const inTags = (task.tags ?? []).some((tag) => tag.includes(query));
      const inSubtasks = (task.subtasks ?? []).some((s) => s.title.toLowerCase().includes(query));
      return inTitle || inDescription || inTags || inSubtasks;
    }

    return true;
  });
}

export function sortTasks(tasks: Task[], sortBy: SortOption): Task[] {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'custom') {
      const diff = (b.order ?? b.createdAt) - (a.order ?? a.createdAt);
      if (diff !== 0) return diff;
      return b.createdAt - a.createdAt;
    }

    if (sortBy === 'priority') {
      const diff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (diff !== 0) return diff;
      return b.createdAt - a.createdAt;
    }

    if (sortBy === 'dueDate') {
      if (a.dueDate && b.dueDate) {
        const cmp = a.dueDate.localeCompare(b.dueDate);
        if (cmp !== 0) return cmp;
        return b.createdAt - a.createdAt;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    }

    return b.createdAt - a.createdAt;
  });
}

export function reorderTasksInCustomOrder(
  allTasks: Task[],
  draggedId: string,
  targetId: string
): Task[] {
  if (draggedId === targetId) return allTasks;
  const ordered = sortTasks(allTasks, 'custom');
  const fromIndex = ordered.findIndex((t) => t.id === draggedId);
  const toIndex = ordered.findIndex((t) => t.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return allTasks;

  const updated = [...ordered];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);

  const base = updated.length;
  return updated.map((task, idx) => ({
    ...task,
    order: base - idx,
  }));
}

export function countActiveTasks(tasks: Task[]): number {
  return tasks.reduce((count, task) => (task.completed ? count : count + 1), 0);
}

export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split('-').map(Number);
  if (!year || !month || !day) return dueDate;
  const localDate = new Date(year, month - 1, day);
  return localDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatCreatedTime(createdAt: number): string {
  const date = new Date(createdAt);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTimerSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function serializeTasksToJson(tasks: Task[], archivedTasks: Task[] = []): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      archivedTasks,
    },
    null,
    2
  );
}

export function parseImportedTasksJson(
  rawJson: string
): { valid: true; tasks: Task[]; archivedTasks: Task[] } | { valid: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { valid: false, error: 'Invalid JSON file.' };
  }

  let rawTasks: unknown[] = [];
  let rawArchive: unknown[] = [];

  if (Array.isArray(parsed)) {
    rawTasks = parsed;
  } else if (parsed && typeof parsed === 'object' && 'tasks' in parsed) {
    const obj = parsed as { tasks?: unknown; archivedTasks?: unknown };
    if (!Array.isArray(obj.tasks)) {
      return { valid: false, error: 'JSON file must contain a "tasks" array.' };
    }
    rawTasks = obj.tasks;
    if (Array.isArray(obj.archivedTasks)) {
      rawArchive = obj.archivedTasks;
    }
  } else {
    return { valid: false, error: 'Unrecognized backup format.' };
  }

  const normalizeList = (items: unknown[]): Task[] =>
    items
      .filter(
        (item): item is Partial<Task> & { title: string } =>
          typeof item === 'object' &&
          item !== null &&
          'title' in item &&
          typeof (item as { title?: unknown }).title === 'string' &&
          (item as { title: string }).title.trim().length > 0
      )
      .map((item) =>
        normalizeTask({
          ...item,
          id: typeof item.id === 'string' && item.id.trim() ? item.id : generateTaskId(),
          title: item.title,
        })
      );

  const tasks = normalizeList(rawTasks);
  const archivedTasks = normalizeList(rawArchive);
  if (tasks.length === 0 && archivedTasks.length === 0 && (rawTasks.length > 0 || rawArchive.length > 0)) {
    return { valid: false, error: 'No valid tasks found in the selected file.' };
  }

  return { valid: true, tasks, archivedTasks };
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeTasksToCsv(tasks: Task[]): string {
  const header = [
    'ID',
    'Title',
    'Description',
    'Priority',
    'Due Date',
    'Completed',
    'Tags',
    'Recurrence',
    'Subtasks Done',
    'Subtasks Total',
    'Created At',
  ];

  const rows = tasks.map((task) => {
    const subtasksDone = (task.subtasks ?? []).filter((s) => s.completed).length;
    const subtasksTotal = (task.subtasks ?? []).length;
    return [
      task.id,
      task.title,
      task.description,
      task.priority,
      task.dueDate ?? '',
      task.completed ? 'true' : 'false',
      (task.tags ?? []).join('; '),
      task.recurrence ?? 'none',
      String(subtasksDone),
      String(subtasksTotal),
      new Date(task.createdAt).toISOString(),
    ]
      .map(escapeCsvCell)
      .join(',');
  });

  return [header.join(','), ...rows].join('\n');
}
