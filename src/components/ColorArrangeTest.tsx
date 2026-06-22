'use client';

import { useState, useMemo } from 'react';
import { getCoefficient } from '@/lib/session';

/**
 * Тест на упорядочивание цветов (D-15 / FM 100 Hue), формат «выбери следующий».
 *
 * Ключевые решения для удобства:
 * - Это НЕ замкнутый круг оттенков (где оба конца красные и порядок неоднозначен),
 *   а ОТКРЫТЫЙ градиент от одного цвета к другому.
 * - Закреплены ОБА конца (старт слева и финиш справа) — нужно заполнить середину.
 *   Это убирает неоднозначность: правильный порядок единственный.
 * - Шаг оттенка достаточно крупный, чтобы человек с нормальным зрением справлялся,
 *   но при дальтонизме характерные цвета путаются.
 *
 * Подсчёт: сумма модулей разностей «истинных» индексов у соседних фишек.
 */

interface Cap {
  id: string;
  trueIndex: number;
  color: string;
}

interface Props {
  capCount: number; // включая оба закреплённых конца
  onComplete: (result: { errorScore: number; perfect: number; arrangement: number[] }) => void;
  title: string;
  hueStart?: number;
  hueEnd?: number;
}

function generateCaps(count: number, hueStart: number, hueEnd: number, coefficient: number): Cap[] {
  const caps: Cap[] = [];
  const sat = Math.max(0, Math.min(100, 70 * coefficient)); // калибровка насыщенности
  for (let i = 0; i < count; i++) {
    const hue = Math.round(hueStart + ((hueEnd - hueStart) * i) / (count - 1));
    caps.push({ id: `cap-${i}`, trueIndex: i, color: `hsl(${hue}, ${sat.toFixed(1)}%, 52%)` });
  }
  return caps;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ColorArrangeTest({
  capCount,
  onComplete,
  title,
  hueStart = 0,
  hueEnd = 270,
}: Props) {
  const { startCap, endCap, initialPool } = useMemo(() => {
    const all = generateCaps(capCount, hueStart, hueEnd, getCoefficient());
    return {
      startCap: all[0],
      endCap: all[all.length - 1],
      initialPool: shuffle(all.slice(1, all.length - 1)),
    };
  }, [capCount, hueStart, hueEnd]);

  const [ordered, setOrdered] = useState<Cap[]>([]);
  const [pool, setPool] = useState<Cap[]>(initialPool);

  const pick = (cap: Cap) => {
    setOrdered((o) => [...o, cap]);
    setPool((p) => p.filter((c) => c.id !== cap.id));
  };

  const undo = () => {
    if (ordered.length === 0) return;
    const last = ordered[ordered.length - 1];
    setOrdered((o) => o.slice(0, -1));
    setPool((p) => [last, ...p]);
  };

  const finish = () => {
    const sequence = [startCap, ...ordered, endCap];
    let errorScore = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      errorScore += Math.abs(sequence[i].trueIndex - sequence[i + 1].trueIndex);
    }
    onComplete({
      errorScore,
      perfect: capCount - 1, // идеальный открытый ряд = (N-1) шагов по 1
      arrangement: sequence.map((c) => c.trueIndex),
    });
  };

  const capSize = capCount > 14 ? 44 : 56;
  const allPlaced = pool.length === 0;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-6">
        Слева — <strong>начало</strong>, справа — <strong>конец</strong> цветового ряда (закреплены).
        Заполните середину: нажимайте на фишку, которая по цвету идёт <strong>следующей</strong> после
        обведённой. Должен получиться плавный переход слева направо.
      </p>

      {/* Ряд: старт + выбранные + финиш */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-lg min-h-[64px]">
          <div
            style={{ width: capSize, height: capSize, background: startCap.color }}
            className="rounded-full border-4 border-gray-800 shrink-0"
            title="Начало"
          />
          {ordered.map((cap, i) => (
            <div
              key={cap.id}
              style={{ width: capSize, height: capSize, background: cap.color }}
              className={`rounded-full shrink-0 shadow ${
                i === ordered.length - 1 ? 'border-4 border-orange-500' : 'border-2 border-white'
              }`}
            />
          ))}
          {/* пустые места */}
          {Array.from({ length: pool.length }).map((_, i) => (
            <div
              key={`slot-${i}`}
              style={{ width: capSize, height: capSize }}
              className="rounded-full border-2 border-dashed border-gray-300 shrink-0"
            />
          ))}
          <div className="text-gray-400 px-1">→</div>
          <div
            style={{ width: capSize, height: capSize, background: endCap.color }}
            className="rounded-full border-4 border-gray-800 shrink-0"
            title="Конец"
          />
        </div>
      </div>

      {/* Пул выбора */}
      {!allPlaced ? (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">
            Какой цвет идёт следующим после обведённой фишки?
          </p>
          <div className="flex flex-wrap gap-3 p-3 bg-white border border-gray-200 rounded-lg">
            {pool.map((cap) => (
              <button
                key={cap.id}
                onClick={() => pick(cap)}
                style={{ width: capSize, height: capSize, background: cap.color }}
                className="rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                aria-label="цветная фишка"
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-sm text-green-800 text-center">
          Ряд собран. Проверьте плавность перехода и завершите.
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={undo}
          disabled={ordered.length === 0}
          className="btn-secondary flex-1 disabled:opacity-40"
        >
          ← Отменить
        </button>
        <button onClick={finish} disabled={!allPlaced} className="btn-primary flex-1 disabled:opacity-40">
          Завершить →
        </button>
      </div>
    </div>
  );
}
