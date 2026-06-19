'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [userType, setUserType] = useState<'anonymous' | 'registered' | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gradient">Тест на дальтонизм</h1>
            <div className="text-sm text-gray-600">
              <p className="font-semibold">✓ Бесплатная диагностика</p>
              <p className="font-semibold">✓ Анонимно</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Диагностика нарушений цветового зрения
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Профессиональный онлайн тест для выявления дальтонизма и аномалии цветового зрения
            </p>
          </section>

          {/* Test Selection */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">Выберите тип теста:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ishihara Test */}
              <Link href="/test/ishihara" className="card hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-red-400 to-green-400 rounded mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  12
                </div>
                <h4 className="text-lg font-bold mb-2">Тест Ишихары</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Начальный скрининг нарушений красно-зеленого цветового восприятия
                </p>
                <div className="text-xs text-gray-500">
                  ⏱️ 5-7 минут
                </div>
              </Link>

              {/* Farnsworth Test */}
              <Link href="/test/farnsworth" className="card hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-blue-400 to-yellow-400 rounded mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  D-15
                </div>
                <h4 className="text-lg font-bold mb-2">Тест Фарнсворта D-15</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Определение типа дефекта цветового зрения через расположение цветных образцов
                </p>
                <div className="text-xs text-gray-500">
                  ⏱️ 5-8 минут
                </div>
              </Link>

              {/* FM 100 Hue Test */}
              <Link href="/test/fm100" className="card hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  100
                </div>
                <h4 className="text-lg font-bold mb-2">FM 100 Hue Test</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Наиболее точный метод оценки степени нарушения цветового зрения
                </p>
                <div className="text-xs text-gray-500">
                  ⏱️ 10-15 минут
                </div>
              </Link>

              {/* Anomaloscope Test */}
              <Link href="/test/anomaloscope" className="card hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-cyan-400 to-orange-400 rounded mb-4 flex items-center justify-center text-white font-bold text-2xl">
                  R-G
                </div>
                <h4 className="text-lg font-bold mb-2">Аномалоскоп</h4>
                <p className="text-gray-600 text-sm mb-4">
                  Количественное определение типа аномалии цветового зрения через калибровку
                </p>
                <div className="text-xs text-gray-500">
                  ⏱️ 3-5 минут
                </div>
              </Link>
            </div>
          </section>

          {/* Info Section */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-8 mb-12">
            <h3 className="text-xl font-bold mb-4 text-blue-900">Подготовка к тесту</h3>
            <ul className="space-y-3 text-blue-800">
              <li className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <span><strong>Отключите</strong> фильтры синего света на вашем экране</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <span><strong>Установите яркость</strong> экрана на 80%</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <span><strong>Используйте</strong> профиль цвета sRGB</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <span><strong>Обеспечьте</strong> освещение без бликов</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <span><strong>Потребуется</strong> 20-30 минут без перерывов</span>
              </li>
            </ul>
          </section>

          {/* Disclaimer */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center text-sm text-yellow-800">
            <p>
              ⚠️ <strong>Важно:</strong> Этот тест является скрининговым и не заменяет профессиональную офтальмологическую консультацию.
              При подозрении на нарушение цветового зрения обратитесь к врачу.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
