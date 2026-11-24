import React from 'react';
import { Archive, CheckSquare, Search, Trash2, X } from 'lucide-react';
import { FilterStatus, Priority, SortOption } from '../types/task';

interface FilterBarProps {
  filter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  activeCount: number;
  completedCount: number;
  archiveCount: number;
  onClearCompleted: () => void;
  onArchiveCompleted: () => void;
  onEmptyArchive: () => void;
  selectionMode: boolean;
  selectedCount: number;
  visibleCount: number;
  onToggleSelectionMode: () => void;
  onSelectAllVisible: () => void;
  onBulkComplete: () => void;
  onBulkPriority: (priority: Priority) => void;
  onBulkDelete: () => void;
}

export function FilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  availableTags,
  selectedTag,
  onSelectTag,
  activeCount,
  completedCount,
  archiveCount,
  onClearCompleted,
  onArchiveCompleted,
  onEmptyArchive,
  selectionMode,
  selectedCount,
  visibleCount,
  onToggleSelectionMode,
  onSelectAllVisible,
  onBulkComplete,
  onBulkPriority,
  onBulkDelete,
}: FilterBarProps) {
  const remainingLabel = activeCount === 1 ? '1 task left' : `${activeCount} tasks left`;
  const isArchiveView = filter === 'archive';

  const tabs: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'today', label: 'Today' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' },
    { value: 'archive', label: archiveCount > 0 ? `Archive (${archiveCount})` : 'Archive' },
  ];

  return (
    <div className="px-5 py-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="task-search" className="sr-only">
            Search tasks
          </label>
          <Search
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="task-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks, tags, or subtasks..."
            className="w-full min-h-[40px] pl-9 pr-9 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label
            htmlFor="task-sort"
            className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            Sort by
          </label>
          <select
            id="task-sort"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="min-h-[40px] px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 cursor-pointer"
          >
            <option value="createdAt">Created date</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
            <option value="custom">Custom order</option>
          </select>

          {!isArchiveView && (
            <button
              type="button"
              onClick={onToggleSelectionMode}
              aria-pressed={selectionMode}
              className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                selectionMode
                  ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Select</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div
          role="tablist"
          aria-label="Filter tasks"
          className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800"
        >
          {tabs.map((tab) => {
            const isSelected = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onFilterChange(tab.value)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 ${
                  isSelected
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span
            data-testid="active-task-counter"
            className="font-mono tabular-nums font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            {remainingLabel}
          </span>

          {isArchiveView ? (
            <button
              type="button"
              onClick={onEmptyArchive}
              disabled={archiveCount === 0}
              className={`font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded px-2 py-1 ${
                archiveCount > 0
                  ? 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              Empty archive
            </button>
          ) : (
            <>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={onArchiveCompleted}
                  className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded px-2 py-1"
                >
                  <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Archive completed</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClearCompleted}
                disabled={completedCount === 0}
                className={`font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 dark:focus-visible:ring-indigo-400 rounded px-2 py-1 ${
                  completedCount > 0
                    ? 'text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer'
                    : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                Clear completed
              </button>
            </>
          )}
        </div>
      </div>

      {!isArchiveView && availableTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mr-1">
            Tags:
          </span>
          <button
            type="button"
            onClick={() => onSelectTag(null)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              selectedTag === null
                ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All tags
          </button>
          {availableTags.map((tag) => {
            const active = selectedTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag(active ? null : tag)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                  active
                    ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500'
                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {selectionMode && !isArchiveView && (
        <div
          role="region"
          aria-label="Bulk actions"
          className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
              {selectedCount} selected
            </span>
            <button
              type="button"
              onClick={onSelectAllVisible}
              disabled={visibleCount === 0}
              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            >
              Select all ({visibleCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={onBulkComplete}
              disabled={selectedCount === 0}
              className="px-2.5 py-1 rounded font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
            >
              Complete
            </button>
            <button
              type="button"
              onClick={() => onBulkPriority('high')}
              disabled={selectedCount === 0}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              Set High
            </button>
            <button
              type="button"
              onClick={() => onBulkPriority('medium')}
              disabled={selectedCount === 0}
              className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              Set Medium
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              disabled={selectedCount === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
