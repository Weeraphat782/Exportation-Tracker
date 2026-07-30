'use client';

interface PhotoBackgroundProps {
  url: string | null;
  focusX: number;
  focusY: number;
}

export function PhotoBackground({ url, focusX, focusY }: PhotoBackgroundProps) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: `${focusX}% ${focusY}%`,
        zIndex: 0,
      }}
    />
  );
}
