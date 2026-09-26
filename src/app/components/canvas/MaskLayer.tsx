import { useEffect, useRef } from 'react';
import { registerMaskCanvas, useWorkspace } from '../../stores/workspace';

export type MaskTool = 'brush' | 'eraser';

/**
 * Paintable selection over the image. The canvas has the image's natural
 * resolution (so the mask maps 1:1 to pixels) and is stretched over it by CSS.
 */
export function MaskLayer({
  width,
  height,
  tool,
  brushSize,
  clearSignal,
}: {
  width: number;
  height: number;
  tool: MaskTool;
  /** Brush diameter as a fraction of the image width. */
  brushSize: number;
  clearSignal: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const setHasMask = useWorkspace((s) => s.setHasMask);

  useEffect(() => {
    registerMaskCanvas(ref.current);
    return () => registerMaskCanvas(null);
  }, []);

  useEffect(() => {
    ref.current?.getContext('2d')?.clearRect(0, 0, width, height);
    setHasMask(false);
  }, [clearSignal, width, height, setHasMask]);

  function point(e: React.PointerEvent) {
    const rect = ref.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * width, y: ((e.clientY - rect.top) / rect.height) * height };
  }

  function stroke(to: { x: number; y: number }) {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const from = last.current ?? to;
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = 'rgb(255 0 200)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize * width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
  }

  function hasPixels(): boolean {
    const ctx = ref.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;
    // Sample on a coarse grid; enough to know whether anything is painted.
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4 * 64) if (data[i] > 0) return true;
    return false;
  }

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className="absolute inset-0 size-full cursor-crosshair touch-none opacity-50"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drawing.current = true;
        last.current = null;
        stroke(point(e));
      }}
      onPointerMove={(e) => drawing.current && stroke(point(e))}
      onPointerUp={() => {
        drawing.current = false;
        last.current = null;
        setHasMask(hasPixels());
      }}
      onPointerCancel={() => {
        drawing.current = false;
      }}
    />
  );
}
