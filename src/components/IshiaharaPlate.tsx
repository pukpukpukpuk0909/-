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

// Несколько цветовых сочетаний (фигура / фон). Для НОРМАЛЬНОГО зрения
// фигура чётко контрастна по оттенку, при дальтонизме — сливается.
// Каждая пара использует разные цвета, чтобы пластины были разнообразными.
const PALETTE_PAIRS: Array<{ fig: string[]; bg: string[] }> = [
  // оранжевый / зелёный
  {
    fig: ['#E8642A', '#F07A33', '#D9551F', '#F28B4B', '#FF8C42'],
    bg: ['#5C9A4A', '#6FB05A', '#4F8C3E', '#7FBD68', '#86C46F'],
  },
  // розовый / оливковый
  {
    fig: ['#E0588F', '#EC74A4', '#D14A80', '#F28BB8'],
    bg: ['#8C9A5A', '#9CA96A', '#7C8A4E', '#A8B478'],
  },
  // фиолетовый / синий
  {
    fig: ['#A24FD0', '#B568E0', '#9440C0', '#C885EC'],
    bg: ['#4F90C9', '#5FA0D8', '#4080B8', '#7FB8E0'],
  },
  // красный / серо-зелёный
  {
    fig: ['#D84038', '#E85A4F', '#C73028', '#F0726A'],
    bg: ['#7E9486', '#8EA496', '#6E8476', '#A0B4A6'],
  },
  // зелёный / песочный (обратное сочетание)
  {
    fig: ['#4F9A3E', '#5FB04E', '#3F8C30', '#6FBD5E'],
    bg: ['#C99A6A', '#D8AA7A', '#B88A5A', '#E0B888'],
  },
];

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

    // Выбираем цветовую пару по seed — у каждой пластины своё сочетание.
    const pair = PALETTE_PAIRS[seed % PALETTE_PAIRS.length];
    const FIGURE_COLORS = pair.fig;
    const BG_COLORS = pair.bg;

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
    mctx.font = `900 ${size * 0.66}px Arial, sans-serif`;
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
    const cell = 9;
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

    const maxAttempts = 40000;
    for (let i = 0; i < maxAttempts && placed.length < 5000; i++) {
      // случайная точка внутри большого круга
      const ang = rng() * Math.PI * 2;
      const rad = Math.sqrt(rng()) * R;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      const r = 1.8 + rng() * 3.6;

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
