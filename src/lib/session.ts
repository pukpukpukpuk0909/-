'use client';

/**
 * Единое состояние диагностической сессии.
 * Все 4 теста и калибровка хранятся под ОДНИМ ключом и ОДНИМ sessionId,
 * что решает проблему «4 несвязанных записи» и неограниченного роста
 * localStorage. Старые данные перезаписываются при старте новой сессии.
 */

export interface CalibrationData {
  gamut: string;
  dpr: number;
  resolution: string;
  coefficient: number; // множитель насыщенности под конкретный экран
  gamma: number;
}

export interface SessionState {
  id: string;
  startedAt: string;
  calibration?: CalibrationData;
  results: Record<string, any>; // ishihara | farnsworth | fm100 | anomaloscope
}

const KEY = 'cvt_session';

function genId(): string {
  return (
    'S' +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

export function startSession(calibration?: CalibrationData): SessionState {
  const session: SessionState = {
    id: genId(),
    startedAt: new Date().toISOString(),
    calibration,
    results: {},
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(session));
  }
  return session;
}

export function getSession(): SessionState | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function saveResult(testType: string, data: any): void {
  if (typeof window === 'undefined') return;
  let session = getSession();
  if (!session) session = startSession();
  session.results[testType] = { ...data, completedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getCoefficient(): number {
  return getSession()?.calibration?.coefficient ?? 1;
}
