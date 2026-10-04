'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  Crop as CropIcon, 
  Move
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const CROP_BOX_SIZE = 260; // diameter of crop circle (px)

  // Load image when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute base scaling so image covers the circular crop window
  const getRenderMetrics = useCallback(() => {
    if (!image) return { baseScale: 1, currentScale: 1, imgW: 100, imgH: 100 };

    const isFlipped = rotation === 90 || rotation === 270;
    const naturalW = isFlipped ? image.naturalHeight : image.naturalWidth;
    const naturalH = isFlipped ? image.naturalWidth : image.naturalHeight;

    const baseScale = Math.max(CROP_BOX_SIZE / naturalW, CROP_BOX_SIZE / naturalH);
    const currentScale = baseScale * zoom;

    return {
      baseScale,
      currentScale,
      imgW: image.naturalWidth * currentScale,
      imgH: image.naturalHeight * currentScale,
    };
  }, [image, zoom, rotation]);

  // Clamping offset so image doesn't slide completely out of view
  const clampPosition = useCallback((x: number, y: number, currentScale: number) => {
    if (!image) return { x, y };

    const isFlipped = rotation === 90 || rotation === 270;
    const effectiveW = (isFlipped ? image.naturalHeight : image.naturalWidth) * currentScale;
    const effectiveH = (isFlipped ? image.naturalWidth : image.naturalHeight) * currentScale;

    const maxX = Math.max(0, (effectiveW - CROP_BOX_SIZE) / 2);
    const maxY = Math.max(0, (effectiveH - CROP_BOX_SIZE) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, [image, rotation]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const { currentScale } = getRenderMetrics();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPosition(clampPosition(newX, newY, currentScale));
  }, [isDragging, getRenderMetrics, clampPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch drag handlers (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const { currentScale } = getRenderMetrics();
    const newX = e.touches[0].clientX - dragStartRef.current.x;
    const newY = e.touches[0].clientY - dragStartRef.current.y;
    setPosition(clampPosition(newX, newY, currentScale));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(1, Math.min(3, Number((z + delta).toFixed(2)))));
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Rotate 90 deg clockwise
  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
    setPosition({ x: 0, y: 0 }); // reset pan on rotation to keep center
  };

  // Apply Crop and generate clean ~256x256 image data URL
  const handleSaveCrop = () => {
    if (!image) return;

    const exportSize = 256; // output resolution
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Ratio between output size and UI crop box
    const ratio = exportSize / CROP_BOX_SIZE;
    const { currentScale } = getRenderMetrics();

    ctx.save();

    // 1. Move to center of canvas
    ctx.translate(exportSize / 2, exportSize / 2);

    // 2. Rotate if needed
    ctx.rotate((rotation * Math.PI) / 180);

    // 3. Apply pan offset (taking rotation into account)
    let panX = position.x * ratio;
    let panY = position.y * ratio;
    if (rotation === 90) {
      const temp = panX;
      panX = panY;
      panY = -temp;
    } else if (rotation === 180) {
      panX = -panX;
      panY = -panY;
    } else if (rotation === 270) {
      const temp = panX;
      panX = -panY;
      panY = temp;
    }

    ctx.translate(panX, panY);

    // 4. Draw image centered
    const drawW = image.naturalWidth * currentScale * ratio;
    const drawH = image.naturalHeight * currentScale * ratio;
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // Output JPEG data URL (quality 0.88 for crisp yet lightweight avatar)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCropComplete(dataUrl);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  const { currentScale } = getRenderMetrics();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-[#090d16] border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4 self-start">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CropIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Crop Profile Picture</h3>
            <p className="text-[11px] text-slate-400">Drag to reposition, slider to zoom</p>
          </div>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-inner"
        >
          {/* Image Layer */}
          {image && (
            <div
              className="absolute pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${currentScale})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none select-none pointer-events-none"
                draggable={false}
              />
            </div>
          )}

          {/* Vignette Overlay (Dark outside circle) */}
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 300 300">
              <defs>
                <mask id="crop-circle-mask">
                  {/* Fill entire canvas white */}
                  <rect width="300" height="300" fill="white" />
                  {/* Cut out center circle */}
                  <circle cx="150" cy="150" r={CROP_BOX_SIZE / 2} fill="black" />
                </mask>
              </defs>
              {/* Dark shading mask */}
              <rect width="300" height="300" fill="rgba(0, 0, 0, 0.72)" mask="url(#crop-circle-mask)" />
              {/* Circular guide border */}
              <circle
                cx="150"
                cy="150"
                r={CROP_BOX_SIZE / 2}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-80"
              />
            </svg>
          </div>

          {/* Hint Overlay */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-[10px] text-slate-300 font-medium flex items-center gap-1 pointer-events-none">
            <Move className="w-3 h-3 text-emerald-400" />
            <span>Drag to adjust</span>
          </div>
        </div>

        {/* Controls: Zoom slider & Rotate */}
        <div className="w-full mt-4 space-y-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
              className="text-slate-400 hover:text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              className="text-slate-400 hover:text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-emerald-400 min-w-[32px] text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Secondary Controls: Rotate & Reset */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleRotate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rotate 90°</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
              }}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="w-full mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Apply Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
