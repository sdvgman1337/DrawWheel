import { ReferenceItem, SourceFilter, DeckNavigationState } from '../types/index.ts';

/**
 * Fisher-Yates array shuffle.
 */
export function shuffleArray<T>(array: T[], randomFn = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Filters items by source ('all', 'folder', 'upload').
 */
export function filterReferences(items: ReferenceItem[], filter: SourceFilter): ReferenceItem[] {
  if (filter === 'all') return items;
  return items.filter(item => item.source === filter);
}

/**
 * Initializes a new deck state.
 */
export function initDeckState(items: ReferenceItem[], initialId?: string, randomFn = Math.random): {
  state: DeckNavigationState;
  activeItem: ReferenceItem | null;
} {
  if (items.length === 0) {
    return {
      state: { history: [], historyIndex: -1, unseenQueue: [] },
      activeItem: null,
    };
  }

  const allIds = items.map(it => it.id);
  const shuffled = shuffleArray(allIds, randomFn);

  const startId = initialId && items.some(it => it.id === initialId) ? initialId : shuffled[0];
  const remaining = shuffled.filter(id => id !== startId);

  const activeItem = items.find(it => it.id === startId) || items[0];

  return {
    state: {
      history: [startId],
      historyIndex: 0,
      unseenQueue: remaining,
    },
    activeItem,
  };
}

/**
 * Advances to the next item:
 * - If user navigated back into history, moving forward traverses forward in history.
 * - If at the end of history, picks from unseenQueue (or reshuffles when depleted) to show a new random item without immediate duplicate.
 */
export function stepNext(
  items: ReferenceItem[],
  state: DeckNavigationState,
  randomFn = Math.random
): {
  state: DeckNavigationState;
  activeItem: ReferenceItem | null;
} {
  if (items.length === 0) {
    return {
      state: { history: [], historyIndex: -1, unseenQueue: [] },
      activeItem: null,
    };
  }

  if (items.length === 1) {
    return {
      state: { history: [items[0].id], historyIndex: 0, unseenQueue: [] },
      activeItem: items[0],
    };
  }

  // If user previously went back into history, go forward along history
  if (state.historyIndex < state.history.length - 1) {
    const nextIndex = state.historyIndex + 1;
    const nextId = state.history[nextIndex];
    const found = items.find(it => it.id === nextId);
    if (found) {
      return {
        state: { ...state, historyIndex: nextIndex },
        activeItem: found,
      };
    }
  }

  // Otherwise, draw from unseenQueue or regenerate queue
  const currentId = state.history[state.historyIndex];
  let queue = [...state.unseenQueue];

  // Filter out any IDs that no longer exist in current items
  const validIds = new Set(items.map(it => it.id));
  queue = queue.filter(id => validIds.has(id));

  // If queue is empty, repopulate with all items except current to avoid immediate repeat
  if (queue.length === 0) {
    const pool = items.filter(it => it.id !== currentId).map(it => it.id);
    queue = shuffleArray(pool.length > 0 ? pool : [items[0].id], randomFn);
  }

  const nextId = queue.shift()!;
  const nextItem = items.find(it => it.id === nextId) || items[0];

  const newHistory = [...state.history.slice(0, state.historyIndex + 1), nextId];

  return {
    state: {
      history: newHistory,
      historyIndex: newHistory.length - 1,
      unseenQueue: queue,
    },
    activeItem: nextItem,
  };
}

/**
 * Goes back to previous item in history.
 */
export function stepPrevious(
  items: ReferenceItem[],
  state: DeckNavigationState
): {
  state: DeckNavigationState;
  activeItem: ReferenceItem | null;
} {
  if (items.length === 0 || state.historyIndex <= 0) {
    const currentItem = items.find(it => it.id === state.history[state.historyIndex]) || (items[0] ?? null);
    return { state, activeItem: currentItem };
  }

  const prevIndex = state.historyIndex - 1;
  const prevId = state.history[prevIndex];
  const prevItem = items.find(it => it.id === prevId) || items[0];

  return {
    state: { ...state, historyIndex: prevIndex },
    activeItem: prevItem,
  };
}

/**
 * Jumps directly to a specific item by ID.
 */
export function jumpToItem(
  items: ReferenceItem[],
  state: DeckNavigationState,
  targetId: string
): {
  state: DeckNavigationState;
  activeItem: ReferenceItem | null;
} {
  const item = items.find(it => it.id === targetId);
  if (!item) {
    return { state, activeItem: null };
  }

  const newHistory = [...state.history.slice(0, state.historyIndex + 1), targetId];
  const newQueue = state.unseenQueue.filter(id => id !== targetId);

  return {
    state: {
      history: newHistory,
      historyIndex: newHistory.length - 1,
      unseenQueue: newQueue,
    },
    activeItem: item,
  };
}
