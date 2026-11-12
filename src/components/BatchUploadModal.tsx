import React, { useState, useRef } from 'react';
import { X, Upload, Folder, Check, AlertCircle, FileImage, HardDrive } from 'lucide-react';
import { ReferenceItem } from '../types/index.ts';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReferences: (items: ReferenceItem[], saveToDiskFolder?: boolean) => Promise<void>;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onAddReferences,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [saveToFolderOnDisk, setSaveToFolderOnDisk] = useState(true);
  const [recentUploads, setRecentUploads] = useState<ReferenceItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(file.name)
    );

    if (imageFiles.length === 0) {
      setStatusMessage('В выбранных файлах не найдено изображений.');
      return;
    }

    setIsProcessing(true);
    setTotalToProcess(imageFiles.length);
    setProcessedCount(0);
    setStatusMessage(null);

    const items: ReferenceItem[] = [];
    const serverPayloadFiles: { filename: string; base64: string }[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const blobUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const item: ReferenceItem = {
        id: `upload-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        url: blobUrl,
        source: 'upload',
        filename: file.name,
        sizeBytes: file.size,
        addedAt: Date.now(),
        blob: file,
      };
      items.push(item);

      // If user wants to save to root folder on disk (only in local dev server), convert to base64
      if (saveToFolderOnDisk && import.meta.env.DEV) {
        try {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          serverPayloadFiles.push({ filename: file.name, base64 });
        } catch (e) {
          console.warn('Failed to encode file for server folder', file.name, e);
        }
      }

      setProcessedCount(i + 1);
    }

    // Call onAddReferences
    await onAddReferences(items, false);

    // If uploading to disk folder in local dev environment, send to ./api/upload-to-folder
    if (saveToFolderOnDisk && import.meta.env.DEV && serverPayloadFiles.length > 0) {
      try {
        const res = await fetch('./api/upload-to-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: serverPayloadFiles }),
        });
        if (res.ok) {
          setStatusMessage(`Успешно добавлено ${items.length} фото (сохранено в корневую папку references!)`);
        } else {
          setStatusMessage(`Успешно добавлено ${items.length} фото в браузер.`);
        }
      } catch {
        setStatusMessage(`Успешно добавлено ${items.length} фото в локальную память.`);
      }
    } else {
      setStatusMessage(`Успешно добавлено ${items.length} фото в коллекцию браузера.`);
    }

    setRecentUploads(prev => [...items.slice(0, 8), ...prev]);
    setIsProcessing(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#FAF9F5] dark:bg-stone-900 border border-stone-300/80 dark:border-stone-800 rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto text-stone-900 dark:text-stone-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 className="font-serif-display text-xl font-semibold text-stone-900 dark:text-stone-100">
              Пакетная загрузка референсов
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 font-sans-body mt-0.5">
              Загрузите десятки или сотни фото разом для моментальной генерации
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Закрыть модальное окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`mt-5 border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            isDragging
              ? 'border-stone-900 dark:border-stone-100 bg-stone-100/80 dark:bg-stone-800/80 scale-[1.01]'
              : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 bg-white/60 dark:bg-stone-950/50'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200 mb-3 shadow-2xs">
            <Upload className="w-6 h-6" />
          </div>

          <p className="text-sm font-medium text-stone-800 dark:text-stone-200 mb-1">
            Перетащите сюда пакет фотографий или целую папку
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-5 max-w-xs">
            Поддерживаются JPG, PNG, WEBP, AVIF. Можно выбрать 50, 100 и более файлов сразу.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 text-xs font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors shadow-2xs cursor-pointer"
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>Выбрать файлы (пакет)</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-medium rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Выбрать всю папку целиком</span>
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is standard in modern browsers
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Options */}
        <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-col gap-2.5 text-xs text-stone-600 dark:text-stone-400">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveToFolderOnDisk}
              onChange={e => setSaveToFolderOnDisk(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 dark:border-stone-700 text-stone-900 focus:ring-stone-500"
            />
            <span className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
              <HardDrive className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
              Копировать файлы в корневую папку сайта{' '}
              <code className="text-stone-700 dark:text-stone-200 bg-stone-200/60 dark:bg-stone-800 px-1 py-0.5 rounded font-mono text-[11px]">
                public/references
              </code>
            </span>
          </label>

          <div className="p-3 bg-stone-100/80 dark:bg-stone-950/60 rounded-xl text-stone-600 dark:text-stone-400 leading-relaxed text-[11px] border border-stone-200/60 dark:border-stone-800">
            <span className="font-semibold text-stone-800 dark:text-stone-200">Совет для художников: </span>
            Вы можете один раз положить любые файлы прямо в папку{' '}
            <code className="font-mono bg-white dark:bg-stone-900 px-1 py-0.5 rounded text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700">
              references/
            </code>{' '}
            в корне проекта. Они будут всегда отображаться автоматически без повторной выгрузки!
          </div>
        </div>

        {/* Progress indicator */}
        {isProcessing && (
          <div className="mt-4 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 mb-1.5">
              <span>Обработка фотографий...</span>
              <span className="tabular-nums font-mono">
                {processedCount} / {totalToProcess}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-900 dark:bg-stone-100 transition-all duration-150"
                style={{ width: `${(processedCount / totalToProcess) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-3 p-2.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg flex items-center gap-2 text-xs text-stone-800 dark:text-stone-200">
            <Check className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Done button */}
        <div className="mt-5 pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950 text-xs font-medium rounded-lg hover:bg-stone-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
