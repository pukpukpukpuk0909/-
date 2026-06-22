'use client';

import { useState } from 'react';
import Link from 'next/link';
import ColorArrangeTest from '@/components/ColorArrangeTest';
import { saveResult } from '@/lib/session';

export default function FM100Test() {
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ errorScore: number; perfect: number } | null>(null);

  const handleComplete = (r: { errorScore: number; perfect: number; arrangement: number[] }) => {
    setResult(r);
    saveResult('fm100', {
      errorScore: r.errorScore,
      perfect: r.perfect,
      arrangement: r.arrangement,
    });
    setDone(true);
  };

  const severity = result
    ? result.errorScore - result.perfect <= 16
      ? 'Высокая точность различения оттенков'
      : result.errorScore - result.perfect <= 40
        ? 'Умеренное снижение цветоразличения'
        : 'Значительное снижение цветоразличения'
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">FM 100 Hue Test</h1>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-3xl mx-auto">
          {!done ? (
            <ColorArrangeTest
              capCount={16}
              hueStart={20}
              hueEnd={320}
              title="Соберите плавный переход цвета (16 фишек)"
              onComplete={handleComplete}
            />
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-center">✓ FM 100 Hue Test завершён</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-gray-700 mb-2">
                  Итоговая ошибка (TES): <strong>{result && result.errorScore - result.perfect}</strong>
                </p>
                <p className="text-sm text-gray-600">{severity}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
                <strong>Дальше:</strong> Аномалоскоп даст <strong>точные численные значения</strong>.
              </div>
              <Link href="/test/anomaloscope" className="block btn-primary text-center mb-3">
                Перейти к тесту 4/4 →
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
