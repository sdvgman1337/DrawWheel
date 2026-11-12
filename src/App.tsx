/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ReferenceItem,
  SourceFilter,
  ViewSettings,
  DeckNavigationState,
  SketchSettings,
  SketchStroke,
} from './types/index.ts';
import {
  filterReferences,
  initDeckState,
  stepNext,
  stepPrevious,
  jumpToItem,
  getNextGridType,
  getNextContrastMode,
  buildReferenceFilterCss,
} from './utils/deck.ts';
import {
  SketchHistoryState,
  createInitialSketchHistory,
  pushStroke,
  undoStroke,
  redoStroke,
  clearStrokes,
  renderStrokesToContext,
} from './utils/sketch.ts';
import {
  getStoredUploadedReferences,
  saveUploadedReferencesToDB,
  deleteUploadedReferenceFromDB,
} from './utils/storage.ts';
import { Header } from './components/Header.tsx';
import { ReferenceViewer } from './components/ReferenceViewer.tsx';
import { ArtistControls } from './components/ArtistControls.tsx';
import { SketchToolbar } from './components/SketchToolbar.tsx';
import { BatchUploadModal } from './components/BatchUploadModal.tsx';
import { GalleryDrawer } from './components/GalleryDrawer.tsx';
import { Check } from 'lucide-react';

// Fallback seed references from public/references for static hosting or offline mode
const DEFAULT_FOLDER_ITEMS: ReferenceItem[] = [
  {
    id: 'folder-01_sculpture_chiaroscuro.jpg',
    name: 'Скульптурный свет и светотень (Бюст)',
    url: './references/01_sculpture_chiaroscuro.jpg',
    source: 'folder',
    filename: '01_sculpture_chiaroscuro.jpg',
  },
  {
    id: 'folder-02_figure_dancer_study.jpg',
    name: 'Анатомический этюд: Танцор в прыжке',
    url: './references/02_figure_dancer_study.jpg',
    source: 'folder',
    filename: '02_figure_dancer_study.jpg',
  },
  {
    id: 'folder-03_drapery_still_life.jpg',
    name: 'Академический натюрморт: Складки ткани',
    url: './references/03_drapery_still_life.jpg',
    source: 'folder',
    filename: '03_drapery_still_life.jpg',
  },
  {
    id: 'folder-04_architecture_light_study.jpg',
    name: 'Архитектурная геометрия и ритм теней',
    url: './references/04_architecture_light_study.jpg',
    source: 'folder',
    filename: '04_architecture_light_study.jpg',
  },
];

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  isGrayscale: false,
  isFlipped: false,
  gridType: 'none',
  contrastMode: 'normal',
  isBlurred: false,
  zoom: 1,
  rotation: 0,
};

const DEFAULT_SKETCH_SETTINGS: SketchSettings = {
  isDrawingMode: false,
  isOverlayVisible: true,
  tool: 'pen',
  color: '#1C1917',
  strokeWidth: 4,
  opacity: 0.9,
  exportWithBackground: false,
};

export default function App() {
  const [folderItems, setFolderItems] = useState<ReferenceItem[]>(DEFAULT_FOLDER_ITEMS);
  const [uploadedItems, setUploadedItems] = useState<ReferenceItem[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('atelier_dark_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [exportToast, setExportToast] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);

  // Sync dark mode class on <html> and persist preference
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('atelier_dark_mode', String(isDarkMode));
    } catch {
      // Ignore storage errors
    }
  }, [isDarkMode]);

  const handleToggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Deck state
  const [deckState, setDeckState] = useState<DeckNavigationState>({
    history: [],
    historyIndex: -1,
    unseenQueue: [],
  });
  const [activeItem, setActiveItem] = useState<ReferenceItem | null>(null);

  // Artist view settings
  const [viewSettings, setViewSettings] = useState<ViewSettings>(DEFAULT_VIEW_SETTINGS);

  // Sketch overlay settings & per-reference stroke history map
  const [sketchSettings, setSketchSettings] = useState<SketchSettings>(DEFAULT_SKETCH_SETTINGS);
  const [sketchMap, setSketchMap] = useState<Record<string, SketchHistoryState>>({});

  const currentSketchHistory: SketchHistoryState = useMemo(() => {
    if (!activeItem) return createInitialSketchHistory();
    return sketchMap[activeItem.id] || createInitialSketchHistory();
  }, [activeItem, sketchMap]);

  const updateCurrentSketchHistory = useCallback(
    (updater: (prev: SketchHistoryState) => SketchHistoryState) => {
      if (!activeItem) return;
      setSketchMap(prev => {
        const current = prev[activeItem.id] || createInitialSketchHistory();
        return {
          ...prev,
          [activeItem.id]: updater(current),
        };
      });
    },
    [activeItem]
  );

  // Filtered list based on current active filter
  const currentPool = useMemo(() => {
    const combined = [...folderItems, ...uploadedItems];
    return filterReferences(combined, sourceFilter);
  }, [folderItems, uploadedItems, sourceFilter]);

  // Load folder items from dynamic API (if Node server is active) or static manifest.json (on static hostings)
  const loadFolderReferences = useCallback(async () => {
    setIsRefreshing(true);
    try {
      try {
        const res = await fetch('./api/references');
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && Array.isArray(data.items) && data.items.length > 0) {
              setFolderItems(data.items);
              return;
            }
          }
        }
      } catch {
        // Static hosting without /api/references, fallback to manifest.json
      }

      const manifestRes = await fetch('./references/manifest.json');
      if (manifestRes.ok) {
        const manifestData = await manifestRes.json();
        if (Array.isArray(manifestData.items) && manifestData.items.length > 0) {
          setFolderItems(
            manifestData.items.map((item: ReferenceItem) => ({
              ...item,
              url: item.url.startsWith('/') ? `.${item.url}` : item.url,
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Using built-in references list:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load uploaded items from browser's IndexedDB
  useEffect(() => {
    loadFolderReferences();
    getStoredUploadedReferences().then(items => {
      if (items && items.length > 0) {
        setUploadedItems(items);
      }
    });
  }, [loadFolderReferences]);

  // Initialize or re-sync deck when pool changes or on first load
  useEffect(() => {
    if (currentPool.length === 0) {
      setActiveItem(null);
      setDeckState({ history: [], historyIndex: -1, unseenQueue: [] });
      return;
    }

    if (!activeItem || !currentPool.some(item => item.id === activeItem.id)) {
      const { state, activeItem: firstItem } = initDeckState(currentPool);
      setDeckState(state);
      setActiveItem(firstItem);
    }
  }, [currentPool, activeItem]);

  // Navigation: Next random reference
  const handleNext = useCallback(() => {
    if (currentPool.length === 0) return;
    const { state: nextState, activeItem: nextItem } = stepNext(currentPool, deckState);
    setDeckState(nextState);
    setActiveItem(nextItem);
  }, [currentPool, deckState]);

  // Navigation: Previous reference in history
  const handlePrevious = useCallback(() => {
    if (currentPool.length === 0) return;
    const { state: prevState, activeItem: prevItem } = stepPrevious(currentPool, deckState);
    setDeckState(prevState);
    setActiveItem(prevItem);
  }, [currentPool, deckState]);

  // Jump to specific item from Gallery
  const handleSelectItem = useCallback(
    (id: string) => {
      const { state: jumpState, activeItem: item } = jumpToItem(currentPool, deckState, id);
      setDeckState(jumpState);
      setActiveItem(item);
    },
    [currentPool, deckState]
  );

  // Sketch handlers
  const handleCommitStroke = useCallback(
    (stroke: SketchStroke) => {
      updateCurrentSketchHistory(prev => pushStroke(prev, stroke));
    },
    [updateCurrentSketchHistory]
  );

  const handleUndoSketch = useCallback(() => {
    updateCurrentSketchHistory(prev => undoStroke(prev));
  }, [updateCurrentSketchHistory]);

  const handleRedoSketch = useCallback(() => {
    updateCurrentSketchHistory(prev => redoStroke(prev));
  }, [updateCurrentSketchHistory]);

  const handleClearSketch = useCallback(() => {
    updateCurrentSketchHistory(prev => clearStrokes(prev));
  }, [updateCurrentSketchHistory]);

  const handleToggleDrawingMode = useCallback(() => {
    setSketchSettings(prev => ({
      ...prev,
      isDrawingMode: !prev.isDrawingMode,
      isOverlayVisible: true,
    }));
  }, []);

  // Download current state of the drawing canvas as a PNG file
  const handleDownloadSketchPng = useCallback(() => {
    if (!activeItem) return;

    const imgEl = imageRef.current;
    const naturalWidth = imgEl?.naturalWidth || imgEl?.clientWidth || 1200;
    const naturalHeight = imgEl?.naturalHeight || imgEl?.clientHeight || 900;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = naturalWidth;
    exportCanvas.height = naturalHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Optional: composite reference image underneath if requested
    if (sketchSettings.exportWithBackground && imgEl) {
      ctx.save();
      const filterStr = buildReferenceFilterCss(viewSettings);
      if (filterStr) {
        ctx.filter = filterStr;
      }
      if (viewSettings.isFlipped) {
        ctx.translate(naturalWidth, 0);
        ctx.scale(-1, 1);
      }
      try {
        ctx.drawImage(imgEl, 0, 0, naturalWidth, naturalHeight);
      } catch (e) {
        console.warn('Could not draw background image to export canvas:', e);
      }
      ctx.restore();
    }

    // Draw sketch strokes on a separate layer so eraser ('destination-out') only erases strokes, not background photo
    const strokeLayer = document.createElement('canvas');
    strokeLayer.width = naturalWidth;
    strokeLayer.height = naturalHeight;
    const strokeCtx = strokeLayer.getContext('2d');
    if (strokeCtx) {
      if (viewSettings.isFlipped) {
        strokeCtx.translate(naturalWidth, 0);
        strokeCtx.scale(-1, 1);
      }
      renderStrokesToContext(
        strokeCtx,
        currentSketchHistory.present,
        naturalWidth,
        naturalHeight,
        sketchSettings.opacity
      );
      ctx.drawImage(strokeLayer, 0, 0);
    }

    const safeBaseName = (activeItem.filename || activeItem.name || 'study')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_')
      .toLowerCase();
    const downloadFilename = `atelier-sketch-${safeBaseName}.png`;

    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = downloadFilename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportToast(`Сохранён PNG: ${downloadFilename}`);
    setTimeout(() => {
      setExportToast(prev => (prev === `Сохранён PNG: ${downloadFilename}` ? null : prev));
    }, 3200);
  }, [
    activeItem,
    currentSketchHistory.present,
    sketchSettings.exportWithBackground,
    sketchSettings.opacity,
    viewSettings,
  ]);

  // Batch upload handler
  const handleAddReferences = async (newItems: ReferenceItem[]) => {
    const updated = [...newItems, ...uploadedItems];
    setUploadedItems(updated);
    await saveUploadedReferencesToDB(newItems);

    if (sourceFilter === 'folder') {
      setSourceFilter('all');
    }

    loadFolderReferences();
  };

  // Delete uploaded item
  const handleDeleteUploadedItem = async (id: string) => {
    const updated = uploadedItems.filter(item => item.id !== id);
    setUploadedItems(updated);
    await deleteUploadedReferenceFromDB(id);
    if (activeItem?.id === id) {
      handleNext();
    }
  };

  // Reset view settings
  const handleResetView = useCallback(() => {
    setViewSettings(DEFAULT_VIEW_SETTINGS);
  }, []);

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+Z / Cmd+Z for Sketch Undo & Redo
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoSketch();
        } else {
          handleUndoSketch();
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyY') {
        e.preventDefault();
        handleRedoSketch();
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        handleToggleDrawingMode();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        setViewSettings(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setViewSettings(prev => ({ ...prev, isGrayscale: !prev.isGrayscale }));
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setViewSettings(prev => ({ ...prev, isBlurred: !prev.isBlurred }));
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setViewSettings(prev => ({
          ...prev,
          contrastMode: getNextContrastMode(prev.contrastMode),
        }));
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        setViewSettings(prev => ({
          ...prev,
          gridType: getNextGridType(prev.gridType),
        }));
      } else if (e.code === 'KeyU') {
        e.preventDefault();
        setIsUploadModalOpen(prev => !prev);
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setIsGalleryOpen(prev => !prev);
      } else if (e.code === 'Escape') {
        if (isUploadModalOpen) {
          setIsUploadModalOpen(false);
        } else if (isGalleryOpen) {
          setIsGalleryOpen(false);
        } else if (sketchSettings.isDrawingMode) {
          setSketchSettings(prev => ({ ...prev, isDrawingMode: false }));
        } else {
          handleResetView();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNext,
    handlePrevious,
    handleResetView,
    handleToggleDrawingMode,
    handleUndoSketch,
    handleRedoSketch,
    isUploadModalOpen,
    isGalleryOpen,
    sketchSettings.isDrawingMode,
  ]);

  const currentIndex = activeItem
    ? currentPool.findIndex(item => item.id === activeItem.id)
    : -1;

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAF9F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-stone-200 dark:selection:bg-stone-800 transition-colors duration-200">
      {/* Minimalist Top Header */}
      <Header
        totalCount={folderItems.length + uploadedItems.length}
        folderCount={folderItems.length}
        uploadCount={uploadedItems.length}
        sourceFilter={sourceFilter}
        onFilterChange={setSourceFilter}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onToggleGallery={() => setIsGalleryOpen(prev => !prev)}
        isGalleryOpen={isGalleryOpen}
        onRefreshFolder={loadFolderReferences}
        isRefreshing={isRefreshing}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Floating Sketch Toolbar when transparent drawing canvas mode is active */}
      <SketchToolbar
        sketchSettings={sketchSettings}
        canUndo={currentSketchHistory.past.length > 0}
        canRedo={currentSketchHistory.future.length > 0}
        hasStrokes={currentSketchHistory.present.length > 0}
        onUpdateSettings={setSketchSettings}
        onUndo={handleUndoSketch}
        onRedo={handleRedoSketch}
        onClear={handleClearSketch}
        onDownloadPng={handleDownloadSketchPng}
        onCloseDrawingMode={() =>
          setSketchSettings(prev => ({ ...prev, isDrawingMode: false }))
        }
      />

      {/* Export confirmation toast */}
      {exportToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-28 inset-x-0 z-50 pointer-events-none flex justify-center px-4 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="bg-stone-900/95 backdrop-blur-xs text-white text-xs font-medium px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-stone-300 shrink-0" />
            <span className="truncate max-w-xs sm:max-w-md">{exportToast}</span>
          </div>
        </div>
      )}

      {/* Museum-Grade Reference Canvas + Transparent Drawing Overlay */}
      <ReferenceViewer
        activeItem={activeItem}
        viewSettings={viewSettings}
        sketchSettings={sketchSettings}
        strokes={currentSketchHistory.present}
        onCommitStroke={handleCommitStroke}
        onNext={handleNext}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        imageRef={imageRef}
      />

      {/* Floating Artist Dock Controls */}
      <ArtistControls
        activeItem={activeItem}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        totalCount={currentPool.length}
        canGoBack={deckState.historyIndex > 0}
        canGoForward={deckState.historyIndex < deckState.history.length - 1}
        viewSettings={viewSettings}
        isDrawingMode={sketchSettings.isDrawingMode}
        hasStrokes={currentSketchHistory.present.length > 0}
        onToggleDrawingMode={handleToggleDrawingMode}
        onDownloadPng={handleDownloadSketchPng}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onUpdateViewSettings={setViewSettings}
        onResetView={handleResetView}
      />

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onAddReferences={handleAddReferences}
      />

      {/* Gallery Drawer */}
      <GalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        items={currentPool}
        activeId={activeItem?.id || null}
        onSelectItem={handleSelectItem}
        onDeleteItem={handleDeleteUploadedItem}
      />
    </div>
  );
}
