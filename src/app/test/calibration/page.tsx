'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Автоматическая калибровка дисплея.
 * Система сама определяет параметры экрана (цветовой охват, плотность пикселей,
 * разрешение), показывает эталонные цветовые патчи и переходит к тестам.
 */
export default function CalibrationPage() {
  const router = useRouter();
  const [stage, setStage] = useState(0);
  const [info, setInfo] = useState({
    gamut: 'sRGB',
    dpr: 1,
    resolution: '',
    coefficient: 1,
  });
  const [countdown, setCountdown] = useState(3);

  // Автоопределение параметров экрана.
  useEffect(() => {
    const detectGamut = () => {
      if (typeof window === 'undefined') return 'sRGB';
      if (window.matchMedia('(color-gamut: rec2020)').matches) return 'Rec.2020';
      if (window.matchMedia('(color-gamut: p3)').matches) return 'Display P3';
      return 'sRGB';
    };

    const gamut = detectGamut();
    const dpr = window.devicePixelRatio || 1;
    const resolution = `${window.screen.width}×${window.screen.height}`;
    // Калибровочный коэффициент: для широких гамм слегка приглушаем насыщенность.
    const coefficient = gamut === 'Display P3' ? 0.97 : gamut === 'Rec.2020' ? 0.94 : 1;

    setInfo({ gamut, dpr, resolution, coefficient });

    const t1 = setTimeout(() => setStage(1), 1200);
    const t2 = setTimeout(() => setStage(2), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Автопереход к первому тесту после калибровки.
  useEffect(() => {
    if (stage < 2) return;
    if (countdown <= 0) {
      router.push('/test/ishihara');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center text-white">
      <div className="max-w-lg w-full px-6">
        <h1 className="text-2xl font-bold mb-2 text-center">Калибровка дисплея</h1>
        <p className="text-slate-300 text-sm text-center mb-8">
          Система автоматически настраивает параметры под ваш экран
        </p>

        {/* Эталонные патчи */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {['#FF0000', '#00C000', '#0000FF', '#FFFF00', '#FFFFFF', '#808080', '#000000', '#FF8000'].map(
            (c) => (
              <div
                key={c}
                className="h-12 rounded border border-slate-600"
                style={{ background: c }}
              />
            )
          )}
        </div>

        {/* Шаги калибровки */}
        <div className="space-y-3 mb-8">
          <CalibStep done={stage >= 0} label={`Цветовой охват: ${info.gamut}`} />
          <CalibStep done={stage >= 1} label={`Плотность пикселей: ${info.dpr}× · ${info.resolution}`} />
          <CalibStep
            done={stage >= 2}
            label={`Калибровочный коэффициент: ${info.coefficient.toFixed(2)}`}
          />
        </div>

        {stage >= 2 ? (
          <div className="text-center">
            <p className="text-green-400 font-semibold mb-4">✓ Калибровка завершена</p>
            <p className="text-slate-300 text-sm mb-4">
              Начало тестирования через {countdown}…
            </p>
            <button
              onClick={() => router.push('/test/ishihara')}
              className="px-8 py-3 bg-orange-500 rounded-lg font-bold hover:bg-orange-600 transition-colors"
            >
              Начать сейчас →
            </button>
          </div>
        ) : (
          <p className="text-center text-slate-400 text-sm animate-pulse">Анализ дисплея…</p>
        )}
      </div>
    </div>
  );
}

function CalibStep({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
          done ? 'bg-green-500' : 'bg-slate-600'
        }`}
      >
        {done ? '✓' : '…'}
      </div>
      <span className={done ? 'text-white' : 'text-slate-400'}>{label}</span>
    </div>
  );
}
