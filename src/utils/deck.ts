import {
  ReferenceItem,
  SourceFilter,
  DeckNavigationState,
  GridType,
  ContrastMode,
  ViewSettings,
} from '../types/index.ts';

export const GRID_OPTIONS: { id: GridType; label: string; shortLabel: string; description: string }[] = [
  { id: 'none', label: 'Без сетки', shortLabel: 'Выкл', description: 'Чистый холст без направляющих' },
  { id: 'rule-of-thirds', label: 'Правило третей (3×3)', shortLabel: '3×3', description: 'Классические фокусные точки композиции' },
  { id: 'golden-ratio', label: 'Золотое сечение (Phi)', shortLabel: 'Phi', description: 'Гармоническая пропорция 1 : 1.618' },
  { id: 'grid-4x4', label: 'Квадратная сетка 4×4', shortLabel: '4×4', description: 'Равномерное деление на 16 секций' },
  { id: 'grid-8x8', label: 'Академическая сетка 8×8', shortLabel: '8×8', description: 'Мелкая сетка для точного переноса пропорций' },
  { id: 'diagonals', label: 'Диагонали и центр', shortLabel: 'Диаг', description: 'Большие диагонали и центральные оси' },
  { id: 'harmonic-armature', label: 'Гармоническая арматура', shortLabel: 'Арматура', description: 'Каноническая сетка старых мастеров с ромбом' },
  { id: 'perspective-cross', label: 'Фокусные круги и оси', shortLabel: 'Прицел', description: 'Перекрестие и концентрические круги тонального центра' },
];

export const CONTRAST_OPTIONS: { id: ContrastMode; label: string; shortLabel: string; description: string }[] = [
  { id: 'normal', label: 'Обычный контраст', shortLabel: '100%', description: 'Оригинальная светотень фотографии' },
  { id: 'medium', label: 'Усиленная светотень', shortLabel: 'Светотень +', description: 'Четкое отделение полутонов и собственных теней' },
  { id: 'high', label: 'Глубокий кьяроскуро', shortLabel: 'Кьяроскуро', description: 'Высокий контраст для анализа границы света и тени (терминатора)' },
  { id: 'notan', label: 'Нотан (Свет / Тень)', shortLabel: 'Нотан', description: 'Предельный контраст для обобщения пятен света и тени' },
];

export function getNextGridType(current: GridType): GridType {
  const idx = GRID_OPTIONS.findIndex(g => g.id === current);
  if (idx === -1) return 'rule-of-thirds';
  return GRID_OPTIONS[(idx + 1) % GRID_OPTIONS.length].id;
}

export function getNextContrastMode(current: ContrastMode): ContrastMode {
  const idx = CONTRAST_OPTIONS.findIndex(c => c.id === current);
  if (idx === -1) return 'medium';
  return CONTRAST_OPTIONS[(idx + 1) % CONTRAST_OPTIONS.length].id;
}

export function buildReferenceFilterCss(viewSettings: Pick<ViewSettings, 'isGrayscale' | 'isBlurred' | 'contrastMode'>): string {
  const parts: string[] = [];

  if (viewSettings.isGrayscale || viewSettings.contrastMode === 'notan') {
    parts.push('grayscale(100%)');
  }

  if (viewSettings.contrastMode === 'medium') {
    parts.push('contrast(145%) brightness(102%)');
  } else if (viewSettings.contrastMode === 'high') {
    parts.push('contrast(215%) brightness(104%)');
  } else if (viewSettings.contrastMode === 'notan') {
    parts.push('contrast(420%) brightness(106%)');
  }

  if (viewSettings.isBlurred) {
    parts.push('blur(6px)');
  }

  return parts.join(' ');
}

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

