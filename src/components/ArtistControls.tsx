import React, { useState } from 'react';
import {
  Shuffle,
  ChevronLeft,
  ChevronRight,
  FlipHorizontal,
  Eye,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pencil,
  Download,
  Contrast,
  Eclipse,
} from 'lucide-react';
import { ViewSettings, ReferenceItem, GridType, ContrastMode } from '../types/index.ts';
import {
  GRID_OPTIONS,
  CONTRAST_OPTIONS,
  getNextGridType,
  getNextContrastMode,
} from '../utils/deck.ts';

interface ArtistControlsProps {
  activeItem: ReferenceItem | null;
  currentIndex: number;
  totalCount: number;
  canGoBack: boolean;
  canGoForward: boolean;
  viewSettings: ViewSettings;
  isDrawingMode: boolean;
  hasStrokes: boolean;
  onToggleDrawingMode: () => void;
  onDownloadPng: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onUpdateViewSettings: (updater: (prev: ViewSettings) => ViewSettings) => void;
  onResetView: () => void;
}

export const ArtistControls: React.FC<ArtistControlsProps> = ({
  totalCount,
  canGoBack,
  viewSettings,
  isDrawingMode,
  hasStrokes,
  onToggleDrawingMode,
  onDownloadPng,
  onNext,
  onPrevious,
  onUpdateViewSettings,
  onResetView,
}) => {
  const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'grid' | 'contrast'>('none');

  const toggleGrayscale = () => {
    onUpdateViewSettings(prev => ({ ...prev, isGrayscale: !prev.isGrayscale }));
  };

  const toggleFlip = () => {
    onUpdateViewSettings(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
  };

  const toggleBlur = () => {
    onUpdateViewSettings(prev => ({ ...prev, isBlurred: !prev.isBlurred }));
  };

  const handleCycleContrast = () => {
    setActiveSubmenu('contrast');
    onUpdateViewSettings(prev => ({
      ...prev,
      contrastMode: getNextContrastMode(prev.contrastMode),
    }));
  };

  const handleSelectContrast = (mode: ContrastMode) => {
    onUpdateViewSettings(prev => ({ ...prev, contrastMode: mode }));
    if (mode === 'normal') {
      setActiveSubmenu('none');
    }
  };

  const handleCycleGrid = () => {
    setActiveSubmenu('grid');
    onUpdateViewSettings(prev => ({
      ...prev,
      gridType: getNextGridType(prev.gridType),
    }));
  };

  const handleSelectGrid = (grid: GridType) => {
    onUpdateViewSettings(prev => ({ ...prev, gridType: grid }));
    if (grid === 'none') {
      setActiveSubmenu('none');
    }
  };

  const zoomIn = () => {
    onUpdateViewSettings(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 3) }));
  };

  const zoomOut = () => {
    onUpdateViewSettings(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) }));
  };

  const isViewModified =
    viewSettings.isGrayscale ||
    viewSettings.isFlipped ||
    viewSettings.isBlurred ||
    viewSettings.contrastMode !== 'normal' ||
    viewSettings.gridType !== 'none' ||
    viewSettings.zoom !== 1;

  const currentGridOption =
    GRID_OPTIONS.find(g => g.id === viewSettings.gridType) || GRID_OPTIONS[0];
  const currentContrastOption =
    CONTRAST_OPTIONS.find(c => c.id === viewSettings.contrastMode) || CONTRAST_OPTIONS[0];

  const showGridPicker =
    activeSubmenu === 'grid' || (viewSettings.gridType !== 'none' && activeSubmenu !== 'contrast');
  const showContrastPicker =
    activeSubmenu === 'contrast' ||
    (viewSettings.contrastMode !== 'normal' && activeSubmenu !== 'grid');

  const iconBtnBase =
    'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0';
  const iconBtnInactive =
    'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 active:scale-95';
  const iconBtnActive =
    'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-xs';

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-20 pointer-events-none flex flex-col items-center gap-1.5 px-2 sm:px-4">
      {/* Contextual Sub-Bar: Quick Grid Selection */}
      {showGridPicker && (
        <div
          role="group"
          aria-label="Выбор сетки композиции"
          className="pointer-events-auto max-w-[calc(100vw-1rem)] overflow-x-auto bg-[#FAF9F5]/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 shadow-md rounded-xl px-1.5 py-1 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {GRID_OPTIONS.map(option => {
            const isSelected = viewSettings.gridType === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectGrid(option.id)}
                title={`${option.label} — ${option.description}`}
                aria-label={`Сетка: ${option.label}`}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                }`}
              >
                {option.shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Contextual Sub-Bar: Quick Chiaroscuro / Contrast Selection */}
      {showContrastPicker && !showGridPicker && (
        <div
          role="group"
          aria-label="Выбор режима контрастности светотени"
          className="pointer-events-auto max-w-[calc(100vw-1rem)] overflow-x-auto bg-[#FAF9F5]/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 shadow-md rounded-xl px-1.5 py-1 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {CONTRAST_OPTIONS.map(option => {
            const isSelected = viewSettings.contrastMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectContrast(option.id)}
                title={`${option.label} — ${option.description}`}
                aria-label={`Контраст: ${option.label}`}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                }`}
              >
                {option.shortLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Compact Icon-Only Floating Control Capsule */}
      <div className="pointer-events-auto max-w-[calc(100vw-1rem)] overflow-x-auto bg-[#FAF9F5]/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 shadow-xl shadow-stone-900/5 dark:shadow-black/40 rounded-2xl p-1 sm:p-1.5 flex items-center gap-0.5 sm:gap-1 transition-all">
        {/* History back button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          aria-label="Предыдущий референс"
          title="Предыдущий референс (←)"
          className={`${iconBtnBase} ${
            canGoBack
              ? iconBtnInactive
              : 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* PRIMARY ACTION: Compact & Tactile Random Reference Button */}
        <button
          type="button"
          onClick={onNext}
          disabled={totalCount === 0}
          aria-label="Следующий случайный референс"
          title="Случайный референс (Пробел / Enter)"
          className="group relative flex items-center gap-2 px-3 sm:px-3.5 h-8 sm:h-9 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-stone-50 dark:text-stone-950 font-medium text-xs tracking-wide rounded-xl ring-1 ring-inset ring-white/15 dark:ring-stone-900/15 shadow-sm transition-all active:scale-95 cursor-pointer select-none shrink-0"
        >
          <span className="w-5 h-5 rounded-lg bg-white/12 dark:bg-stone-900/10 flex items-center justify-center transition-transform duration-300 group-hover:rotate-180">
            <Shuffle className="w-3.5 h-3.5" />
          </span>
          <span className="whitespace-nowrap">Случайный</span>
        </button>

        {/* Next reference button */}
        <button
          type="button"
          onClick={onNext}
          disabled={totalCount === 0}
          aria-label="Следующий референс"
          title="Следующий референс (→)"
          className={`${iconBtnBase} ${iconBtnInactive}`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Subtle Divider */}
        <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 mx-0.5 shrink-0" aria-hidden="true" />

        {/* Artist Tool: Transparent Drawing Canvas (Icon Only) */}
        <button
          type="button"
          onClick={onToggleDrawingMode}
          aria-label="Режим наброска поверх референса"
          title="Прозрачный холст для набросков поверх фото (D)"
          className={`relative ${iconBtnBase} ${isDrawingMode ? iconBtnActive : iconBtnInactive}`}
        >
          <Pencil className="w-4 h-4" />
          {hasStrokes && !isDrawingMode && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-200" />
          )}
        </button>

        {/* Quick Download Sketch PNG button when strokes exist (Icon Only) */}
        {hasStrokes && (
          <button
            type="button"
            onClick={onDownloadPng}
            aria-label="Скачать PNG наброска"
            title="Скачать текущий набросок как PNG файл"
            className={`${iconBtnBase} ${iconBtnInactive}`}
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Artist Tool: Flip Horizontal (Icon Only) */}
        <button
          type="button"
          onClick={toggleFlip}
          aria-label="Отразить по горизонтали"
          title="Зеркало по горизонтали (F)"
          className={`${iconBtnBase} ${viewSettings.isFlipped ? iconBtnActive : iconBtnInactive}`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        {/* Artist Tool: Grayscale / Tonal Study (Icon Only) */}
        <button
          type="button"
          onClick={toggleGrayscale}
          aria-label="Черно-белый режим"
          title="Черно-белый тональный режим (B)"
          className={`${iconBtnBase} ${viewSettings.isGrayscale ? iconBtnActive : iconBtnInactive}`}
        >
          <Eclipse className="w-4 h-4" />
        </button>

        {/* Artist Tool: High Contrast / Chiaroscuro Mode (Icon Only) */}
        <button
          type="button"
          onClick={handleCycleContrast}
          aria-label="Режим повышенной контрастности светотени"
          title={`Контраст светотени (C): ${currentContrastOption.label}`}
          className={`relative ${iconBtnBase} ${
            viewSettings.contrastMode !== 'normal' ? iconBtnActive : iconBtnInactive
          }`}
        >
          <Contrast className="w-4 h-4" />
          {viewSettings.contrastMode !== 'normal' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
          )}
        </button>

        {/* Artist Tool: Squint / Soft Blur (Icon Only) */}
        <button
          type="button"
          onClick={toggleBlur}
          aria-label="Эффект прищура"
          title="Прищур / обобщение силуэта (S)"
          className={`${iconBtnBase} ${viewSettings.isBlurred ? iconBtnActive : iconBtnInactive}`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Artist Tool: Composition Grid (Icon Only) */}
        <button
          type="button"
          onClick={handleCycleGrid}
          aria-label="Сетка композиции"
          title={`Сетка композиции (G): ${currentGridOption.label}`}
          className={`relative ${iconBtnBase} ${
            viewSettings.gridType !== 'none' ? iconBtnActive : iconBtnInactive
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          {viewSettings.gridType !== 'none' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
          )}
        </button>

        {/* Zoom In/Out & Reset (Icon Only) */}
        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Приблизить"
            title="Приблизить"
            className={`${iconBtnBase} ${iconBtnInactive}`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Отдалить"
            title="Отдалить"
            className={`${iconBtnBase} ${iconBtnInactive}`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {isViewModified && (
            <button
              type="button"
              onClick={() => {
                setActiveSubmenu('none');
                onResetView();
              }}
              aria-label="Сбросить фильтры вида"
              title="Сбросить все эффекты и сетки (Escape)"
              className={`${iconBtnBase} ${iconBtnInactive}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
