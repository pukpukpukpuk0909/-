'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-6">
          <h1 className="text-3xl font-bold text-gradient">Тест на дальтонизм</h1>
          <p className="text-sm text-gray-600 mt-2">✓ Бесплатная диагностика · ✓ Анонимно</p>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <section className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Комплексная диагностика цветового зрения
            </h2>
            <p className="text-xl text-gray-600">
              4 клинически проверенных метода в одной сессии. Результат за 25–35 минут.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="card">
              <h3 className="text-lg font-bold mb-3">🎯 Этапы диагностики</h3>
              <ol className="text-sm text-gray-700 space-y-2">
                <li><strong>0.</strong> Автокалибровка дисплея</li>
                <li><strong>1.</strong> Тест Ишихары — скрининг</li>
                <li><strong>2.</strong> Фарнсворт D-15 — тип дефекта</li>
                <li><strong>3.</strong> FM 100 Hue — степень тяжести</li>
                <li><strong>4.</strong> Аномалоскоп — точное значение</li>
                <li><strong>5.</strong> Итог + PDF-отчёт</li>
              </ol>
            </div>
            <div className="card">
              <h3 className="text-lg font-bold mb-3">✅ Подготовка</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Отключите фильтры синего света</li>
                <li>✓ Яркость экрана ~80%</li>
                <li>✓ Профиль цвета sRGB</li>
                <li>✓ Освещение без бликов</li>
                <li>✓ 25–35 минут без отвлечений</li>
              </ul>
            </div>
          </section>

          <section className="text-center">
            <Link
              href="/test/calibration"
              className="inline-block px-12 py-4 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors"
            >
              Начать тестирование →
            </Link>
          </section>

          <section className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center text-sm text-yellow-800">
            ⚠️ <strong>Важно:</strong> тест является скрининговым и не заменяет
            профессиональную офтальмологическую консультацию.
          </section>
        </div>
      </main>
    </div>
  );
}
