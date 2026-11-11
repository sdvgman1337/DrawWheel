/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReferenceItem, SourceFilter, ViewSettings, DeckNavigationState } from './types/index.ts';
import {
  filterReferences,
  initDeckState,
  stepNext,
  stepPrevious,
  jumpToItem,
} from './utils/deck.ts';
import {
  getStoredUploadedReferences,
  saveUploadedReferencesToDB,
  deleteUploadedReferenceFromDB,
} from './utils/storage.ts';
import { Header } from './components/Header.tsx';
import { ReferenceViewer } from './components/ReferenceViewer.tsx';
import { ArtistControls } from './components/ArtistControls.tsx';
import { BatchUploadModal } from './components/BatchUploadModal.tsx';
import { GalleryDrawer } from './components/GalleryDrawer.tsx';

// Fallback seed references from public/references in case network or API is offline
const DEFAULT_FOLDER_ITEMS: ReferenceItem[] = [
  {
    id: 'folder-01_sculpture_chiaroscuro.jpg',
    name: 'Скульптурный свет и светотень (Бюст)',
    url: '/references/01_sculpture_chiaroscuro.jpg',
    source: 'folder',
    filename: '01_sculpture_chiaroscuro.jpg',
  },
  {
    id: 'folder-02_figure_dancer_study.jpg',
    name: 'Анатомический этюд: Танцор в прыжке',
    url: '/references/02_figure_dancer_study.jpg',
    source: 'folder',
    filename: '02_figure_dancer_study.jpg',
  },
  {
    id: 'folder-03_drapery_still_life.jpg',
    name: 'Академический натюрморт: Складки ткани',
    url: '/references/03_drapery_still_life.jpg',
    source: 'folder',
    filename: '03_drapery_still_life.jpg',
  },
  {
    id: 'folder-04_architecture_light_study.jpg',
    name: 'Архитектурная геометрия и ритм теней',
    url: '/references/04_architecture_light_study.jpg',
    source: 'folder',
    filename: '04_architecture_light_study.jpg',
  },
];

const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  isGrayscale: false,
  isFlipped: false,
  gridType: 'none',
  isBlurred: false,
  zoom: 1,
  rotation: 0,
};

export default function App() {
  const [folderItems, setFolderItems] = useState<ReferenceItem[]>(DEFAULT_FOLDER_ITEMS);
  const [uploadedItems, setUploadedItems] = useState<ReferenceItem[]>([]);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Deck state
  const [deckState, setDeckState] = useState<DeckNavigationState>({
    history: [],
    historyIndex: -1,
    unseenQueue: [],
  });
  const [activeItem, setActiveItem] = useState<ReferenceItem | null>(null);

  // Artist view settings
  const [viewSettings, setViewSettings] = useState<ViewSettings>(DEFAULT_VIEW_SETTINGS);

  // Filtered list based on current active filter
  const currentPool = useMemo(() => {
    const combined = [...folderItems, ...uploadedItems];
    return filterReferences(combined, sourceFilter);
  }, [folderItems, uploadedItems, sourceFilter]);

  // Load folder items from API or fallback manifest
  const loadFolderReferences = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/references');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          setFolderItems(data.items);
          return;
        }
      }
      // Fallback to manifest.json
      const manifestRes = await fetch('/references/manifest.json');
      if (manifestRes.ok) {
        const manifestData = await manifestRes.json();
        if (Array.isArray(manifestData.items) && manifestData.items.length > 0) {
          setFolderItems(manifestData.items);
        }
      }
    } catch (err) {
      console.warn('Using default references due to fetch failure', err);
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

    // If no active item or active item is no longer in current pool, initialize
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

  // Batch upload handler
  const handleAddReferences = async (newItems: ReferenceItem[]) => {
    const updated = [...newItems, ...uploadedItems];
    setUploadedItems(updated);
    await saveUploadedReferencesToDB(newItems);

    // If currently filtered to folder and user uploaded, switch to 'all' or 'upload'
    if (sourceFilter === 'folder') {
      setSourceFilter('all');
    }

    // Refresh folder references in case user also saved to disk
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
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        setViewSettings(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setViewSettings(prev => ({ ...prev, isGrayscale: !prev.isGrayscale }));
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        setViewSettings(prev => ({ ...prev, isBlurred: !prev.isBlurred }));
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        setViewSettings(prev => {
          const nextGrid: ViewSettings['gridType'] =
            prev.gridType === 'none'
              ? 'rule-of-thirds'
              : prev.gridType === 'rule-of-thirds'
              ? 'golden-ratio'
              : prev.gridType === 'golden-ratio'
              ? 'grid-4x4'
              : 'none';
          return { ...prev, gridType: nextGrid };
        });
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
        } else {
          handleResetView();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleResetView, isUploadModalOpen, isGalleryOpen]);

  // Current index in pool
  const currentIndex = activeItem
    ? currentPool.findIndex(item => item.id === activeItem.id)
    : -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900 selection:bg-stone-200">
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
      />

      {/* Museum-Grade Reference Canvas */}
      <ReferenceViewer
        activeItem={activeItem}
        viewSettings={viewSettings}
        onNext={handleNext}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      {/* Floating Artist Dock Controls */}
      <ArtistControls
        activeItem={activeItem}
        currentIndex={currentIndex >= 0 ? currentIndex : 0}
        totalCount={currentPool.length}
        canGoBack={deckState.historyIndex > 0}
        canGoForward={deckState.historyIndex < deckState.history.length - 1}
        viewSettings={viewSettings}
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
