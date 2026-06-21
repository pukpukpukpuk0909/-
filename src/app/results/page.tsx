'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface AnyResult {
  testType: string;
  sessionId: string;
  timestamp: string;
  [key: string]: any;
}

export default function Results() {
  const [latest, setLatest] = useState<Record<string, AnyResult>>({});

  useEffect(() => {
    // Берём самый свежий результат по каждому типу теста.
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

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text('Color Vision Test Report', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Date: ${new Date().toLocaleString('en-GB')}`, 20, y);
    y += 12;
    doc.setTextColor(0);
    doc.setFontSize(13);

    const line = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 90, y);
      y += 9;
    };

    doc.text('1. Ishihara Test', 20, y);
    y += 8;
    doc.setFontSize(11);
    line('   Accuracy:', ish ? `${ish.accuracy}%` : 'not completed');
    line('   Correct:', ish ? `${ish.correctAnswers}/${ish.totalPlates}` : '-');
    y += 4;

    doc.setFontSize(13);
    doc.text('2. Farnsworth D-15', 20, y);
    y += 8;
    doc.setFontSize(11);
    line('   Error score:', farn ? `${farn.errorScore - farn.perfect}` : 'not completed');
    y += 4;

    doc.setFontSize(13);
    doc.text('3. FM 100 Hue', 20, y);
    y += 8;
    doc.setFontSize(11);
    line('   TES:', fm ? `${fm.errorScore - fm.perfect}` : 'not completed');
    y += 4;

    doc.setFontSize(13);
    doc.text('4. Anomaloscope', 20, y);
    y += 8;
    doc.setFontSize(11);
    line('   Match point:', anom ? `${anom.matchPoint}/100` : 'not completed');
    line('   Deviation:', anom ? `${anom.deviation > 0 ? '+' : ''}${anom.deviation}` : '-');
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(
      'Screening tool only. Not a medical diagnosis. Consult an ophthalmologist.',
      20,
      280
    );

    doc.save('color-vision-report.pdf');
  };

  const Card = ({
    title,
    color,
    children,
    done,
  }: {
    title: string;
    color: string;
    children: React.ReactNode;
    done: boolean;
  }) => (
    <div className={`card border-l-4 ${color}`}>
      <h3 className="font-bold mb-2">{title}</h3>
      {done ? children : <p className="text-sm text-gray-400">Не пройден</p>}
    </div>
  );

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="1. Тест Ишихары" color="border-orange-500" done={!!ish}>
              <p className="text-3xl font-bold text-orange-500">{ish?.accuracy}%</p>
              <p className="text-sm text-gray-600">
                {ish?.correctAnswers}/{ish?.totalPlates} верно
              </p>
            </Card>

            <Card title="2. Фарнсворт D-15" color="border-blue-500" done={!!farn}>
              <p className="text-3xl font-bold text-blue-500">
                {farn && farn.errorScore - farn.perfect}
              </p>
              <p className="text-sm text-gray-600">ошибок расположения</p>
            </Card>

            <Card title="3. FM 100 Hue" color="border-green-500" done={!!fm}>
              <p className="text-3xl font-bold text-green-500">
                {fm && fm.errorScore - fm.perfect}
              </p>
              <p className="text-sm text-gray-600">итоговая ошибка (TES)</p>
            </Card>

            <Card title="4. Аномалоскоп" color="border-purple-500" done={!!anom}>
              <p className="text-3xl font-bold text-purple-500">{anom?.matchPoint}/100</p>
              <p className="text-sm text-gray-600">
                отклонение {anom && (anom.deviation > 0 ? '+' : '')}
                {anom?.deviation}
              </p>
            </Card>
          </div>

          <div className="card bg-blue-50 border border-blue-300">
            <h3 className="font-bold mb-4">📥 Скачать отчёт</h3>
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
