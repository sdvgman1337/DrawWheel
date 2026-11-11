import React from 'react';
import { Upload, Images, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { SourceFilter } from '../types/index.ts';

interface HeaderProps {
  totalCount: number;
  folderCount: number;
  uploadCount: number;
  sourceFilter: SourceFilter;
  onFilterChange: (filter: SourceFilter) => void;
  onOpenUpload: () => void;
  onToggleGallery: () => void;
  isGalleryOpen: boolean;
  onRefreshFolder: () => void;
  isRefreshing: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  folderCount,
  uploadCount,
  sourceFilter,
  onFilterChange,
  onOpenUpload,
  onToggleGallery,
  isGalleryOpen,
  onRefreshFolder,
  isRefreshing,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <header className="w-full border-b border-stone-200/80 bg-[#FAF9F5]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="font-serif-display text-lg sm:text-2xl font-semibold tracking-tight text-stone-900 select-none">
            Atelier Ref
          </span>
          <span className="text-stone-300 hidden md:inline" aria-hidden="true">|</span>
          <span className="text-xs text-stone-600 hidden md:inline font-sans-body">
            Студия референсов
          </span>
        </div>

        {/* Zone 2: Source filter navigation (desktop) + compact toggle (mobile) */}
        <nav className="hidden sm:flex items-center gap-1 sm:gap-2 p-1 bg-stone-200/60 rounded-xl" aria-label="Фильтр источников">
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              sourceFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
            }`}
            aria-label="Показать все референсы"
          >
            Все <span className="text-stone-600 tabular-nums font-normal">({totalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange('folder')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
              sourceFilter === 'folder'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
            }`}
            aria-label="Показать референсы из встроенной папки"
          >
            Из папки <span className="text-stone-600 tabular-nums font-normal">({folderCount})</span>
          </button>

          {uploadCount > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange('upload')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                sourceFilter === 'upload'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
              }`}
              aria-label="Показать загруженные референсы"
            >
              Загруженные <span className="text-stone-600 tabular-nums font-normal">({uploadCount})</span>
            </button>
          )}
        </nav>

        {/* Mobile source filter indicator button */}
        <div className="flex sm:hidden items-center">
          <button
            type="button"
            onClick={() => {
              if (sourceFilter === 'all') onFilterChange('folder');
              else if (sourceFilter === 'folder' && uploadCount > 0) onFilterChange('upload');
              else onFilterChange('all');
            }}
            className="text-[11px] font-medium px-2 py-1 bg-stone-200/70 text-stone-800 rounded-lg"
            title="Переключить источник (Все / Из папки / Загруженные)"
          >
            {sourceFilter === 'all'
              ? `Все (${totalCount})`
              : sourceFilter === 'folder'
              ? `Папка (${folderCount})`
              : `Загрузки (${uploadCount})`}
          </button>
        </div>

        {/* Zone 3: Primary action + utility triggers */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefreshFolder}
            disabled={isRefreshing}
            className="p-1.5 sm:p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            title="Пересканировать папку public/references"
            aria-label="Обновить список файлов из папки"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-stone-900' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onToggleGallery}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-2 text-xs font-medium rounded-lg transition-all cursor-pointer ${
              isGalleryOpen
                ? 'bg-stone-300/80 text-stone-900'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
            aria-label="Открыть галерею миниатюр"
            title="Открыть все референсы (клавиша L)"
          >
            <Images className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Галерея</span>
          </button>

          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-medium text-stone-900 bg-white border border-stone-300/90 rounded-lg shadow-2xs hover:bg-stone-50 hover:border-stone-400 transition-all cursor-pointer whitespace-nowrap"
            aria-label="Загрузить пакет референсов"
            title="Загрузить пакет референсов (клавиша U)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Загрузить</span>
          </button>

          <button
            type="button"
            onClick={onToggleFullscreen}
            className="hidden md:flex p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
            aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
