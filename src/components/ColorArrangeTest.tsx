'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Универсальный тест на упорядочивание цветов (Farnsworth D-15 / FM 100 Hue).
 *
 * Принцип настоящего теста: даны цветные «фишки», образующие плавный круг
 * оттенков. Пилотная (референсная) фишка закреплена; остальные перемешаны.
 * Пользователь перетаскивает фишки, выстраивая плавный градиент.
 *
 * Подсчёт (Total Error Score): сумма модулей разностей «истинных» индексов
 * у соседних фишек. Идеальный порядок = (N-1). Чем больше — тем сильнее
 * перепутаны цвета (характерно для дефицита цветового зрения).
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
  // Равномерный круг оттенков (приближение Munsell hue circle).
  const caps: Cap[] = [];
  for (let i = 0; i < count; i++) {
    const hue = Math.round((i / count) * 360);
    caps.push({
      id: `cap-${i}`,
      trueIndex: i,
      color: `hsl(${hue}, 65%, 55%)`,
    });
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

function SortableCap({ cap, size }: { cap: Cap; size: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cap.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: size,
    height: size,
    background: cap.color,
    opacity: isDragging ? 0.6 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-full border-2 border-white shadow cursor-grab active:cursor-grabbing"
    />
  );
}

export default function ColorArrangeTest({ capCount, onComplete, title }: Props) {
  const reference = useMemo(() => {
    const all = generateCaps(capCount);
    return all[0];
  }, [capCount]);

  const [caps, setCaps] = useState<Cap[]>(() => {
    const all = generateCaps(capCount);
    return shuffle(all.slice(1)); // первую (пилотную) закрепляем отдельно
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCaps((items) => {
      const oldIndex = items.findIndex((c) => c.id === active.id);
      const newIndex = items.findIndex((c) => c.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const finish = () => {
    // Полная последовательность: референс + расставленные пользователем.
    const sequence = [reference, ...caps];
    let errorScore = 0;
    for (let i = 0; i < sequence.length - 1; i++) {
      errorScore += Math.abs(sequence[i].trueIndex - sequence[i + 1].trueIndex);
    }
    // Замыкаем круг (D-15 — круговой тест).
    errorScore += Math.abs(sequence[sequence.length - 1].trueIndex - sequence[0].trueIndex);

    onComplete({
      errorScore,
      perfect: capCount, // идеальный круговой обход = capCount
      arrangement: sequence.map((c) => c.trueIndex),
    });
  };

  const capSize = capCount > 20 ? 34 : 48;

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-6">
        Перетаскивайте фишки так, чтобы получился <strong>плавный переход цветов</strong>.
        Слева закреплена стартовая фишка — продолжите ряд от неё.
      </p>

      <div className="flex flex-wrap gap-2 items-center mb-6 p-4 bg-gray-50 rounded-lg">
        {/* Закреплённая пилотная фишка */}
        <div
          style={{
            width: capSize,
            height: capSize,
            background: reference.color,
          }}
          className="rounded-full border-4 border-gray-800 shadow shrink-0"
          title="Стартовая фишка (закреплена)"
        />
        <div className="w-px h-8 bg-gray-300 mx-1" />

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={caps.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap gap-2">
              {caps.map((cap) => (
                <SortableCap key={cap.id} cap={cap} size={capSize} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <button onClick={finish} className="w-full btn-primary">
        Завершить и проверить порядок →
      </button>
    </div>
  );
}
