import { useEffect, useRef, useState } from 'react';

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Largest box with the given aspect ratio that fits inside the container. */
export function fit(aspect: number, box: { width: number; height: number }) {
  if (!box.width || !box.height) return { width: 0, height: 0 };
  const width = Math.min(box.width, box.height * aspect);
  return { width, height: width / aspect };
}
