export interface ReferenceItem {
  id: string;
  name: string;
  url: string;
  source: 'folder' | 'upload';
  filename?: string;
  sizeBytes?: number;
  addedAt?: number;
}

export type SourceFilter = 'all' | 'folder' | 'upload';

export interface ViewSettings {
  isGrayscale: boolean;
  isFlipped: boolean;
  gridType: 'none' | 'rule-of-thirds' | 'golden-ratio' | 'grid-4x4';
  isBlurred: boolean; // Squint/shape check
  zoom: number;
  rotation: number; // 0, 90, 180, 270
}

export interface DeckNavigationState {
  history: string[]; // sequence of visited item ids
  historyIndex: number; // current pointer in history
  unseenQueue: string[]; // shuffle bag to avoid early repeats
}
