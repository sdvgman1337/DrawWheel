import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ReferenceItem,
  ViewSettings,
  SketchSettings,
  SketchStroke,
  SketchPoint,
  GridType,
} from '../types/index.ts';
import { renderStrokesToContext } from '../utils/sketch.ts';
import { buildReferenceFilterCss } from '../utils/deck.ts';
import { ImageOff, FolderOpen, Upload } from 'lucide-react';

interface ReferenceViewerProps {
  activeItem: ReferenceItem | null;
  viewSettings: ViewSettings;
  sketchSettings: SketchSettings;
  strokes: SketchStroke[];
  onCommitStroke: (stroke: SketchStroke) => void;
  onNext: () => void;
  onOpenUpload: () => void;
  imageRef: React.RefObject<HTMLImageElement | null>;
}

const CompositionGridOverlay: React.FC<{ gridType: GridType }> = ({ gridType }) => {
  if (gridType === 'none') return null;

  const renderLines = (strokeColor: string, strokeWidth: string, dashArray?: string) => {
    const commonProps = {
      stroke: strokeColor,
      strokeWidth,
      strokeDasharray: dashArray,
      vectorEffect: 'non-scaling-stroke' as const,
      fill: 'none',
    };

    switch (gridType) {
      case 'rule-of-thirds':
        return (
          <>
            <line x1="33.33" y1="0" x2="33.33" y2="100" {...commonProps} />
            <line x1="66.66" y1="0" x2="66.66" y2="100" {...commonProps} />
            <line x1="0" y1="33.33" x2="100" y2="33.33" {...commonProps} />
            <line x1="0" y1="66.66" x2="100" y2="66.66" {...commonProps} />
            {/* Focal intersections */}
            <circle cx="33.33" cy="33.33" r="0.8" {...commonProps} />
            <circle cx="66.66" cy="33.33" r="0.8" {...commonProps} />
            <circle cx="33.33" cy="66.66" r="0.8" {...commonProps} />
            <circle cx="66.66" cy="66.66" r="0.8" {...commonProps} />
          </>
        );

      case 'golden-ratio':
        return (
          <>
            <line x1="38.2" y1="0" x2="38.2" y2="100" {...commonProps} />
            <line x1="61.8" y1="0" x2="61.8" y2="100" {...commonProps} />
            <line x1="0" y1="38.2" x2="100" y2="38.2" {...commonProps} />
            <line x1="0" y1="61.8" x2="100" y2="61.8" {...commonProps} />
            {/* Subtle diagonals of the central phi rectangle */}
            <line x1="0" y1="0" x2="100" y2="100" {...commonProps} strokeOpacity="0.45" />
            <line x1="100" y1="0" x2="0" y2="100" {...commonProps} strokeOpacity="0.45" />
          </>
        );

      case 'grid-4x4':
        return (
          <>
            {[25, 50, 75].map(pos => (
              <React.Fragment key={pos}>
                <line
                  x1={pos}
                  y1="0"
                  x2={pos}
                  y2="100"
                  {...commonProps}
                  strokeWidth={pos === 50 ? '1.35' : strokeWidth}
                />
                <line
                  x1="0"
                  y1={pos}
                  x2="100"
                  y2={pos}
                  {...commonProps}
                  strokeWidth={pos === 50 ? '1.35' : strokeWidth}
                />
              </React.Fragment>
            ))}
          </>
        );

      case 'grid-8x8':
        return (
          <>
            {[12.5, 25, 37.5, 50, 62.5, 75, 87.5].map(pos => (
              <React.Fragment key={pos}>
                <line
                  x1={pos}
                  y1="0"
                  x2={pos}
                  y2="100"
                  {...commonProps}
                  strokeWidth={pos === 50 ? '1.5' : pos % 25 === 0 ? '1.1' : '0.75'}
                />
                <line
                  x1="0"
                  y1={pos}
                  x2="100"
                  y2={pos}
                  {...commonProps}
                  strokeWidth={pos === 50 ? '1.5' : pos % 25 === 0 ? '1.1' : '0.75'}
                />
              </React.Fragment>
            ))}
          </>
        );

      case 'diagonals':
        return (
          <>
            {/* Main diagonals */}
            <line x1="0" y1="0" x2="100" y2="100" {...commonProps} />
            <line x1="100" y1="0" x2="0" y2="100" {...commonProps} />
            {/* Central horizontal & vertical axes */}
            <line x1="50" y1="0" x2="50" y2="100" {...commonProps} strokeDasharray="4 4" />
            <line x1="0" y1="50" x2="100" y2="50" {...commonProps} strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="1.2" {...commonProps} />
          </>
        );

      case 'harmonic-armature':
        return (
          <>
            {/* Center axes */}
            <line x1="50" y1="0" x2="50" y2="100" {...commonProps} />
            <line x1="0" y1="50" x2="100" y2="50" {...commonProps} />
            {/* Main corner-to-corner diagonals */}
            <line x1="0" y1="0" x2="100" y2="100" {...commonProps} />
            <line x1="100" y1="0" x2="0" y2="100" {...commonProps} />
            {/* Inner diamond connecting midpoints */}
            <line x1="50" y1="0" x2="100" y2="50" {...commonProps} />
            <line x1="100" y1="50" x2="50" y2="100" {...commonProps} />
            <line x1="50" y1="100" x2="0" y2="50" {...commonProps} />
            <line x1="0" y1="50" x2="50" y2="0" {...commonProps} />
            {/* Reciprocal rays from corners to midpoints */}
            <line x1="0" y1="0" x2="50" y2="100" {...commonProps} strokeOpacity="0.6" />
            <line x1="100" y1="0" x2="50" y2="100" {...commonProps} strokeOpacity="0.6" />
            <line x1="0" y1="100" x2="50" y2="0" {...commonProps} strokeOpacity="0.6" />
            <line x1="100" y1="100" x2="50" y2="0" {...commonProps} strokeOpacity="0.6" />
          </>
        );

      case 'perspective-cross':
        return (
          <>
            {/* Plumb & level lines */}
            <line x1="50" y1="0" x2="50" y2="100" {...commonProps} />
            <line x1="0" y1="50" x2="100" y2="50" {...commonProps} />
            {/* Concentric proportion ellipses/rings */}
            <ellipse cx="50" cy="50" rx="15" ry="15" {...commonProps} />
            <ellipse cx="50" cy="50" rx="30" ry="30" {...commonProps} />
            <ellipse cx="50" cy="50" rx="44" ry="44" {...commonProps} strokeDasharray="3 3" />
            {/* Subtle corner rays */}
            <line x1="25" y1="0" x2="75" y2="100" {...commonProps} strokeOpacity="0.45" />
            <line x1="75" y1="0" x2="25" y2="100" {...commonProps} strokeOpacity="0.45" />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      data-testid={`grid-overlay-${gridType}`}
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full block"
      >
        {/* Soft dark contrast shadow line so grid is visible on bright white areas */}
        {renderLines('rgba(28, 25, 23, 0.42)', '1.8')}
        {/* Crisp luminous hairline so grid is visible on deep chiaroscuro shadow areas */}
        {renderLines('rgba(250, 249, 245, 0.78)', '0.95')}
      </svg>
    </div>
  );
};

export const ReferenceViewer: React.FC<ReferenceViewerProps> = ({
  activeItem,
  viewSettings,
  sketchSettings,
  strokes,
  onCommitStroke,
  onNext,
  onOpenUpload,
  imageRef,
}) => {
  const [imageError, setImageError] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Canvas state for active stroke
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePoints, setActivePoints] = useState<SketchPoint[]>([]);
  const isDrawingRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Reset pan when item changes or zoom is reset
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setImageError(false);
  }, [activeItem?.id, viewSettings.zoom]);

  // Observe reference image dimensions so transparent canvas overlay matches 1:1
  const syncCanvasDimensions = useCallback(() => {
    const img = imageRef.current;
    if (!img) return;
    const width = Math.max(1, img.clientWidth);
    const height = Math.max(1, img.clientHeight);
    setCanvasSize(prev =>
      prev.width === width && prev.height === height ? prev : { width, height }
    );
  }, [imageRef]);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    syncCanvasDimensions();
    const observer = new ResizeObserver(() => {
      syncCanvasDimensions();
    });
    observer.observe(img);
    window.addEventListener('resize', syncCanvasDimensions);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncCanvasDimensions);
    };
  }, [activeItem?.id, syncCanvasDimensions, imageRef]);

  // Re-render strokes + current in-progress stroke onto the overlay canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sketchSettings.isOverlayVisible) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const allStrokes: SketchStroke[] =
      activePoints.length > 0
        ? [
            ...strokes,
            {
              id: 'active-preview',
              tool: sketchSettings.tool,
              color: sketchSettings.color,
              size: sketchSettings.strokeWidth,
              opacity: sketchSettings.opacity,
              points: activePoints,
            },
          ]
        : strokes;

    renderStrokesToContext(
      ctx,
      allStrokes,
      canvas.width,
      canvas.height,
      sketchSettings.opacity
    );
  }, [
    strokes,
    activePoints,
    canvasSize,
    sketchSettings.isOverlayVisible,
    sketchSettings.tool,
    sketchSettings.color,
    sketchSettings.strokeWidth,
    sketchSettings.opacity,
  ]);

  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>): SketchPoint => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
    let x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (viewSettings.isFlipped) {
      x = 1 - x;
    }
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sketchSettings.isDrawingMode) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors on synthetic events
    }
    isDrawingRef.current = true;
    const pt = getNormalizedPoint(e);
    setActivePoints([pt]);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sketchSettings.isDrawingMode || !isDrawingRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const pt = getNormalizedPoint(e);
    setActivePoints(prev => [...prev, pt]);
  };

  const finishDrawingStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!sketchSettings.isDrawingMode || !isDrawingRef.current) return;
    e.stopPropagation();
    isDrawingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore synthetic pointer release errors
    }

    setActivePoints(currentPoints => {
      if (currentPoints.length > 0) {
        const newStroke: SketchStroke = {
          id: `stroke-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          tool: sketchSettings.tool,
          color: sketchSettings.color,
          size: sketchSettings.strokeWidth,
          opacity: sketchSettings.opacity,
          points: currentPoints,
        };
        queueMicrotask(() => onCommitStroke(newStroke));
      }
      return [];
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (sketchSettings.isDrawingMode) return;
    if (viewSettings.zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (sketchSettings.isDrawingMode) return;
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
    if (sketchSettings.isDrawingMode) return;
    e.stopPropagation();
    onNext();
  };

  if (!activeItem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-stone-200/60 dark:bg-stone-900 flex items-center justify-center mb-5 text-stone-500 dark:text-stone-400">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h2 className="font-serif-display text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Нет доступных референсов
        </h2>
        <p className="text-stone-600 dark:text-stone-400 max-w-md text-sm mb-6 font-sans-body">
          Добавьте фотографии в папку{' '}
          <code className="bg-stone-200/70 dark:bg-stone-800 px-1.5 py-0.5 rounded text-stone-800 dark:text-stone-200 text-xs font-mono">
            public/references
          </code>{' '}
          или загрузите пакет изображений через кнопку ниже.
        </p>
        <button
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 text-sm font-medium rounded-xl hover:bg-stone-800 dark:hover:bg-white transition-all cursor-pointer shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Загрузить пакет референсов</span>
        </button>
      </div>
    );
  }

  // Construct CSS filters for the reference image (Grayscale, Chiaroscuro Contrast, Blur)
  const filterStyles = buildReferenceFilterCss(viewSettings);

  const containerTransformStyle: React.CSSProperties = {
    transform: `
      translate(${panOffset.x}px, ${panOffset.y}px)
      scale(${viewSettings.zoom})
      scaleX(${viewSettings.isFlipped ? -1 : 1})
    `,
    cursor: sketchSettings.isDrawingMode
      ? 'crosshair'
      : viewSettings.zoom > 1
      ? isDragging
        ? 'grabbing'
        : 'grab'
      : 'pointer',
    transition: isDragging
      ? 'none'
      : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <main
      className="relative flex-1 w-full h-[calc(100dvh-4rem)] flex items-center justify-center p-2 sm:p-6 pb-16 sm:pb-20 overflow-hidden select-none bg-[#FAF9F5] dark:bg-stone-950 transition-colors"
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
            title={
              sketchSettings.isDrawingMode
                ? 'Режим наброска поверх референса'
                : 'Двойной клик — следующий случайный референс'
            }
          >
            {imageError ? (
              <div className="w-full max-w-lg aspect-4/3 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col items-center justify-center p-6 text-center text-stone-500 dark:text-stone-400">
                <ImageOff className="w-12 h-12 mb-3 text-stone-400 dark:text-stone-600" />
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
                  Не удалось загрузить изображение
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {activeItem.filename || activeItem.name}
                </p>
              </div>
            ) : (
              <div
                style={containerTransformStyle}
                className="relative max-w-full max-h-full flex items-center justify-center shadow-xl shadow-stone-900/5 dark:shadow-black/50 rounded-lg overflow-hidden bg-white/40 dark:bg-stone-900/40 ring-1 ring-stone-900/5 dark:ring-white/10 will-change-transform"
              >
                <img
                  ref={imageRef}
                  src={activeItem.url}
                  alt={activeItem.name}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  style={{
                    filter: filterStyles || undefined,
                    transition: 'filter 0.2s ease',
                  }}
                  onLoad={syncCanvasDimensions}
                  onError={() => setImageError(true)}
                  className="max-h-[calc(100dvh-9rem)] max-w-full object-contain pointer-events-auto rounded-md block"
                  draggable={false}
                />

                {/* Transparent Drawing Canvas Overlay sitting directly on top of the reference */}
                <canvas
                  ref={canvasRef}
                  data-testid="drawing-canvas"
                  width={canvasSize.width}
                  height={canvasSize.height}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={finishDrawingStroke}
                  onPointerCancel={finishDrawingStroke}
                  style={{
                    touchAction: sketchSettings.isDrawingMode ? 'none' : 'auto',
                  }}
                  className={`absolute inset-0 w-full h-full z-15 transition-opacity duration-150 ${
                    sketchSettings.isDrawingMode
                      ? 'pointer-events-auto cursor-crosshair'
                      : 'pointer-events-none'
                  } ${sketchSettings.isOverlayVisible ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Expanded Composition & Academic Grids Overlay */}
                <CompositionGridOverlay gridType={viewSettings.gridType} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};
