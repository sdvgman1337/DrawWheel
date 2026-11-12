export interface ReferenceItem {
  id: string;
  name: string;
  url: string;
  source: 'folder' | 'upload';
  filename?: string;
  sizeBytes?: number;
  addedAt?: number;
  blob?: Blob;
}

export type SourceFilter = 'all' | 'folder' | 'upload';

export type GridType =
  | 'none'
  | 'rule-of-thirds'
  | 'golden-ratio'
  | 'grid-4x4'
  | 'grid-8x8'
  | 'diagonals'
  | 'harmonic-armature'
  | 'perspective-cross';

export type ContrastMode = 'normal' | 'medium' | 'high' | 'notan';

export interface ViewSettings {
  isGrayscale: boolean;
  isFlipped: boolean;
  gridType: GridType;
  contrastMode: ContrastMode;
  isBlurred: boolean; // Squint/shape check
  zoom: number;
  rotation: number; // 0, 90, 180, 270
}

export interface SketchPoint {
  x: number; // normalized 0..1 relative to canvas width
  y: number; // normalized 0..1 relative to canvas height
}

export interface SketchStroke {
  id: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  opacity: number;
  points: SketchPoint[];
}

export interface SketchSettings {
  isDrawingMode: boolean;
  isOverlayVisible: boolean;
  tool: 'pen' | 'eraser';
  color: string;
  strokeWidth: number;
  opacity: number;
  exportWithBackground: boolean;
}

export interface DeckNavigationState {
  history: string[]; // sequence of visited item ids
  historyIndex: number; // current pointer in history
  unseenQueue: string[]; // shuffle bag to avoid early repeats
}

