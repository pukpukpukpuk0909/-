'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AnomaloscoreTest() {
  const [redValue, setRedValue] = useState(50);
  const [greenValue, setGreenValue] = useState(50);
  const [testComplete, setTestComplete] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substr(2, 9));
  }, []);

  const handleComplete = () => {
    localStorage.setItem(`test_${sessionId}`, JSON.stringify({
      testType: 'anomaloscope',
      sessionId,
      redValue,
      greenValue,
      timestamp: new Date().toISOString(),
    }));
    setTestComplete(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Вернуться на главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">Аномалоскоп</h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            {!testComplete ? (
              <div>
                <h2 className="text-xl font-bold mb-6">Калибровка красно-зелёного баланса</h2>

                <div className="mb-8">
                  <div className="h-40 rounded-lg border-4 border-gray-300 flex items-center justify-center mb-4" style={{
                    background: `linear-gradient(to right, rgb(255, ${255 - greenValue * 2}, 0), rgb(${255 - redValue * 2}, 255, 0))`
                  }}>
                    <div className="text-white text-center">
                      <p className="font-bold text-lg">Сопоставьте цвета</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Красный {redValue}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={redValue}
                      onChange={(e) => setRedValue(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Зелёный {greenValue}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={greenValue}
                      onChange={(e) => setGreenValue(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 p-4 bg-gray-50 rounded-lg">
                  Отрегулируйте ползунки так, чтобы верхняя и нижняя половины цветов совпадали по оттенку.
                </p>

                <button onClick={handleComplete} className="w-full btn-primary">
                  Завершить тест
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">✓ Тест завершён</h2>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-green-800 mb-2">Ваши значения:</p>
                  <p className="text-sm text-green-700">
                    Красный: {redValue}% | Зелёный: {greenValue}%
                  </p>
                </div>
                <Link href="/" className="btn-primary inline-block">
                  На главную
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
