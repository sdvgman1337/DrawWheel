import React from 'react';
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
  Sparkles,
} from 'lucide-react';
import { ViewSettings, ReferenceItem } from '../types/index.ts';

interface ArtistControlsProps {
  activeItem: ReferenceItem | null;
  currentIndex: number;
  totalCount: number;
  canGoBack: boolean;
  canGoForward: boolean;
  viewSettings: ViewSettings;
  onNext: () => void;
  onPrevious: () => void;
  onUpdateViewSettings: (updater: (prev: ViewSettings) => ViewSettings) => void;
  onResetView: () => void;
}

export const ArtistControls: React.FC<ArtistControlsProps> = ({
  activeItem,
  currentIndex,
  totalCount,
  canGoBack,
  canGoForward,
  viewSettings,
  onNext,
  onPrevious,
  onUpdateViewSettings,
  onResetView,
}) => {
  const toggleGrayscale = () => {
    onUpdateViewSettings(prev => ({ ...prev, isGrayscale: !prev.isGrayscale }));
  };

  const toggleFlip = () => {
    onUpdateViewSettings(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
  };

  const toggleBlur = () => {
    onUpdateViewSettings(prev => ({ ...prev, isBlurred: !prev.isBlurred }));
  };

  const cycleGrid = () => {
    onUpdateViewSettings(prev => {
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
    viewSettings.gridType !== 'none' ||
    viewSettings.zoom !== 1;

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-20 pointer-events-none flex flex-col items-center gap-1.5 sm:gap-2 px-3">
      {/* Floating Control Capsule */}
      <div className="pointer-events-auto max-w-[calc(100vw-1.5rem)] overflow-x-auto bg-[#FAF9F5]/95 backdrop-blur-md border border-stone-200/90 shadow-lg shadow-stone-900/5 rounded-2xl p-1 sm:p-2 flex items-center gap-1 sm:gap-2 transition-all">
        
        {/* History back button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          aria-label="Предыдущий референс"
          title="Предыдущий референс (← стрелка влево)"
          className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            canGoBack
              ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 active:scale-95'
              : 'text-stone-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* PRIMARY ACTION: Next random reference button */}
        <button
          type="button"
          onClick={onNext}
          disabled={totalCount === 0}
          aria-label="Следующий случайный референс"
          title="Случайный референс (Пробел или Enter)"
          className="group relative flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-medium text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer select-none shrink-0"
        >
          <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:rotate-12 group-active:rotate-45" />
          <span>Случайный референс</span>
          <span className="hidden md:inline-flex items-center text-[10px] font-sans px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300 ml-1">
            Пробел
          </span>
        </button>

        {/* Next in history if available */}
        <button
          type="button"
          onClick={onNext}
          disabled={totalCount === 0}
          aria-label="Следующий референс"
          title="Следующий референс (→ стрелка вправо)"
          className="p-2 sm:p-2.5 rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Subtle Divider */}
        <div className="w-[1px] h-5 sm:h-6 bg-stone-200 mx-0.5 sm:mx-1 shrink-0" aria-hidden="true" />

        {/* Artist Tool: Flip Horizontal */}
        <button
          type="button"
          onClick={toggleFlip}
          aria-label="Отразить по горизонтали"
          title="Зеркало (клавиша F) — проверить симметрию и пропорции"
          className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            viewSettings.isFlipped
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        {/* Artist Tool: Grayscale (Values study) */}
        <button
          type="button"
          onClick={toggleGrayscale}
          aria-label="Черно-белый режим"
          title="Тональность / ЧБ (клавиша B) — анализ светотени без цвета"
          className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            viewSettings.isGrayscale
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <span className="text-xs font-semibold px-0.5">ЧБ</span>
        </button>

        {/* Artist Tool: Squint / Soft Blur */}
        <button
          type="button"
          onClick={toggleBlur}
          aria-label="Эффект прищура"
          title="Прищур (клавиша S) — обобщение формы и силуэтов"
          className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            viewSettings.isBlurred
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Artist Tool: Composition Grid */}
        <button
          type="button"
          onClick={cycleGrid}
          aria-label="Сетка композиции"
          title={`Сетка композиции (клавиша G): ${
            viewSettings.gridType === 'none'
              ? 'выключена'
              : viewSettings.gridType === 'rule-of-thirds'
              ? 'правило третей (3x3)'
              : viewSettings.gridType === 'golden-ratio'
              ? 'золотое сечение'
              : 'сетка 4x4'
          }`}
          className={`relative p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
            viewSettings.gridType !== 'none'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
          {viewSettings.gridType !== 'none' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-stone-300" />
          )}
        </button>

        {/* Zoom In/Out & Reset */}
        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={zoomIn}
            aria-label="Приблизить"
            title="Приблизить"
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Отдалить"
            title="Отдалить"
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {isViewModified && (
            <button
              type="button"
              onClick={onResetView}
              aria-label="Сбросить фильтры вида"
              title="Сбросить все эффекты (Escape)"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Subtle unboxed metadata kicker */}
      {activeItem && (
        <div className="pointer-events-auto flex items-center justify-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-stone-500 select-none px-2 text-center max-w-full">
          <span className="font-medium text-stone-700 truncate max-w-[180px] sm:max-w-xs">{activeItem.name}</span>
          <span aria-hidden="true">·</span>
          <span>
            {activeItem.source === 'folder' ? 'Папка references' : 'Загружено'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {currentIndex + 1} из {totalCount}
          </span>
          {viewSettings.zoom !== 1 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-mono">{Math.round(viewSettings.zoom * 100)}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
