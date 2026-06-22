'use client';

import { useState } from 'react';
import Link from 'next/link';
import ColorArrangeTest from '@/components/ColorArrangeTest';
import { saveResult } from '@/lib/session';

export default function FarnsworthTest() {
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ errorScore: number; perfect: number } | null>(null);

  const handleComplete = (r: { errorScore: number; perfect: number; arrangement: number[] }) => {
    setResult(r);
    saveResult('farnsworth', {
      errorScore: r.errorScore,
      perfect: r.perfect,
      arrangement: r.arrangement,
    });
    setDone(true);
  };

  // Чем ближе errorScore к perfect (capCount), тем лучше.
  const quality = result
    ? result.errorScore <= result.perfect + 4
      ? 'Норма — цвета упорядочены правильно'
      : result.errorScore <= result.perfect + 12
        ? 'Лёгкие ошибки расположения'
        : 'Выраженные ошибки — характерно для дефицита цветового зрения'
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">Тест Фарнсворта D-15</h1>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-2xl mx-auto">
          {!done ? (
            <ColorArrangeTest
              capCount={12}
              hueStart={0}
              hueEnd={260}
              title="Соберите плавный переход цвета"
              onComplete={handleComplete}
            />
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-center">✓ Тест Фарнсворта завершён</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-gray-700 mb-2">
                  Ошибок расположения: <strong>{result && result.errorScore - result.perfect}</strong>
                </p>
                <p className="text-sm text-gray-600">{quality}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
                <strong>Дальше:</strong> FM 100 Hue Test определит <strong>степень тяжести</strong>.
              </div>
              <Link href="/test/fm100" className="block btn-primary text-center mb-3">
                Перейти к тесту 3/4 →
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
