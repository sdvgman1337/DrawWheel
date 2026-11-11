import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffleArray,
  filterReferences,
  initDeckState,
  stepNext,
  stepPrevious,
  jumpToItem,
} from './deck.ts';
import { ReferenceItem } from '../types/index.ts';

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
