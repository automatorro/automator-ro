type EventPayload = {
  name: string;
  ts?: number;
  meta?: Record<string, any>;
};

const STORAGE_KEY = 'cta_events';

export function trackEvent(name: string, meta?: Record<string, any>) {
  const payload: EventPayload = { name, ts: Date.now(), meta };
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    existing.push(payload);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (_) {
    // ignore storage errors
  }
  console.info('[CTA]', name, meta || {});
}

export function getTrackedEvents(): EventPayload[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    return [];
  }
}