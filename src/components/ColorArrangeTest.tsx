'use client';

import { useState, useMemo } from 'react';

/**
 * Тест на упорядочивание цветов (Farnsworth D-15 / FM 100 Hue) —
 * формат «выбери следующий по похожести цвет» (как в реальной клинической
 * процедуре). Никакого перетаскивания: пользователь просто кликает фишку,
 * наиболее близкую по цвету к последней выбранной.
 *
 * Total Error Score: сумма модулей разностей «истинных» индексов у соседних
 * фишек в собранной последовательности (с замыканием в круг).
 */

interface Cap {
  id: string;
  trueIndex: number;
  color: string;
}

interface Props {
  capCount: number;
  onComplete: (result: { errorScore: number; perfect: number; arrangement: number[] }) => void;
  title: string;
}

function generateCaps(count: number): Cap[] {
  const caps: Cap[] = [];
  for (let i = 0; i < count; i++) {
    const hue = Math.round((i / count) * 360);
    caps.push({ id: `cap-${i}`, trueIndex: i, color: `hsl(${hue}, 65%, 55%)` });
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

export default function ColorArrangeTest({ capCount, onComplete, title }: Props) {
  const { reference, initialPool } = useMemo(() => {
    const all = generateCaps(capCount);
    return { reference: all[0], initialPool: shuffle(all.slice(1)) };
  }, [capCount]);

  const [ordered, setOrdered] = useState<Cap[]>([]);
  const [pool, setPool] = useState<Cap[]>(initialPool);

  const lastCap = ordered.length > 0 ? ordered[ordered.length - 1] : reference;

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
    const sequence = [reference, ...ordered];
    let errorScore = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      errorScore += Math.abs(sequence[i].trueIndex - sequence[i + 1].trueIndex);
    }
    errorScore += Math.abs(sequence[sequence.length - 1].trueIndex - sequence[0].trueIndex);
    onComplete({ errorScore, perfect: capCount, arrangement: sequence.map((c) => c.trueIndex) });
  };

  const capSize = capCount > 18 ? 40 : 52;
  const allPlaced = pool.length === 0;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-6">
        Нажимайте на фишку, которая <strong>по цвету ближе всего</strong> к последней
        выбранной (она обведена). Собирайте плавную цепочку оттенков.
      </p>

      {/* Собранная цепочка */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2">Ваша последовательность:</p>
        <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-lg min-h-[60px]">
          <div
            style={{ width: capSize, height: capSize, background: reference.color }}
            className="rounded-full border-4 border-gray-800 shrink-0"
            title="Старт"
          />
          {ordered.map((cap, i) => (
            <div
              key={cap.id}
              style={{ width: capSize, height: capSize, background: cap.color }}
              className={`rounded-full shrink-0 ${
                i === ordered.length - 1 ? 'border-4 border-orange-500' : 'border-2 border-white'
              } shadow`}
            />
          ))}
        </div>
      </div>

      {/* Пул для выбора */}
      {!allPlaced ? (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">
            Выберите следующий цвет (ближайший к обведённой фишке):
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
          Все фишки расставлены. Проверьте цепочку и завершите.
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
