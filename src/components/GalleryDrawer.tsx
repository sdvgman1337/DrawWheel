import React from 'react';
import { X, Trash2, Check, Folder, Upload, Images } from 'lucide-react';
import { ReferenceItem } from '../types/index.ts';

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: ReferenceItem[];
  activeId: string | null;
  onSelectItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
}

export const GalleryDrawer: React.FC<GalleryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  activeId,
  onSelectItem,
  onDeleteItem,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF9F5] h-full shadow-2xl border-l border-stone-200/90 flex flex-col p-5 overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Images className="w-5 h-5 text-stone-700" />
            <h3 className="font-serif-display text-lg font-semibold text-stone-900">
              Галерея референсов
            </h3>
            <span className="text-xs text-stone-500 font-mono">({items.length})</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
            aria-label="Закрыть галерею"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail Grid */}
        <div className="flex-1 overflow-y-auto py-4">
          {items.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-stone-500">
              <p className="text-sm">Нет референсов в этой категории</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map(item => {
                const isActive = item.id === activeId;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item.id);
                      onClose();
                    }}
                    className={`group relative rounded-xl overflow-hidden border transition-all cursor-pointer bg-white/70 ${
                      isActive
                        ? 'border-stone-900 ring-2 ring-stone-900/20 shadow-sm'
                        : 'border-stone-200/80 hover:border-stone-400'
                    }`}
                  >
                    <div className="aspect-4/3 w-full overflow-hidden bg-stone-100 flex items-center justify-center">
                      <img
                        src={item.url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Active Checkmark */}
                    {isActive && (
                      <div className="absolute top-2 left-2 bg-stone-900 text-white rounded-md p-0.5 shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Delete button for uploaded items */}
                    {item.source === 'upload' && onDeleteItem && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-stone-500 hover:text-red-600 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Удалить референс"
                        aria-label={`Удалить ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Metadata text */}
                    <div className="p-2 bg-white/90 border-t border-stone-100">
                      <p className="text-xs font-medium text-stone-800 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-0.5">
                        {item.source === 'folder' ? (
                          <span className="flex items-center gap-1">
                            <Folder className="w-2.5 h-2.5" /> Папка
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Upload className="w-2.5 h-2.5" /> Загрузка
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-stone-200 text-[11px] text-stone-500 text-center">
          Кликните по любой миниатюре для мгновенного перехода
        </div>
      </div>
    </div>
  );
};
