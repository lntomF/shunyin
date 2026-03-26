import type { Language } from '../types/app';

export function sanitizeFileName(value: string) {
  const trimmed = value.trim().replace(/\.[a-z0-9]+$/i, '');
  const safe = trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-').replace(/\s+/g, '_');
  return safe.replace(/-+/g, '-').replace(/_+/g, '_').replace(/^[_-]+|[_-]+$/g, '') || 'shunyin_export';
}

export function deriveBaseName(fileName: string) {
  return sanitizeFileName(fileName.replace(/\.[a-z0-9]+$/i, ''));
}

export function formatBytes(bytes: number, language: Language) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return language === 'zh' ? '未知大小' : 'Unknown size';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: value >= 100 ? 0 : value >= 10 ? 1 : 2,
  });

  return `${formatter.format(value)} ${units[unitIndex]}`;
}

export function formatMegapixels(width: number, height: number, language: Language) {
  const megaPixels = (width * height) / 1_000_000;
  const formatter = new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${formatter.format(megaPixels)} MP`;
}

export function formatResolution(width: number, height: number, mimeType: string | undefined, language: Language) {
  const formatLabel = mimeType?.split('/')[1]?.toUpperCase() ?? 'IMG';
  return `${formatLabel} • ${formatMegapixels(width, height, language)} • ${width} × ${height}`;
}

export function formatRelativeTime(isoDate: string, language: Language) {
  const locale = language === 'zh' ? 'zh-CN' : 'en-US';
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, 'day');
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}
