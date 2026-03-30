"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const WorldMap = dynamic(() => import("@/components/marketing/WorldMap"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[400px] animate-pulse rounded-2xl bg-neutral-100"
      aria-hidden
    />
  ),
});

const skeleton = (
  <div
    className="min-h-[400px] animate-pulse rounded-2xl bg-neutral-100"
    aria-hidden
  />
);

/**
 * Loads the map chunk and GeoJSON only when the section is near the viewport.
 */
export default function WorldMapDeferred() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "200px", threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? <WorldMap /> : skeleton}
    </div>
  );
}
