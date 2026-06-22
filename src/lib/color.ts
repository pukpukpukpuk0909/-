/**
 * Цветовые утилиты: применение калибровочного коэффициента и джиттер яркости.
 */

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '');
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Применяет калибровочный коэффициент (масштаб насыщенности) к hex-цвету
 * и опционально добавляет джиттер яркости (чтобы фигуру нельзя было распознать
 * по светлоте). Возвращает CSS hsl-строку.
 */
export function calibratedColor(hex: string, coefficient: number, lightnessJitter = 0): string {
  const { h, s, l } = hexToHsl(hex);
  const s2 = Math.max(0, Math.min(100, s * coefficient));
  const l2 = Math.max(0, Math.min(100, l + lightnessJitter));
  return `hsl(${Math.round(h)}, ${s2.toFixed(1)}%, ${l2.toFixed(1)}%)`;
}
