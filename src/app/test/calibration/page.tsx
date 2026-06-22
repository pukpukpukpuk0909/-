'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startSession, CalibrationData } from '@/lib/session';

/**
 * Калибровка дисплея (auto + user-in-the-loop).
 * 1. Автоопределение цветового охвата, плотности пикселей, разрешения.
 * 2. Оценка гаммы экрана: пользователь выбирает серый, совпадающий по яркости
 *    с чёрно-белыми полосками (их линейная яркость = 50%). Совпавший серый
 *    задаёт гамму экрана → калибровочный коэффициент, применяемый ко всем тестам.
 */

// Полоски черный/белый -> средняя линейная яркость ~0.5.
function StripePatch({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = size;
    c.height = size;
    for (let y = 0; y < size; y++) {
      ctx.fillStyle = y % 2 === 0 ? '#000' : '#fff';
      ctx.fillRect(0, y, size, 1);
    }
  }, [size]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="rounded" />;
}

// Кандидаты серого: значения 0..255, по которым оцениваем гамму.
const GRAY_OPTIONS = [128, 150, 170, 186, 200, 215];

export default function CalibrationPage() {
  const router = useRouter();
  const [auto, setAuto] = useState({ gamut: 'sRGB', dpr: 1, resolution: '' });

  useEffect(() => {
    const gamut = window.matchMedia('(color-gamut: rec2020)').matches
      ? 'Rec.2020'
      : window.matchMedia('(color-gamut: p3)').matches
        ? 'Display P3'
        : 'sRGB';
    setAuto({
      gamut,
      dpr: window.devicePixelRatio || 1,
      resolution: `${window.screen.width}×${window.screen.height}`,
    });
  }, []);

  const finish = (grayValue: number) => {
    // (v/255)^gamma = 0.5  =>  gamma = ln(0.5)/ln(v/255)
    const gamma = Math.log(0.5) / Math.log(grayValue / 255);
    // Коррекция насыщенности: отклонение гаммы от эталона 2.2.
    const coefficient = Math.max(0.85, Math.min(1.15, 1 + (gamma - 2.2) * 0.08));

    const calibration: CalibrationData = {
      gamut: auto.gamut,
      dpr: auto.dpr,
      resolution: auto.resolution,
      gamma: Math.round(gamma * 100) / 100,
      coefficient: Math.round(coefficient * 1000) / 1000,
    };
    startSession(calibration); // новая сессия: чистим старые данные
    router.push('/test/ishihara');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white py-10">
      <div className="max-w-xl w-full px-6">
        <h1 className="text-2xl font-bold mb-2 text-center">Калибровка дисплея</h1>
        <p className="text-slate-300 text-sm text-center mb-6">
          Параметры экрана определены автоматически. Осталось оценить яркостную
          характеристику (гамму) — это нужно для корректного отображения цветов теста.
        </p>

        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-8">
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-400">Охват</div>
            <div className="font-semibold">{auto.gamut}</div>
          </div>
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-400">Плотность</div>
            <div className="font-semibold">{auto.dpr}×</div>
          </div>
          <div className="bg-slate-800 rounded p-2">
            <div className="text-slate-400">Экран</div>
            <div className="font-semibold">{auto.resolution}</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <p className="text-sm text-center mb-4">
            Отойдите/прищурьтесь так, чтобы полоски слились в сплошной серый.
            <br />
            Нажмите на <strong>тот серый квадрат справа</strong>, который выглядит
            одинаково ярко с полосками.
          </p>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <StripePatch size={96} />
              <div className="text-xs text-slate-400 mt-1">полоски</div>
            </div>
            <div className="text-2xl text-slate-500">=</div>
            <div className="grid grid-cols-3 gap-2">
              {GRAY_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => finish(v)}
                  style={{ background: `rgb(${v},${v},${v})`, width: 56, height: 56 }}
                  className="rounded border border-slate-600 hover:ring-2 hover:ring-orange-500"
                  aria-label={`серый ${v}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => finish(186)}
            className="w-full text-sm text-slate-300 underline hover:text-white"
          >
            Не могу определить — использовать стандарт (sRGB, γ≈2.2)
          </button>
        </div>
      </div>
    </div>
  );
}
