'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Аномалоскоп (упрощённая модель Нагеля).
 * Верхняя половина — эталонный жёлтый (регулируется яркость).
 * Нижняя половина — смесь красного и зелёного (регулируется соотношение).
 * Пользователь добивается визуального совпадения половин.
 * Точка совпадения по красно-зелёному соотношению указывает на тип аномалии.
 */
export default function AnomaloscoreTest() {
  const [redGreen, setRedGreen] = useState(50); // 0 = чистый зелёный, 100 = чистый красный
  const [yellow, setYellow] = useState(60); // яркость эталонного жёлтого
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substring(2, 11).toUpperCase());
  }, []);

  // Смесь красного и зелёного: при 50/50 нормальный наблюдатель видит жёлтый.
  const r = Math.round(255 * (redGreen / 100));
  const g = Math.round(255 * (1 - redGreen / 100));
  const mixColor = `rgb(${r}, ${g}, 0)`;
  const yellowColor = `rgb(${Math.round(255 * (yellow / 100))}, ${Math.round(255 * (yellow / 100))}, 0)`;

  const handleComplete = () => {
    // Отклонение точки совпадения от нормы (50). Сдвиг к красному → protan,
    // к зелёному → deutan (упрощённо).
    const deviation = redGreen - 50;
    localStorage.setItem(
      `test_${sessionId}`,
      JSON.stringify({
        testType: 'anomaloscope',
        sessionId,
        matchPoint: redGreen,
        yellowBrightness: yellow,
        deviation,
        timestamp: new Date().toISOString(),
      })
    );
    setDone(true);
  };

  const deviation = redGreen - 50;
  const interpretation =
    Math.abs(deviation) <= 8
      ? 'Точка совпадения в норме'
      : deviation > 8
        ? 'Сдвиг к красному — возможна протан-аномалия'
        : 'Сдвиг к зелёному — возможна дейтан-аномалия';

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
              <p className="text-sm text-gray-600 mb-6">
                Настройте ползунки так, чтобы <strong>верхняя и нижняя половины круга
                стали одного цвета</strong> (слились в единый жёлтый).
              </p>

              {/* Разделённый круг */}
              <div
                className="mx-auto mb-8 rounded-full overflow-hidden border-4 border-gray-300"
                style={{ width: 240, height: 240 }}
              >
                <div style={{ height: '50%', background: yellowColor }} />
                <div style={{ height: '50%', background: mixColor }} />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Нижняя половина: красный ↔ зелёный
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={redGreen}
                  onChange={(e) => setRedGreen(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Зелёный</span>
                  <span>Красный</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-2">
                  Верхняя половина: яркость жёлтого
                </label>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={yellow}
                  onChange={(e) => setYellow(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <button onClick={handleComplete} className="w-full btn-primary">
                Половины совпали — завершить →
              </button>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-center">✓ Все 4 теста завершены!</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-gray-700 mb-2">
                  Точка совпадения: <strong>{redGreen}/100</strong> (отклонение {deviation > 0 ? '+' : ''}
                  {deviation})
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
