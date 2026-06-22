'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { saveResult, getCoefficient } from '@/lib/session';

/**
 * Аномалоскоп (экранная модель, формат 2AFC).
 * Верхняя половина — эталонный жёлтый (hue 60). Нижняя — оттенок от зелёного
 * (120) до красного (0) через жёлтый (60). На каждом шаге пользователь отвечает
 * «совпадает / не совпадает».
 *
 * Норма: «совпадает» только около истинного жёлтого (узкий диапазон).
 * Protan/deutan путают красно-зелёное → принимают более широкий диапазон
 * как совпадающий, со сдвигом середины (диагностический признак).
 */

// ratio: 0 = зелёный, 50 = жёлтый, 100 = красный. hue = 120*(1 - ratio/100).
const RATIOS = [30, 38, 44, 48, 50, 52, 56, 62, 70];

export default function AnomaloscoreTest() {
  const [coefficient, setCoefficient] = useState(1);
  const [order, setOrder] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const [matches, setMatches] = useState<number[]>([]); // ratios, отмеченные как «совпадает»
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCoefficient(getCoefficient());
    // случайный порядок предъявления
    const idx = [...RATIOS];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    setOrder(idx);
  }, []);

  const sat = Math.max(0, Math.min(100, 70 * coefficient));
  const yellow = `hsl(60, ${sat}%, 50%)`;
  const currentRatio = order[step];
  const mixHue = currentRatio !== undefined ? 120 * (1 - currentRatio / 100) : 60;
  const mix = `hsl(${mixHue.toFixed(0)}, ${sat}%, 50%)`;

  const answer = (isMatch: boolean) => {
    const newMatches = isMatch ? [...matches, currentRatio] : matches;
    if (isMatch) setMatches(newMatches);

    if (step === order.length - 1) {
      finish(newMatches);
    } else {
      setStep(step + 1);
    }
  };

  const finish = (matched: number[]) => {
    let midpoint = 50;
    let range = 0;
    if (matched.length > 0) {
      midpoint = Math.round(matched.reduce((a, b) => a + b, 0) / matched.length);
      range = Math.max(...matched) - Math.min(...matched);
    }
    const deviation = midpoint - 50;
    saveResult('anomaloscope', {
      matchedCount: matched.length,
      matchingRange: range,
      midpoint,
      deviation,
      matchedRatios: matched,
    });
    setDone(true);
  };

  // итоговая интерпретация
  const matched = matches;
  const midpoint = matched.length ? Math.round(matched.reduce((a, b) => a + b, 0) / matched.length) : 50;
  const range = matched.length ? Math.max(...matched) - Math.min(...matched) : 0;
  const deviation = midpoint - 50;
  const interpretation =
    range <= 8 && Math.abs(deviation) <= 6
      ? 'Узкий диапазон совпадения — норма'
      : deviation > 6
        ? 'Диапазон смещён к красному — возможна протан-аномалия'
        : deviation < -6
          ? 'Диапазон смещён к зелёному — возможна дейтан-аномалия'
          : 'Широкий диапазон совпадения — снижено цветоразличение';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">Аномалоскоп</h1>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-xl mx-auto">
          {!done ? (
            <div className="card">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-semibold">
                    Сравнение {step + 1} из {order.length}
                  </span>
                  <span>{Math.round((step / order.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(step / order.length) * 100}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-6 text-center">
                Верхняя и нижняя половины — <strong>один и тот же цвет</strong>?
              </p>

              <div
                className="mx-auto mb-8 rounded-full overflow-hidden border-4 border-gray-300"
                style={{ width: 220, height: 220 }}
              >
                <div style={{ height: '50%', background: yellow }} />
                <div style={{ height: '50%', background: mix }} />
              </div>

              <div className="flex gap-4">
                <button onClick={() => answer(false)} className="btn-secondary flex-1">
                  Не совпадает
                </button>
                <button onClick={() => answer(true)} className="btn-primary flex-1">
                  Совпадает
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-center">✓ Все 4 теста завершены!</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-gray-700 mb-1">
                  Середина диапазона: <strong>{midpoint}/100</strong>, ширина: <strong>{range}</strong>
                </p>
                <p className="text-sm text-gray-600">{interpretation}</p>
              </div>
              <Link href="/results" className="block btn-primary text-center mb-3">
                Посмотреть итоговые результаты →
              </Link>
              <Link href="/" className="block btn-secondary text-center">
                На главную
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
