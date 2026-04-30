export interface DateFormatOptions {
  locale?: string;
  withTime?: boolean;
}

export function formatDate(
  dateStr: string,
  options: DateFormatOptions = {}
): string {
  const { locale = 'en-US', withTime = false } = options;
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function formatDateTime(dateStr: string, locale = 'en-US'): string {
  return new Date(dateStr).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
