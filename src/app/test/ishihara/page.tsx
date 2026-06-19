'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Plate {
  id: number;
  number: string;
  normalVision: string;
  protanopia: string;
  deuteranopia: string;
  description: string;
}

const ISHIHARA_PLATES: Plate[] = [
  {
    id: 1,
    number: '12',
    normalVision: '12',
    protanopia: '?' ,
    deuteranopia: '?',
    description: 'Тест 1: Просмотрите пластину'
  },
  {
    id: 2,
    number: '8',
    normalVision: '8',
    protanopia: '3',
    deuteranopia: '3',
    description: 'Тест 2: Какой номер вы видите?'
  },
  {
    id: 3,
    number: '29',
    normalVision: '29',
    protanopia: 'не видно',
    deuteranopia: 'не видно',
    description: 'Тест 3: Какой номер вы видите?'
  },
  {
    id: 4,
    number: '5',
    normalVision: '5',
    protanopia: '2',
    deuteranopia: '2',
    description: 'Тест 4: Какой номер вы видите?'
  },
  {
    id: 5,
    number: '3',
    normalVision: '3',
    protanopia: '5',
    deuteranopia: '5',
    description: 'Тест 5: Какой номер вы видите?'
  },
  {
    id: 6,
    number: '15',
    normalVision: '15',
    protanopia: 'не видно',
    deuteranopia: 'не видно',
    description: 'Тест 6: Какой номер вы видите?'
  },
  {
    id: 7,
    number: '74',
    normalVision: '74',
    protanopia: '21',
    deuteranopia: '21',
    description: 'Тест 7: Какой номер вы видите?'
  },
];

export default function IshiaharaTest() {
  const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [testComplete, setTestComplete] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const id = Math.random().toString(36).substr(2, 9);
    setSessionId(id);
  }, []);

  const currentPlate = ISHIHARA_PLATES[currentPlateIndex];
  const isLastPlate = currentPlateIndex === ISHIHARA_PLATES.length - 1;

  const handleNext = async () => {
    if (!userAnswer.trim()) {
      alert('Пожалуйста, введите ответ');
      return;
    }

    const newAnswers = [...answers, userAnswer];
    setAnswers(newAnswers);

    if (isLastPlate) {
      // Calculate results
      await calculateResults(newAnswers);
      setTestComplete(true);
    } else {
      setCurrentPlateIndex(currentPlateIndex + 1);
      setUserAnswer('');
    }
  };

  const calculateResults = async (finalAnswers: string[]) => {
    let correctCount = 0;
    let protanopeCount = 0;
    let deuteranopiaCount = 0;

    finalAnswers.forEach((answer, index) => {
      const plate = ISHIHARA_PLATES[index];

      if (answer.trim() === plate.normalVision) {
        correctCount++;
      } else if (answer.trim() === plate.protanopia) {
        protanopeCount++;
      } else if (answer.trim() === plate.deuteranopia) {
        deuteranopiaCount++;
      }
    });

    const accuracy = (correctCount / ISHIHARA_PLATES.length) * 100;

    // Save to localStorage for now (would be database in full app)
    const result = {
      testType: 'ishihara',
      sessionId,
      correctAnswers: correctCount,
      totalPlates: ISHIHARA_PLATES.length,
      accuracy: Math.round(accuracy),
      timestamp: new Date().toISOString(),
      answers: finalAnswers,
    };

    localStorage.setItem(`test_${sessionId}`, JSON.stringify(result));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Вернуться на главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">Тест Ишихары</h1>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-2xl mx-auto">
          {!testComplete ? (
            <div className="card">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Вопрос {currentPlateIndex + 1} из {ISHIHARA_PLATES.length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round((currentPlateIndex / ISHIHARA_PLATES.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(currentPlateIndex / ISHIHARA_PLATES.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Plate Display */}
              <div className="mb-8 text-center">
                <div className="mb-4 h-64 bg-gradient-to-br from-red-200 via-yellow-100 to-green-200 rounded-lg flex items-center justify-center border-4 border-gray-300">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-red-400" style={{ opacity: 0.7 }}>
                      {currentPlate.number}
                    </div>
                    <p className="text-gray-600 mt-4 text-sm">(Пример изображения пластины)</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  {currentPlate.description}
                </p>
              </div>

              {/* Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Какой номер вы видите на пластине?
                </label>
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Введите число или 'не видно'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                {currentPlateIndex > 0 && (
                  <button
                    onClick={() => {
                      setCurrentPlateIndex(currentPlateIndex - 1);
                      setUserAnswer(answers[currentPlateIndex - 1] || '');
                    }}
                    className="btn-secondary flex-1"
                  >
                    ← Назад
                  </button>
                )}
                <button onClick={handleNext} className="btn-primary flex-1">
                  {isLastPlate ? 'Завершить тест' : 'Далее →'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-2xl font-bold mb-6 text-center">Результаты теста</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-gray-700 mb-4">
                  Тест завершён! Ваши результаты сохранены.
                </p>
                <p className="text-sm text-gray-600">
                  ID сессии: <code className="bg-white px-2 py-1 rounded">{sessionId}</code>
                </p>
              </div>

              <div className="space-y-4">
                <Link href="/" className="block btn-primary text-center">
                  На главную
                </Link>
                <Link href="/results" className="block btn-secondary text-center">
                  Посмотреть результаты
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
