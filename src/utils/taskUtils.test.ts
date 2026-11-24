import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectAllTags,
  countActiveTasks,
  createNextRecurringTask,
  createTask,
  filterTasks,
  formatTimerSeconds,
  getNextRecurrenceDate,
  isTaskDueToday,
  isTaskOverdue,
  parseImportedTasksJson,
  parseTagsInput,
  reorderTasksInCustomOrder,
  serializeTasksToCsv,
  serializeTasksToJson,
  sortTasks,
  validateTaskTitle,
} from './taskUtils';
import { Task } from '../types/task';

test('validateTaskTitle rejects empty and whitespace-only titles', () => {
  assert.deepEqual(validateTaskTitle(''), {
    valid: false,
    error: 'Please enter a task title.',
  });
  assert.deepEqual(validateTaskTitle('   \t\n  '), {
    valid: false,
    error: 'Please enter a task title.',
  });
  assert.deepEqual(validateTaskTitle('  Write documentation  '), {
    valid: true,
    title: 'Write documentation',
  });
});

test('createTask builds a valid Task with trimmed fields and phase 1-3 defaults', () => {
  const task = createTask(
    {
      title: '  Deploy release  ',
      description: '  Verify checklist first  ',
      priority: 'high',
      dueDate: '2026-11-30',
      tags: ['ops', 'release'],
      recurrence: 'weekly',
    },
    1700000000000,
    'test-uuid-1',
    42
  );

  assert.deepEqual(task, {
    id: 'test-uuid-1',
    title: 'Deploy release',
    description: 'Verify checklist first',
    priority: 'high',
    dueDate: '2026-11-30',
    completed: false,
    createdAt: 1700000000000,
    tags: ['ops', 'release'],
    subtasks: [],
    recurrence: 'weekly',
    order: 42,
  });
});

test('parseTagsInput deduplicates, trims, strips hashes, and lowercases tags', () => {
  assert.deepEqual(parseTagsInput(' Work, #personal , work ,  , Urgent '), [
    'work',
    'personal',
    'urgent',
  ]);
});

test('isTaskOverdue and isTaskDueToday classify dates accurately', () => {
  const today = '2026-11-24';
  assert.equal(isTaskOverdue({ completed: false, dueDate: '2026-11-23' }, today), true);
  assert.equal(isTaskOverdue({ completed: false, dueDate: '2026-11-24' }, today), false);
  assert.equal(isTaskOverdue({ completed: true, dueDate: '2026-11-20' }, today), false);

  assert.equal(isTaskDueToday({ completed: false, dueDate: '2026-11-24' }, today), true);
  assert.equal(isTaskDueToday({ completed: true, dueDate: '2026-11-24' }, today), false);
  assert.equal(isTaskDueToday({ completed: false, dueDate: '2026-11-25' }, today), false);
});

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Prepare board deck',
    description: 'Finalize Q4 metrics',
    priority: 'medium',
    dueDate: '2026-11-24',
    completed: false,
    createdAt: 1000,
    tags: ['work'],
    subtasks: [{ id: 's1', title: 'Export revenue sheet', completed: false }],
    recurrence: 'monthly',
    order: 10,
  },
  {
    id: '2',
    title: 'Submit tax invoice',
    description: 'Send PDF to accounting',
    priority: 'high',
    dueDate: '2026-11-20',
    completed: false,
    createdAt: 2000,
    tags: ['finance', 'work'],
    subtasks: [],
    recurrence: 'none',
    order: 20,
  },
  {
    id: '3',
    title: 'Water plants',
    description: 'Balcony and office',
    priority: 'low',
    dueDate: null,
    completed: true,
    createdAt: 3000,
    tags: ['home'],
    subtasks: [],
    recurrence: 'daily',
    order: 30,
  },
];

test('filterTasks handles all/active/today/overdue/completed, tag filter, and search', () => {
  const today = '2026-11-24';
  assert.equal(filterTasks(sampleTasks, 'all', '', null, today).length, 3);
  assert.deepEqual(
    filterTasks(sampleTasks, 'today', '', null, today).map((t) => t.id),
    ['1']
  );
  assert.deepEqual(
    filterTasks(sampleTasks, 'overdue', '', null, today).map((t) => t.id),
    ['2']
  );
  assert.deepEqual(
    filterTasks(sampleTasks, 'all', '', 'finance', today).map((t) => t.id),
    ['2']
  );
  assert.deepEqual(
    filterTasks(sampleTasks, 'all', 'revenue sheet', null, today).map((t) => t.id),
    ['1']
  );
  assert.deepEqual(collectAllTags(sampleTasks), ['finance', 'home', 'work']);
});

test('sortTasks sorts by createdAt, dueDate, priority, and custom order', () => {
  assert.deepEqual(
    sortTasks(sampleTasks, 'createdAt').map((t) => t.id),
    ['3', '2', '1']
  );
  assert.deepEqual(
    sortTasks(sampleTasks, 'dueDate').map((t) => t.id),
    ['2', '1', '3']
  );
  assert.deepEqual(
    sortTasks(sampleTasks, 'priority').map((t) => t.id),
    ['2', '1', '3']
  );
  assert.deepEqual(
    sortTasks(sampleTasks, 'custom').map((t) => t.id),
    ['3', '2', '1']
  );
});

test('reorderTasksInCustomOrder moves task to target position cleanly', () => {
  const reordered = reorderTasksInCustomOrder(sampleTasks, '1', '3');
  assert.deepEqual(
    sortTasks(reordered, 'custom').map((t) => t.id),
    ['1', '3', '2']
  );
});

test('recurrence calculates next dates (including month-end clamping) and resets subtasks', () => {
  assert.equal(getNextRecurrenceDate('2026-11-24', 'daily'), '2026-11-25');
  assert.equal(getNextRecurrenceDate('2026-11-24', 'weekly'), '2026-12-01');
  assert.equal(getNextRecurrenceDate('2026-01-31', 'monthly'), '2026-02-28');

  const completedParent: Task = {
    ...sampleTasks[0],
    subtasks: [{ id: 's1', title: 'Export revenue sheet', completed: true }],
  };
  const next = createNextRecurringTask(completedParent, 9999, '2026-11-24', 'next-id');
  assert.ok(next);
  assert.equal(next.id, 'next-id');
  assert.equal(next.dueDate, '2026-12-24');
  assert.equal(next.completed, false);
  assert.equal(next.subtasks[0].completed, false);
});

test('JSON and CSV export/import round-trip safely', () => {
  const json = serializeTasksToJson(sampleTasks, [sampleTasks[2]]);
  const parsed = parseImportedTasksJson(json);
  assert.equal(parsed.valid, true);
  if (parsed.valid) {
    assert.equal(parsed.tasks.length, 3);
    assert.equal(parsed.archivedTasks.length, 1);
  }

  const bad = parseImportedTasksJson('{bad json');
  assert.equal(bad.valid, false);

  const csv = serializeTasksToCsv(sampleTasks);
  assert.ok(csv.includes('Title,Description,Priority'));
  assert.ok(csv.includes('Prepare board deck'));
});

test('formatTimerSeconds formats mm:ss', () => {
  assert.equal(formatTimerSeconds(1500), '25:00');
  assert.equal(formatTimerSeconds(65), '01:05');
  assert.equal(formatTimerSeconds(0), '00:00');
});

test('countActiveTasks returns number of incomplete tasks', () => {
  assert.equal(countActiveTasks(sampleTasks), 2);
});
