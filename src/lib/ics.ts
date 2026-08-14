// ICS(iCalendar) 파일 생성 — 전부 클라이언트에서 실행, 서버 없음
export interface CalendarEvent {
  date: Date;
  title: string;
  /** 종일 이벤트로 내보냄 */
}

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function buildIcs(events: CalendarEvent[], calendarName = 'ShiftCal'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShiftCal//EN',
    `X-WR-CALNAME:${calendarName}`,
  ];
  for (const ev of events) {
    const day = fmt(ev.date);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${day}-${ev.title.replace(/\W+/g, '')}@shiftcal`,
      `DTSTART;VALUE=DATE:${day}`,
      `SUMMARY:${ev.title}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function download(content: string, mime: string, filename: string): void {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadIcs(events: CalendarEvent[], filename: string): void {
  download(buildIcs(events), 'text/calendar', filename);
}

/** 스프레드시트용 CSV (Date, Weekday, Shift) */
export function downloadCsv(events: CalendarEvent[], filename: string): void {
  const rows = ['Date,Weekday,Shift'];
  for (const ev of events) {
    const iso = `${ev.date.getFullYear()}-${String(ev.date.getMonth() + 1).padStart(2, '0')}-${String(
      ev.date.getDate(),
    ).padStart(2, '0')}`;
    const weekday = ev.date.toLocaleDateString('en-US', { weekday: 'short' });
    rows.push(`${iso},${weekday},"${ev.title.replace(/"/g, '""')}"`);
  }
  download(rows.join('\r\n'), 'text/csv', filename);
}
