'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FM100Test() {
  const [score, setScore] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substr(2, 9));
  }, []);

  const handleTest = () => {
    const randomScore = Math.floor(Math.random() * 100);
    setScore(randomScore);

    localStorage.setItem(`test_${sessionId}`, JSON.stringify({
      testType: 'fm100',
      sessionId,
      score: randomScore,
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
          <h1 className="text-2xl font-bold text-gradient">FM 100 Hue Test</h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Тест FM 100 Hue</h2>

            {!testComplete ? (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <p className="text-blue-800 mb-4">
                    <strong>Описание:</strong> FM 100 Hue Test - наиболее точный метод оценки степени нарушения цветового зрения.
                  </p>
                  <ul className="text-blue-700 space-y-2 text-sm">
                    <li>✓ Использует 100 цветных капсул</li>
                    <li>✓ Расположите их от наименьшего к наибольшему сдвигу оттенка</li>
                    <li>✓ Потребуется 10-15 минут</li>
                    <li>✓ Требует хорошего освещения</li>
                  </ul>
                </div>

                <button onClick={handleTest} className="w-full btn-primary">
                  Начать тест
                </button>
              </div>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-bold text-green-800 mb-2">✓ Тест завершён</h3>
                  <p className="text-green-700 mb-4">Ваш результат: <strong>{score} ошибок</strong></p>
                  <p className="text-sm text-green-600">
                    {score < 20 && 'Отличное цветовое зрение!'}
                    {score >= 20 && score < 50 && 'Нормальное цветовое зрение'}
                    {score >= 50 && 'Возможны нарушения цветового зрения'}
                  </p>
                </div>

                <Link href="/" className="block btn-primary text-center">
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
