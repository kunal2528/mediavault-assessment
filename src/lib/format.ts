import type { AssetStatus } from './types';

const UNITS = ['B', 'KB', 'MB', 'GB'];

export function formatBytes(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<AssetStatus, string> = {
  draft: '○ Draft',
  in_review: '◑ In review',
  approved: '● Approved',
  archived: '× Archived',
};

export function statusLabel(status: AssetStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Maps raw API error strings (e.g. "503: Service Unavailable") to
 * human-readable messages. Falls back to a generic message so raw
 * HTTP status strings never reach the UI.
 */
export function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.startsWith('429')) return 'Too many requests — please wait a moment and try again.';
  if (raw.startsWith('503')) return 'The server is temporarily unavailable. Try again shortly.';
  if (raw.startsWith('500')) return 'Something went wrong on the server. Try again.';
  if (raw.startsWith('404')) return 'That asset could not be found.';
  if (raw.startsWith('409')) return 'This asset was updated elsewhere — reload to see the latest version.';
  if (raw.toLowerCase().includes('failed to fetch') || raw.toLowerCase().includes('networkerror')) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
}
