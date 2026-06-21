'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import IshiaharaPlate from '@/components/IshiaharaPlate';

// Набор различных цифр (без повторов в рамках одной сессии).
const NUMBER_POOL = ['12', '6', '29', '57', '8', '5', '3', '15', '74', '2', '45', '16', '42', '35', '96'];

interface Plate {
  number: string;
  seed: number;
}

function buildPlates(count: number): Plate[] {
  // Перемешиваем пул и берём первые `count` уникальных чисел.
  const pool = [...NUMBER_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((number, i) => ({
    number,
    seed: Math.floor(Math.random() * 100000) + i * 7,
  }));
}

export default function IshiaharaTest() {
  const [plates, setPlates] = useState<Plate[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setPlates(buildPlates(8));
    setSessionId(Math.random().toString(36).substring(2, 11).toUpperCase());
  }, []);

  if (plates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Подготовка пластин…
      </div>
    );
  }

  const plate = plates[current];
  const isLast = current === plates.length - 1;

  const correctCount = answers.filter(
    (a, i) => a.trim().toLowerCase() === plates[i].number.toLowerCase()
  ).length;
  const accuracy = Math.round((correctCount / plates.length) * 100);

  const handleNext = () => {
    const ans = userAnswer.trim() === '' ? 'не вижу' : userAnswer.trim();
    const next = [...answers, ans];
    setAnswers(next);

    if (isLast) {
      const correct = next.filter(
        (a, i) => a.trim().toLowerCase() === plates[i].number.toLowerCase()
      ).length;
      const acc = Math.round((correct / plates.length) * 100);
      localStorage.setItem(
        `test_${sessionId}`,
        JSON.stringify({
          testType: 'ishihara',
          sessionId,
          correctAnswers: correct,
          totalPlates: plates.length,
          accuracy: acc,
          timestamp: new Date().toISOString(),
        })
      );
      setDone(true);
    } else {
      setCurrent(current + 1);
      setUserAnswer('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">Тест Ишихары</h1>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-xl mx-auto">
          {!done ? (
            <div className="card">
              {/* Прогресс */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="font-semibold">
                    Пластина {current + 1} из {plates.length}
                  </span>
                  <span>{Math.round((current / plates.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${(current / plates.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Реальная пластина */}
              <div className="mb-6">
                <IshiaharaPlate number={plate.number} seed={plate.seed} size={340} />
              </div>

              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Какое число вы видите? (если не видите — оставьте пустым)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Введите число или оставьте пустым"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                autoFocus
              />

              <button onClick={handleNext} className="w-full btn-primary">
                {isLast ? 'Завершить тест' : 'Далее →'}
              </button>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 text-center">✓ Тест Ишихары завершён</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                <p className="text-4xl font-bold text-orange-500 mb-2">{accuracy}%</p>
                <p className="text-gray-700">
                  Правильно: {correctCount} из {plates.length}
                </p>
                <p className="text-sm text-gray-600 mt-3">
                  {accuracy >= 85 && '✓ Нормальное цветовое зрение'}
                  {accuracy < 85 && accuracy >= 60 && '⚠️ Возможна лёгкая аномалия'}
                  {accuracy < 60 && '⚠️ Выраженное нарушение красно-зелёного восприятия'}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
                <strong>Дальше:</strong> тест Фарнсворта D-15 уточнит <strong>тип</strong> нарушения.
              </div>

              <Link href="/test/farnsworth" className="block btn-primary text-center mb-3">
                Перейти к тесту 2/4 →
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
