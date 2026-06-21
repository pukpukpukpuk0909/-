'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import ColorBlindSimulation, { DeficiencyType } from '@/components/ColorBlindSimulation';

interface AnyResult {
  testType: string;
  sessionId: string;
  timestamp: string;
  [key: string]: any;
}

interface Diagnosis {
  type: DeficiencyType;
  typeLabel: string;
  severity: string;
  description: string;
}

function computeDiagnosis(
  ish?: AnyResult,
  farn?: AnyResult,
  fm?: AnyResult,
  anom?: AnyResult
): Diagnosis {
  const acc = ish ? ish.accuracy : 100;
  const deviation = anom ? anom.deviation : 0;
  const tes = fm ? fm.errorScore - fm.perfect : 0;

  // Тип
  let type: DeficiencyType = 'normal';
  if (acc < 85 || Math.abs(deviation) > 8 || tes > 30) {
    if (deviation > 8) type = 'protan';
    else if (deviation < -8) type = 'deutan';
    else type = acc < 85 ? 'deutan' : 'normal'; // дейтан — самый частый
  }

  // Степень
  let severity = 'Норма';
  if (type !== 'normal') {
    if (acc >= 70 && tes <= 30) severity = 'Лёгкая (аномалия)';
    else if (acc >= 50) severity = 'Средняя';
    else severity = 'Тяжёлая';
  }

  const typeLabels: Record<DeficiencyType, string> = {
    normal: 'Нормальное цветовое зрение',
    protan: 'Протанопия / протаномалия (красный спектр)',
    deutan: 'Дейтеранопия / дейтераномалия (зелёный спектр)',
    tritan: 'Тританопия (сине-жёлтый спектр)',
  };

  const descriptions: Record<DeficiencyType, string> = {
    normal: 'Нарушений цветового восприятия не выявлено.',
    protan: 'Снижено восприятие красного. Красные оттенки кажутся тёмными и сливаются с коричневым и зелёным.',
    deutan: 'Снижено восприятие зелёного. Зелёные и красные оттенки трудно различить между собой.',
    tritan: 'Снижено восприятие синего. Синие и зелёные, жёлтые и розовые оттенки путаются.',
  };

  return { type, typeLabel: typeLabels[type], severity, description: descriptions[type] };
}

export default function Results() {
  const [latest, setLatest] = useState<Record<string, AnyResult>>({});

  useEffect(() => {
    const byType: Record<string, AnyResult> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('test_')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const r: AnyResult = JSON.parse(raw);
        const existing = byType[r.testType];
        if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
          byType[r.testType] = r;
        }
      } catch {
        /* ignore */
      }
    }
    setLatest(byType);
  }, []);

  const ish = latest['ishihara'];
  const farn = latest['farnsworth'];
  const fm = latest['fm100'];
  const anom = latest['anomaloscope'];
  const dx = computeDiagnosis(ish, farn, fm, anom);

  // ----- PDF на русском: рисуем отчёт на canvas, вставляем картинкой -----
  const downloadPDF = () => {
    const W = 1240;
    const H = 1754; // A4 при ~150 dpi
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const M = 90;
    let y = 120;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 54px Arial';
    ctx.fillText('Отчёт о цветовом зрении', M, y);
    y += 50;
    ctx.fillStyle = '#6b7280';
    ctx.font = '28px Arial';
    ctx.fillText(`Дата: ${new Date().toLocaleString('ru-RU')}`, M, y);

    // Диагноз
    y += 80;
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('Заключение', M, y);
    y += 55;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 34px Arial';
    ctx.fillText(`Тип: ${dx.typeLabel}`, M, y);
    y += 48;
    ctx.fillText(`Степень: ${dx.severity}`, M, y);
    y += 48;
    ctx.fillStyle = '#374151';
    ctx.font = '28px Arial';
    wrapText(ctx, dx.description, M, y, W - 2 * M, 38);

    // Результаты тестов
    y += 140;
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('Результаты по тестам', M, y);
    y += 30;

    const row = (label: string, value: string) => {
      y += 52;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 30px Arial';
      ctx.fillText(label, M, y);
      ctx.font = '30px Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText(value, M + 600, y);
    };

    row('1. Тест Ишихары', ish ? `${ish.accuracy}% (${ish.correctAnswers}/${ish.totalPlates})` : 'не пройден');
    row('2. Фарнсворт D-15', farn ? `ошибок: ${farn.errorScore - farn.perfect}` : 'не пройден');
    row('3. FM 100 Hue', fm ? `TES: ${fm.errorScore - fm.perfect}` : 'не пройден');
    row('4. Аномалоскоп', anom ? `точка ${anom.matchPoint}/100 (откл. ${anom.deviation})` : 'не пройден');

    // Дисклеймер
    ctx.fillStyle = '#9ca3af';
    ctx.font = '24px Arial';
    wrapText(
      ctx,
      'Внимание: это скрининговый инструмент, а не медицинский диагноз. Для подтверждения обратитесь к врачу-офтальмологу.',
      M,
      H - 120,
      W - 2 * M,
      32
    );

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
    doc.save('otchet-cvetovoe-zrenie.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 mb-2 inline-block">
            ← На главную
          </Link>
          <h1 className="text-2xl font-bold text-gradient">Итоговые результаты</h1>
        </div>
      </header>

      <main className="container py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Заключение */}
          <div className="card border-l-4 border-orange-500">
            <h2 className="text-xl font-bold mb-3">Заключение</h2>
            <p className="text-lg font-semibold text-gray-900">{dx.typeLabel}</p>
            <p className="text-sm text-gray-600 mb-2">
              Степень нарушения: <strong>{dx.severity}</strong>
            </p>
            <p className="text-sm text-gray-700">{dx.description}</p>
          </div>

          {/* Сравнение восприятия */}
          {dx.type !== 'normal' ? (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Как вы видите цвета</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold mb-2 text-center">👁️ Здоровое зрение</p>
                  <ColorBlindSimulation type="normal" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2 text-center">
                    🔍 Ваше восприятие ({dx.severity.toLowerCase()})
                  </p>
                  <ColorBlindSimulation type={dx.type} />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Слева — как видит человек без нарушений. Справа — приближённая симуляция вашего типа восприятия.
              </p>
            </div>
          ) : (
            <div className="card text-center">
              <p className="text-green-700 font-semibold">
                ✓ Ваше цветовое зрение в норме — симуляция нарушений не требуется.
              </p>
            </div>
          )}

          {/* Результаты по тестам */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultCard title="1. Тест Ишихары" color="border-orange-500" done={!!ish}>
              <p className="text-3xl font-bold text-orange-500">{ish?.accuracy}%</p>
              <p className="text-sm text-gray-600">{ish?.correctAnswers}/{ish?.totalPlates} верно</p>
            </ResultCard>
            <ResultCard title="2. Фарнсворт D-15" color="border-blue-500" done={!!farn}>
              <p className="text-3xl font-bold text-blue-500">{farn && farn.errorScore - farn.perfect}</p>
              <p className="text-sm text-gray-600">ошибок расположения</p>
            </ResultCard>
            <ResultCard title="3. FM 100 Hue" color="border-green-500" done={!!fm}>
              <p className="text-3xl font-bold text-green-500">{fm && fm.errorScore - fm.perfect}</p>
              <p className="text-sm text-gray-600">итоговая ошибка (TES)</p>
            </ResultCard>
            <ResultCard title="4. Аномалоскоп" color="border-purple-500" done={!!anom}>
              <p className="text-3xl font-bold text-purple-500">{anom?.matchPoint}/100</p>
              <p className="text-sm text-gray-600">
                отклонение {anom && (anom.deviation > 0 ? '+' : '')}{anom?.deviation}
              </p>
            </ResultCard>
          </div>

          <div className="card bg-blue-50 border border-blue-300">
            <h3 className="font-bold mb-4">📥 Скачать отчёт (PDF, на русском)</h3>
            <button onClick={downloadPDF} className="w-full btn-primary">
              Скачать PDF-отчёт →
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 text-center">
            ⚠️ Скрининговый инструмент. Не является медицинским диагнозом.
            При отклонениях обратитесь к офтальмологу.
          </div>

          <Link href="/" className="block btn-secondary text-center">
            На главную
          </Link>
        </div>
      </main>
    </div>
  );
}

function ResultCard({
  title,
  color,
  children,
  done,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
  done: boolean;
}) {
  return (
    <div className={`card border-l-4 ${color}`}>
      <h3 className="font-bold mb-2">{title}</h3>
      {done ? children : <p className="text-sm text-gray-400">Не пройден</p>}
    </div>
  );
}

// Перенос длинного текста по словам на canvas.
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      ctx.fillText(line, x, yy);
      line = word + ' ';
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}
