'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FarnsworthTest() {
  const [currentStep, setCurrentStep] = useState(0);
  const [testComplete, setTestComplete] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(Math.random().toString(36).substr(2, 9));
  }, []);

  const steps = [
    'Расположите цветные диски в порядке возрастания оттенка',
    'Начните с самого тёмного цвета',
    'Заканчивайте самым светлым цветом',
    'Потратьте 5-10 минут на организацию',
  ];

  const handleComplete = () => {
    localStorage.setItem(`test_${sessionId}`, JSON.stringify({
      testType: 'farnsworth',
      sessionId,
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
          <h1 className="text-2xl font-bold text-gradient">Тест Фарнсворта D-15</h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {!testComplete ? (
            <div className="card">
              <h2 className="text-xl font-bold mb-6">Инструкции теста</h2>
              <div className="space-y-6">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-2 ${
                      idx === currentStep
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-white ${
                          idx === currentStep ? 'bg-orange-500' : 'bg-gray-400'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{step}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm mb-4">
                  💡 <strong>Совет:</strong> Используйте естественное освещение и избегайте теней при проведении теста.
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="btn-secondary flex-1"
                  >
                    ← Назад
                  </button>
                )}
                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="btn-primary flex-1"
                  >
                    Далее →
                  </button>
                ) : (
                  <button onClick={handleComplete} className="btn-primary flex-1">
                    Завершить тест
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center">
              <h2 className="text-2xl font-bold mb-4">✓ Тест завершён</h2>
              <p className="text-gray-600 mb-6">Результаты сохранены</p>
              <Link href="/" className="btn-primary inline-block">
                На главную
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
