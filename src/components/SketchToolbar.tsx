import React from 'react';
import {
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { SketchSettings } from '../types/index.ts';

interface SketchToolbarProps {
  sketchSettings: SketchSettings;
  canUndo: boolean;
  canRedo: boolean;
  hasStrokes: boolean;
  onUpdateSettings: (updater: (prev: SketchSettings) => SketchSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onDownloadPng: () => void;
  onCloseDrawingMode: () => void;
}

const ATELIER_COLORS = [
  { id: 'graphite', label: 'Графит', hex: '#1C1917' },
  { id: 'sanguine', label: 'Сангина', hex: '#9A3412' },
  { id: 'sepia', label: 'Сепия', hex: '#57534E' },
  { id: 'cobalt', label: 'Линия построения', hex: '#1D4ED8' },
  { id: 'chalk', label: 'Белый мел', hex: '#FAFAF9' },
];

const STROKE_SIZES = [
  { size: 2, label: 'Тонкий (2px)' },
  { size: 4, label: 'Средний (4px)' },
  { size: 8, label: 'Маркер (8px)' },
  { size: 14, label: 'Широкий (14px)' },
];

export const SketchToolbar: React.FC<SketchToolbarProps> = ({
  sketchSettings,
  canUndo,
  canRedo,
  hasStrokes,
  onUpdateSettings,
  onUndo,
  onRedo,
  onClear,
  onDownloadPng,
  onCloseDrawingMode,
}) => {
  if (!sketchSettings.isDrawingMode) return null;

  return (
    <div
      data-testid="sketch-toolbar"
      className="fixed top-16 sm:top-20 inset-x-0 z-25 pointer-events-none flex justify-center px-3 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="pointer-events-auto max-w-[calc(100vw-1.5rem)] overflow-x-auto bg-[#FAF9F5]/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-300/90 dark:border-stone-800 shadow-lg shadow-stone-900/5 dark:shadow-black/40 rounded-2xl px-2 py-1.5 flex items-center gap-1.5">
        {/* Tool: Pen vs Eraser */}
        <div className="flex items-center gap-0.5 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onUpdateSettings(prev => ({ ...prev, tool: 'pen', isOverlayVisible: true }))}
            aria-label="Инструмент Карандаш"
            title="Карандаш / Набросок"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              sketchSettings.tool === 'pen'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-2xs'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings(prev => ({ ...prev, tool: 'eraser', isOverlayVisible: true }))}
            aria-label="Инструмент Ластик"
            title="Ластик"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              sketchSettings.tool === 'eraser'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 shadow-2xs'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 shrink-0" aria-hidden="true" />

        {/* Atelier Color Palette */}
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Цвет карандаша">
          {ATELIER_COLORS.map(c => {
            const isSelected = sketchSettings.color === c.hex && sketchSettings.tool === 'pen';
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  onUpdateSettings(prev => ({
                    ...prev,
                    tool: 'pen',
                    color: c.hex,
                    isOverlayVisible: true,
                  }))
                }
                aria-label={`Цвет: ${c.label}`}
                title={c.label}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                  isSelected
                    ? 'scale-110 ring-2 ring-stone-900 dark:ring-stone-100 ring-offset-1 dark:ring-offset-stone-900'
                    : 'hover:scale-105'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-stone-400/60 shadow-2xs"
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 shrink-0" aria-hidden="true" />

        {/* Stroke Width Selector */}
        <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label="Толщина линии">
          {STROKE_SIZES.map(item => {
            const isSelected = sketchSettings.strokeWidth === item.size;
            return (
              <button
                key={item.size}
                type="button"
                onClick={() => onUpdateSettings(prev => ({ ...prev, strokeWidth: item.size }))}
                aria-label={item.label}
                title={item.label}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800'
                }`}
              >
                <span
                  className="rounded-full bg-current"
                  style={{
                    width: `${Math.min(12, Math.max(3, item.size))}px`,
                    height: `${Math.min(12, Math.max(3, item.size))}px`,
                  }}
                />
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 shrink-0" aria-hidden="true" />

        {/* Undo / Redo / Visibility / Clear */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Отменить штрих"
            title="Отменить штрих (Ctrl+Z)"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              canUndo
                ? 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                : 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Повторить штрих"
            title="Повторить штрих (Ctrl+Y)"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              canRedo
                ? 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800'
                : 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateSettings(prev => ({ ...prev, isOverlayVisible: !prev.isOverlayVisible }))
            }
            aria-label={sketchSettings.isOverlayVisible ? 'Скрыть слой наброска' : 'Показать слой наброска'}
            title={sketchSettings.isOverlayVisible ? 'Скрыть слой наброска' : 'Показать слой наброска'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              !sketchSettings.isOverlayVisible
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100'
                : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800'
            }`}
          >
            {sketchSettings.isOverlayVisible ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasStrokes}
            aria-label="Очистить холст"
            title="Очистить весь набросок"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              hasStrokes
                ? 'text-stone-700 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                : 'text-stone-300 dark:text-stone-700 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-stone-200 dark:bg-stone-800 shrink-0" aria-hidden="true" />

        {/* Export options: Include reference background toggle + Download PNG */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings(prev => ({
                ...prev,
                exportWithBackground: !prev.exportWithBackground,
              }))
            }
            aria-label={
              sketchSettings.exportWithBackground
                ? 'Экспорт PNG вместе с фото-референсом'
                : 'Экспорт только прозрачного слоя наброска'
            }
            title={
              sketchSettings.exportWithBackground
                ? 'Включено: сохранять PNG вместе с референсом на фоне (нажмите, чтобы сохранять только прозрачный слой)'
                : 'Включено: сохранять только прозрачный слой линий (нажмите, чтобы включить референс на фоне)'
            }
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              sketchSettings.exportWithBackground
                ? 'bg-stone-900 dark:bg-stone-100 border-stone-900 dark:border-stone-100 text-white dark:text-stone-950'
                : 'bg-white/60 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onDownloadPng}
            aria-label="Скачать набросок как PNG"
            title="Скачать текущее состояние холста в формате PNG"
            className="flex items-center gap-1.5 px-2.5 h-8 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-950 text-xs font-medium rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={onCloseDrawingMode}
            aria-label="Выйти из режима рисования"
            title="Закрыть панель рисования (клавиша D)"
            className="w-8 h-8 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
