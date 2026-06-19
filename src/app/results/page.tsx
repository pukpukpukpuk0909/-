'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TestResult {
  testType: string;
  sessionId: string;
  timestamp: string;
  [key: string]: any;
}

export default function Results() {
  const [results, setResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // Load all results from localStorage
    const allResults: TestResult[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('test_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            allResults.push(JSON.parse(item));
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }
    setResults(allResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  }, []);

  const getTestName = (type: string) => {
    const names: Record<string, string> = {
      ishihara: 'Тест Ишихары',
      farnsworth: 'Тест Фарнсворта D-15',
      fm100: 'FM 100 Hue Test',
      anomaloscope: 'Аномалоскоп',
    };
    return names[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Вернуться на главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">История результатов</h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {results.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 mb-6">Нет сохранённых результатов</p>
              <Link href="/" className="btn-primary inline-block">
                Пройти тест
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.sessionId} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {getTestName(result.testType)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(result.timestamp).toLocaleString('ru-RU')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: {result.sessionId}
                      </p>
                    </div>
                    <div className="text-right">
                      {result.accuracy && (
                        <div className="text-2xl font-bold text-orange-500">
                          {result.accuracy}%
                        </div>
                      )}
                      {result.score !== undefined && (
                        <div className="text-2xl font-bold text-blue-500">
                          {result.score} ошибок
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
