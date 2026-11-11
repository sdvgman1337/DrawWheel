import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReferenceItem, ViewSettings } from '../types/index.ts';
import { ImageOff, Sparkles, FolderOpen, Upload } from 'lucide-react';

interface ReferenceViewerProps {
  activeItem: ReferenceItem | null;
  viewSettings: ViewSettings;
  onNext: () => void;
  onOpenUpload: () => void;
}

export const ReferenceViewer: React.FC<ReferenceViewerProps> = ({
  activeItem,
  viewSettings,
  onNext,
  onOpenUpload,
}) => {
  const [imageError, setImageError] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset pan when item changes or zoom is reset
  React.useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setImageError(false);
  }, [activeItem?.id, viewSettings.zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewSettings.zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && viewSettings.zoom > 1) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNext();
  };

  if (!activeItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-stone-200/60 flex items-center justify-center mb-5 text-stone-500">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="font-serif-display text-2xl font-semibold text-stone-900 mb-2">
          Нет доступных референсов
        </h2>
        <p className="text-stone-600 max-w-md text-sm mb-6 font-sans-body">
          Добавьте фотографии в папку <code className="bg-stone-200/70 px-1.5 py-0.5 rounded text-stone-800 text-xs font-mono">public/references</code> или загрузите пакет изображений через кнопку ниже.
        </p>
        <button
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-all cursor-pointer shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Загрузить пакет референсов</span>
        </button>
      </div>
    );
  }

  // Construct CSS filters
  const filterStyles = [
    viewSettings.isGrayscale ? 'grayscale(100%)' : '',
    viewSettings.isBlurred ? 'blur(6px)' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const transformStyle: React.CSSProperties = {
    transform: `
      translate(${panOffset.x}px, ${panOffset.y}px)
      scale(${viewSettings.zoom})
      scaleX(${viewSettings.isFlipped ? -1 : 1})
    `,
    filter: filterStyles || undefined,
    cursor: viewSettings.zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), filter 0.2s ease',
  };

  return (
    <main
      className="relative flex-1 w-full h-[calc(100vh-8.5rem)] flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none bg-[#FAF9F5]"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Passe-partout gallery matting frame */}
      <div className="relative w-full h-full max-w-6xl flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.015 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full h-full flex items-center justify-center"
            onDoubleClick={handleDoubleClick}
            title="Двойной клик — следующий случайный референс"
          >
            {imageError ? (
              <div className="w-full max-w-lg aspect-4/3 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center p-6 text-center text-stone-500">
                <ImageOff className="w-12 h-12 mb-3 text-stone-400" />
                <p className="text-sm font-medium text-stone-800 mb-1">Не удалось загрузить изображение</p>
                <p className="text-xs text-stone-500">{activeItem.filename || activeItem.name}</p>
              </div>
            ) : (
              <div className="relative max-w-full max-h-full flex items-center justify-center shadow-xl shadow-stone-900/4 rounded-lg overflow-hidden bg-white/40 ring-1 ring-stone-900/5">
                <img
                  src={activeItem.url}
                  alt={activeItem.name}
                  referrerPolicy="no-referrer"
                  style={transformStyle}
                  className="max-h-[calc(100vh-10rem)] max-w-full object-contain pointer-events-auto rounded-md will-change-transform"
                  onError={() => setImageError(true)}
                  draggable={false}
                />

                {/* Composition Grid Overlay */}
                {viewSettings.gridType !== 'none' && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {viewSettings.gridType === 'rule-of-thirds' && (
                      <div className="w-full h-full relative">
                        {/* Vertical thirds */}
                        <div className="absolute top-0 bottom-0 left-[33.33%] w-[1px] bg-stone-400/40 border-r border-stone-100/20" />
                        <div className="absolute top-0 bottom-0 left-[66.66%] w-[1px] bg-stone-400/40 border-r border-stone-100/20" />
                        {/* Horizontal thirds */}
                        <div className="absolute left-0 right-0 top-[33.33%] h-[1px] bg-stone-400/40 border-b border-stone-100/20" />
                        <div className="absolute left-0 right-0 top-[66.66%] h-[1px] bg-stone-400/40 border-b border-stone-100/20" />
                      </div>
                    )}

                    {viewSettings.gridType === 'golden-ratio' && (
                      <div className="w-full h-full relative">
                        <div className="absolute top-0 bottom-0 left-[38.2%] w-[1px] bg-stone-400/40" />
                        <div className="absolute top-0 bottom-0 left-[61.8%] w-[1px] bg-stone-400/40" />
                        <div className="absolute left-0 right-0 top-[38.2%] h-[1px] bg-stone-400/40" />
                        <div className="absolute left-0 right-0 top-[61.8%] h-[1px] bg-stone-400/40" />
                      </div>
                    )}

                    {viewSettings.gridType === 'grid-4x4' && (
                      <div className="w-full h-full relative">
                        <div className="absolute top-0 bottom-0 left-[25%] w-[1px] bg-stone-400/30" />
                        <div className="absolute top-0 bottom-0 left-[50%] w-[1px] bg-stone-400/40" />
                        <div className="absolute top-0 bottom-0 left-[75%] w-[1px] bg-stone-400/30" />
                        <div className="absolute left-0 right-0 top-[25%] h-[1px] bg-stone-400/30" />
                        <div className="absolute left-0 right-0 top-[50%] h-[1px] bg-stone-400/40" />
                        <div className="absolute left-0 right-0 top-[75%] h-[1px] bg-stone-400/30" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};
