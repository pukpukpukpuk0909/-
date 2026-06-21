'use client';

import { useEffect, useRef } from 'react';

/**
 * Реальный генератор псевдоизохроматических пластин Ишихары.
 *
 * Принцип (как в настоящем тесте):
 * - Большой круг заполняется сотнями цветных точек разного размера.
 * - Точки, попадающие внутрь контура цифры ("фигура"), окрашиваются в один
 *   цветовой ряд (оранжево-красный), фон — в другой (зелёно-оливковый).
 * - Человек с нормальным зрением видит цифру; при красно-зелёном дефиците
 *   фигура сливается с фоном.
 *
 * Цифра задаётся пропсом `number`. `seed` обеспечивает воспроизводимость
 * (одна и та же пластина не «дёргается» при ререндерах).
 */

interface Props {
  number: string;
  size?: number;
  seed?: number;
}

// Палитры подобраны так, чтобы для нормального зрения была чёткая
// оранжево-зелёная граница, а для protan/deutan — сливалась.
const FIGURE_COLORS = ['#D9714A', '#E08A5B', '#CB5A3C', '#E69A6B', '#D06840'];
const BG_COLORS = ['#9AA45E', '#B3B873', '#869150', '#C2C184', '#A7AC68', '#7E8A48'];

// Простой детерминированный ГПСЧ (mulberry32), чтобы пластина была стабильной.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function IshiaharaPlate({ number, size = 360, seed = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const rng = makeRng(seed * 2654435761 + number.charCodeAt(0));

    // 1. Маска цифры: рисуем число на оффскрин-канвасе и читаем пиксели.
    const mask = document.createElement('canvas');
    mask.width = size;
    mask.height = size;
    const mctx = mask.getContext('2d')!;
    mctx.fillStyle = '#000';
    mctx.fillRect(0, 0, size, size);
    mctx.fillStyle = '#fff';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'middle';
    mctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
    mctx.fillText(number, size / 2, size / 2 + size * 0.02);
    const maskData = mctx.getImageData(0, 0, size, size).data;

    const isInFigure = (x: number, y: number) => {
      const ix = Math.floor(x);
      const iy = Math.floor(y);
      if (ix < 0 || iy < 0 || ix >= size || iy >= size) return false;
      return maskData[(iy * size + ix) * 4] > 128; // красный канал маски
    };

    // 2. Фон пластины (бежевый, как картон).
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 2;

    // 3. Размещаем точки без сильного наложения (сетка-бакеты для скорости).
    const cell = 12;
    const grid = new Map<string, Array<[number, number, number]>>();
    const key = (gx: number, gy: number) => `${gx},${gy}`;
    const placed: Array<{ x: number; y: number; r: number; fig: boolean }> = [];

    const tooClose = (x: number, y: number, r: number) => {
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const arr = grid.get(key(gx + i, gy + j));
          if (!arr) continue;
          for (const [px, py, pr] of arr) {
            const dx = px - x;
            const dy = py - y;
            if (dx * dx + dy * dy < (r + pr + 1) * (r + pr + 1)) return true;
          }
        }
      }
      return false;
    };

    const maxAttempts = 16000;
    for (let i = 0; i < maxAttempts && placed.length < 2200; i++) {
      // случайная точка внутри большого круга
      const ang = rng() * Math.PI * 2;
      const rad = Math.sqrt(rng()) * R;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      const r = 2.5 + rng() * 5.5;

      if (Math.hypot(x - cx, y - cy) + r > R) continue;
      if (tooClose(x, y, r)) continue;

      const fig = isInFigure(x, y);
      placed.push({ x, y, r, fig });
      const gx = Math.floor(x / cell);
      const gy = Math.floor(y / cell);
      const k = key(gx, gy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k)!.push([x, y, r]);
    }

    // 4. Рисуем точки.
    for (const d of placed) {
      const palette = d.fig ? FIGURE_COLORS : BG_COLORS;
      const color = palette[Math.floor(rng() * palette.length)];
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }, [number, size, seed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#efe9dc',
        display: 'block',
        margin: '0 auto',
      }}
    />
  );
}
