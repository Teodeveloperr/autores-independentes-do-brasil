"use client";

import { useRef, useState } from "react";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function BannerPositioner({
  url,
  positionX,
  positionY,
  onChange,
  aspectRatio = "1200 / 260",
}: {
  url: string;
  positionX: number;
  positionY: number;
  onChange: (x: number, y: number) => void;
  aspectRatio?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  function handleLoad() {
    const img = imgRef.current;
    if (img) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }

  function getMaxOffsets() {
    const container = containerRef.current;
    if (!container || !natural) return { maxX: 0, maxY: 0, renderedW: 0, renderedH: 0 };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.max(cw / natural.w, ch / natural.h);
    const renderedW = natural.w * scale;
    const renderedH = natural.h * scale;
    return { maxX: Math.max(0, renderedW - cw), maxY: Math.max(0, renderedH - ch), renderedW, renderedH };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!natural) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: positionX, posY: positionY };
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const { maxX, maxY } = getMaxOffsets();
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    const startLeft = maxX > 0 ? -(dragStart.current.posX / 100) * maxX : 0;
    const startTop = maxY > 0 ? -(dragStart.current.posY / 100) * maxY : 0;

    const newLeft = clamp(startLeft + deltaX, -maxX, 0);
    const newTop = clamp(startTop + deltaY, -maxY, 0);

    const newX = maxX > 0 ? (-newLeft / maxX) * 100 : 50;
    const newY = maxY > 0 ? (-newTop / maxY) * 100 : 50;

    onChange(Math.round(newX), Math.round(newY));
  }

  function onPointerUp() {
    setDragging(false);
    dragStart.current = null;
  }

  const { renderedW, renderedH, maxX, maxY } = getMaxOffsets();
  const left = maxX > 0 ? -(positionX / 100) * maxX : 0;
  const top = maxY > 0 ? -(positionY / 100) * maxY : 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio,
        borderRadius: "16px",
        overflow: "hidden",
        cursor: dragging ? "grabbing" : "grab",
        background: "#F6F6F6",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- precisa medir naturalWidth/naturalHeight e ser posicionada via drag; next/image nao serve aqui */}
      <img
        ref={imgRef}
        src={url}
        alt=""
        draggable={false}
        onLoad={handleLoad}
        style={{
          position: "absolute",
          left,
          top,
          width: renderedW || "100%",
          height: renderedH || "100%",
          maxWidth: "none",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
