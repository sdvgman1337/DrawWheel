import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffleArray,
  filterReferences,
  initDeckState,
  stepNext,
  stepPrevious,
  jumpToItem,
  getNextGridType,
  getNextContrastMode,
  buildReferenceFilterCss,
} from './deck.ts';
import {
  createInitialSketchHistory,
  pushStroke,
  undoStroke,
  redoStroke,
  clearStrokes,
} from './sketch.ts';
import { ReferenceItem, SketchStroke } from '../types/index.ts';

const mockItems: ReferenceItem[] = [
  { id: '1', name: 'Pose A', url: '/ref1.jpg', source: 'folder' },
  { id: '2', name: 'Pose B', url: '/ref2.jpg', source: 'folder' },
  { id: '3', name: 'Pose C', url: '/ref3.jpg', source: 'upload' },
  { id: '4', name: 'Pose D', url: '/ref4.jpg', source: 'upload' },
];

test('shuffleArray preserves length and items', () => {
  const original = [1, 2, 3, 4, 5];
  const shuffled = shuffleArray(original);
  assert.equal(shuffled.length, original.length);
  assert.deepEqual(new Set(shuffled), new Set(original));
});

test('filterReferences properly filters by source', () => {
  assert.equal(filterReferences(mockItems, 'all').length, 4);
  assert.equal(filterReferences(mockItems, 'folder').length, 2);
  assert.equal(filterReferences(mockItems, 'upload').length, 2);
});

test('initDeckState sets start item and queue properly', () => {
  const { state, activeItem } = initDeckState(mockItems, '1');
  assert.equal(activeItem?.id, '1');
  assert.equal(state.history.length, 1);
  assert.equal(state.history[0], '1');
  assert.equal(state.unseenQueue.length, 3);
  assert.ok(!state.unseenQueue.includes('1'));
});

test('stepNext advances randomly without immediate duplicate and tracks history', () => {
  let { state, activeItem } = initDeckState(mockItems, '1');
  assert.equal(activeItem?.id, '1');

  const firstNext = stepNext(mockItems, state);
  assert.notEqual(firstNext.activeItem?.id, '1', 'Should not immediately repeat current item');
  assert.equal(firstNext.state.history.length, 2);
  assert.equal(firstNext.state.historyIndex, 1);

  // Go back
  const prev = stepPrevious(mockItems, firstNext.state);
  assert.equal(prev.activeItem?.id, '1', 'Should return to first item when going back');
  assert.equal(prev.state.historyIndex, 0);

  // Advance again should traverse existing history forward
  const forward = stepNext(mockItems, prev.state);
  assert.equal(forward.activeItem?.id, firstNext.activeItem?.id, 'Should step forward to already visited next item');
});

test('jumpToItem navigates directly and trims future history', () => {
  const { state } = initDeckState(mockItems, '1');
  const jumpResult = jumpToItem(mockItems, state, '3');
  assert.equal(jumpResult.activeItem?.id, '3');
  assert.equal(jumpResult.state.history[jumpResult.state.historyIndex], '3');
});

test('sketch history supports pushStroke, undoStroke, redoStroke, and clearStrokes', () => {
  let history = createInitialSketchHistory();
  assert.equal(history.present.length, 0);

  const stroke1: SketchStroke = {
    id: 's1',
    tool: 'pen',
    color: '#1C1917',
    size: 4,
    opacity: 0.9,
    points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }],
  };

  const stroke2: SketchStroke = {
    id: 's2',
    tool: 'pen',
    color: '#9A3412',
    size: 6,
    opacity: 0.85,
    points: [{ x: 0.2, y: 0.3 }, { x: 0.6, y: 0.7 }],
  };

  history = pushStroke(history, stroke1);
  assert.equal(history.present.length, 1);

  history = pushStroke(history, stroke2);
  assert.equal(history.present.length, 2);

  history = undoStroke(history);
  assert.equal(history.present.length, 1);
  assert.equal(history.present[0].id, 's1');

  history = redoStroke(history);
  assert.equal(history.present.length, 2);
  assert.equal(history.present[1].id, 's2');

  history = clearStrokes(history);
  assert.equal(history.present.length, 0);

  // Undo after clear restores strokes
  history = undoStroke(history);
  assert.equal(history.present.length, 2);
});

test('getNextGridType and getNextContrastMode cycle through all options', () => {
  assert.equal(getNextGridType('none'), 'rule-of-thirds');
  assert.equal(getNextGridType('grid-4x4'), 'grid-8x8');
  assert.equal(getNextGridType('perspective-cross'), 'none');

  assert.equal(getNextContrastMode('normal'), 'medium');
  assert.equal(getNextContrastMode('medium'), 'high');
  assert.equal(getNextContrastMode('high'), 'notan');
  assert.equal(getNextContrastMode('notan'), 'normal');
});

test('buildReferenceFilterCss computes accurate chiaroscuro and notan CSS filters', () => {
  assert.equal(
    buildReferenceFilterCss({ isGrayscale: false, isBlurred: false, contrastMode: 'normal' }),
    ''
  );
  assert.equal(
    buildReferenceFilterCss({ isGrayscale: false, isBlurred: false, contrastMode: 'high' }),
    'contrast(215%) brightness(104%)'
  );
  assert.equal(
    buildReferenceFilterCss({ isGrayscale: false, isBlurred: false, contrastMode: 'notan' }),
    'grayscale(100%) contrast(420%) brightness(106%)'
  );
});

