'use client';

import { useEffect, useRef } from 'react';

/**
 * Симуляция цветового восприятия.
 * Рисует одинаковую сцену (цветные образцы + радужная полоса) и применяет
 * матрицу преобразования для соответствующего типа дальтонизма.
 *
 * Матрицы — общепринятые sRGB-приближения (Vischeck/Brettel) для визуализации.
 */

export type DeficiencyType = 'normal' | 'protan' | 'deutan' | 'tritan';

const MATRICES: Record<Exclude<DeficiencyType, 'normal'>, number[][]> = {
  protan: [
    [0.567, 0.433, 0.0],
    [0.558, 0.442, 0.0],
    [0.0, 0.242, 0.758],
  ],
  deutan: [
    [0.625, 0.375, 0.0],
    [0.7, 0.3, 0.0],
    [0.0, 0.3, 0.7],
  ],
  tritan: [
    [0.95, 0.05, 0.0],
    [0.0, 0.433, 0.567],
    [0.0, 0.475, 0.525],
  ],
};

// Образцы повседневных цветов, которые путаются при дальтонизме.
const SWATCHES = [
  '#E53935', // красный
  '#FB8C00', // оранжевый
  '#FDD835', // жёлтый
  '#43A047', // зелёный
  '#1E88E5', // синий
  '#8E24AA', // фиолетовый
  '#6D4C41', // коричневый
  '#EC407A', // розовый
];

function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Радужная полоса
  const barH = h * 0.4;
  for (let x = 0; x < w; x++) {
    ctx.fillStyle = `hsl(${Math.round((x / w) * 360)}, 70%, 50%)`;
    ctx.fillRect(x, 0, 1, barH);
  }
  // Образцы
  const cols = 4;
  const rows = 2;
  const pad = 6;
  const cellW = (w - pad * (cols + 1)) / cols;
  const cellH = (h - barH - pad * (rows + 1)) / rows;
  SWATCHES.forEach((c, i) => {
    const cx = pad + (i % cols) * (cellW + pad);
    const cy = barH + pad + Math.floor(i / cols) * (cellH + pad);
    ctx.fillStyle = c;
    ctx.fillRect(cx, cy, cellW, cellH);
  });
}

function applyMatrix(ctx: CanvasRenderingContext2D, w: number, h: number, m: number[][]) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    d[i] = Math.min(255, Math.max(0, m[0][0] * r + m[0][1] * g + m[0][2] * b));
    d[i + 1] = Math.min(255, Math.max(0, m[1][0] * r + m[1][1] * g + m[1][2] * b));
    d[i + 2] = Math.min(255, Math.max(0, m[2][0] * r + m[2][1] * g + m[2][2] * b));
  }
  ctx.putImageData(img, 0, 0);
}

export default function ColorBlindSimulation({
  type,
  width = 300,
  height = 180,
}: {
  type: DeficiencyType;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    drawScene(ctx, width, height);
    if (type !== 'normal') applyMatrix(ctx, width, height, MATRICES[type]);
  }, [type, width, height]);

  return <canvas ref={ref} className="rounded-lg border border-gray-200 w-full" />;
}
