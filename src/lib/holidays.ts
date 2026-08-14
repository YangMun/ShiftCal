// 미국 연방 공휴일 계산 (관측일 아닌 실제 날짜 기준 — 교대근무자는 실제 당일 근무 여부가 관심사)
export interface Holiday {
  name: string;
  date: Date;
}

function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - offset);
}

export function federalHolidays(year: number): Holiday[] {
  return [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: 'Martin Luther King Jr. Day', date: nthWeekday(year, 0, 1, 3) },
    { name: "Presidents' Day", date: nthWeekday(year, 1, 1, 3) },
    { name: 'Memorial Day', date: lastWeekday(year, 4, 1) },
    { name: 'Juneteenth', date: new Date(year, 5, 19) },
    { name: 'Independence Day', date: new Date(year, 6, 4) },
    { name: 'Labor Day', date: nthWeekday(year, 8, 1, 1) },
    { name: 'Columbus Day', date: nthWeekday(year, 9, 1, 2) },
    { name: 'Veterans Day', date: new Date(year, 10, 11) },
    { name: 'Thanksgiving', date: nthWeekday(year, 10, 4, 4) },
    { name: 'Christmas Day', date: new Date(year, 11, 25) },
  ];
}

/** [from, to] 구간의 공휴일 (양끝 포함) */
export function holidaysBetween(from: Date, to: Date): Holiday[] {
  const out: Holiday[] = [];
  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
    for (const h of federalHolidays(y)) {
      if (h.date >= from && h.date <= to) out.push(h);
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
