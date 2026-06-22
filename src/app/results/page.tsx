'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import ColorBlindSimulation, { DeficiencyType } from '@/components/ColorBlindSimulation';
import { getSession, SessionState } from '@/lib/session';

interface Diagnosis {
  type: DeficiencyType;
  typeLabel: string;
  severity: string;
  description: string;
}

function computeDiagnosis(results: Record<string, any>): Diagnosis {
  const ish = results.ishihara;
  const fm = results.fm100;
  const anom = results.anomaloscope;

  const acc = ish ? ish.accuracy : 100;
  const deviation = anom ? anom.deviation : 0;
  const range = anom ? anom.matchingRange : 0;
  const tes = fm ? fm.errorScore - fm.perfect : 0;

  // Есть ли нарушение
  const abnormal = acc < 85 || Math.abs(deviation) > 6 || range > 8 || tes > 30;

  let type: DeficiencyType = 'normal';
  if (abnormal) {
    if (deviation > 6) type = 'protan';
    else if (deviation < -6) type = 'deutan';
    else type = 'deutan'; // самый частый при неопределённом знаке
  }

  let severity = 'Норма';
  if (type !== 'normal') {
    const sev = (acc < 50 ? 2 : acc < 70 ? 1 : 0) + (tes > 60 ? 2 : tes > 30 ? 1 : 0) + (range > 20 ? 2 : range > 8 ? 1 : 0);
    severity = sev >= 4 ? 'Тяжёлая' : sev >= 2 ? 'Средняя' : 'Лёгкая (аномалия)';
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
    tritan: 'Снижено восприятие синего. Синие/зелёные и жёлтые/розовые оттенки путаются.',
  };

  return { type, typeLabel: typeLabels[type], severity, description: descriptions[type] };
}

export default function Results() {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const results = session?.results ?? {};
  const ish = results.ishihara;
  const farn = results.farnsworth;
  const fm = results.fm100;
  const anom = results.anomaloscope;
  const dx = computeDiagnosis(results);

  const downloadPDF = () => {
    const W = 1240;
    const H = 1754;
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
    y += 48;
    ctx.fillStyle = '#6b7280';
    ctx.font = '26px Arial';
    ctx.fillText(`Дата: ${new Date().toLocaleString('ru-RU')}`, M, y);
    y += 34;
    ctx.fillText(`Сессия: ${session?.id ?? '—'}`, M, y);
    if (session?.calibration) {
      y += 34;
      ctx.fillText(
        `Калибровка: ${session.calibration.gamut}, γ≈${session.calibration.gamma}, k=${session.calibration.coefficient}`,
        M,
        y
      );
    }

    y += 70;
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('Заключение', M, y);
    y += 52;
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`Тип: ${dx.typeLabel}`, M, y);
    y += 44;
    ctx.fillText(`Степень: ${dx.severity}`, M, y);
    y += 44;
    ctx.fillStyle = '#374151';
    ctx.font = '27px Arial';
    y = wrapText(ctx, dx.description, M, y, W - 2 * M, 36);

    y += 70;
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('Результаты по тестам', M, y);

    const row = (label: string, value: string) => {
      y += 50;
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 29px Arial';
      ctx.fillText(label, M, y);
      ctx.font = '29px Arial';
      ctx.fillStyle = '#374151';
      ctx.fillText(value, M + 560, y);
    };
    row('1. Тест Ишихары', ish ? `${ish.accuracy}% (${ish.correctAnswers}/${ish.totalPlates})` : 'не пройден');
    row('2. Фарнсворт D-15', farn ? `ошибок: ${farn.errorScore - farn.perfect}` : 'не пройден');
    row('3. FM 100 Hue', fm ? `TES: ${fm.errorScore - fm.perfect}` : 'не пройден');
    row(
      '4. Аномалоскоп',
      anom ? `середина ${anom.midpoint}, ширина ${anom.matchingRange}` : 'не пройден'
    );

    ctx.fillStyle = '#9ca3af';
    ctx.font = '23px Arial';
    wrapText(
      ctx,
      'Внимание: это скрининговый инструмент, а не медицинский диагноз. Для подтверждения обратитесь к врачу-офтальмологу.',
      M,
      H - 120,
      W - 2 * M,
      30
    );

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
    doc.save('otchet-cvetovoe-zrenie.pdf');
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ ...session, diagnosis: dx }, null, 2)], {
      type: 'application/json',
    });
    triggerDownload(blob, 'session.json');
  };

  const downloadCSV = () => {
    const rows = [
      ['session_id', session?.id ?? ''],
      ['started_at', session?.startedAt ?? ''],
      ['calibration_gamut', session?.calibration?.gamut ?? ''],
      ['calibration_gamma', String(session?.calibration?.gamma ?? '')],
      ['calibration_coefficient', String(session?.calibration?.coefficient ?? '')],
      ['ishihara_accuracy', String(ish?.accuracy ?? '')],
      ['ishihara_correct', ish ? `${ish.correctAnswers}/${ish.totalPlates}` : ''],
      ['farnsworth_error', farn ? String(farn.errorScore - farn.perfect) : ''],
      ['fm100_tes', fm ? String(fm.errorScore - fm.perfect) : ''],
      ['anomaloscope_midpoint', String(anom?.midpoint ?? '')],
      ['anomaloscope_range', String(anom?.matchingRange ?? '')],
      ['anomaloscope_deviation', String(anom?.deviation ?? '')],
      ['diagnosis_type', dx.type],
      ['diagnosis_severity', dx.severity],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'session.csv');
  };

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-600">
        <p>Нет данных сессии. Пройдите тестирование.</p>
        <Link href="/test/calibration" className="btn-primary">
          Начать тестирование
        </Link>
      </div>
    );
  }

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
          <div className="card border-l-4 border-orange-500">
            <h2 className="text-xl font-bold mb-3">Заключение</h2>
            <p className="text-lg font-semibold text-gray-900">{dx.typeLabel}</p>
            <p className="text-sm text-gray-600 mb-2">
              Степень нарушения: <strong>{dx.severity}</strong>
            </p>
            <p className="text-sm text-gray-700">{dx.description}</p>
          </div>

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
              <p className="text-3xl font-bold text-purple-500">{anom?.midpoint}/100</p>
              <p className="text-sm text-gray-600">ширина диапазона: {anom?.matchingRange}</p>
            </ResultCard>
          </div>

          <div className="card bg-blue-50 border border-blue-300">
            <h3 className="font-bold mb-4">📥 Скачать отчёт</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={downloadPDF} className="btn-primary">PDF (рус.)</button>
              <button onClick={downloadCSV} className="btn-secondary">CSV</button>
              <button onClick={downloadJSON} className="btn-secondary">JSON</button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 text-center">
            ⚠️ Скрининговый инструмент. Не является медицинским диагнозом. При отклонениях обратитесь к офтальмологу.
          </div>

          <Link href="/" className="block btn-secondary text-center">
            На главную
          </Link>
        </div>
      </main>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
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
  return yy;
}
