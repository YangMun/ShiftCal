// 교대 패턴 정의. cycle은 앵커 날짜(본인 근무 스트레치 첫날) 기준 하루 단위 반복.
// 'D' = day shift, 'N' = night shift, 'O' = off
export type ShiftCode = 'D' | 'N' | 'O';

export interface ShiftPattern {
  slug: string;
  name: string;
  /** 카드/헤더용 짧은 코드 표기 */
  code: string;
  /** URL 경로 (기획서의 페이지 슬러그) */
  path: string;
  /** 반복 주기 (일 단위) */
  cycle: ShiftCode[];
  teams: number;
  /** 교대 길이 (시간) — 24h 패턴은 주/야 선택 UI를 숨김 */
  shiftLength: 12 | 24;
  /** true면 사용자가 주간조/야간조를 선택 (cycle의 D를 N으로 치환) */
  fixedShiftChoice: boolean;
  description: string;
}

export const PATTERNS: ShiftPattern[] = [
  {
    slug: '2-2-3-panama',
    code: '2-2-3',
    name: '2-2-3 (Panama) Schedule',
    path: '/2-2-3-panama-schedule-calculator',
    // 14일 주기: 2 on, 2 off, 3 on, 2 off, 2 on, 3 off
    cycle: ['D', 'D', 'O', 'O', 'D', 'D', 'D', 'O', 'O', 'D', 'D', 'O', 'O', 'O'],
    teams: 4,
    shiftLength: 12,
    fixedShiftChoice: true,
    description: '12-hour shifts rotating 2 on, 2 off, 3 on. Every other weekend off.',
  },
  {
    slug: 'pitman',
    code: 'PITMAN',
    name: 'Pitman Schedule',
    path: '/pitman-schedule-calculator',
    cycle: ['D', 'D', 'O', 'O', 'D', 'D', 'D', 'O', 'O', 'D', 'D', 'O', 'O', 'O'],
    teams: 4,
    shiftLength: 12,
    fixedShiftChoice: true,
    description: '14-day cycle of 12-hour shifts; two crews cover days, two cover nights.',
  },
  {
    slug: 'dupont',
    code: 'DUPONT',
    name: 'DuPont Schedule',
    path: '/dupont-schedule-calculator',
    // 28일 주기: 4N, 3O, 3D, 1O, 3N, 3O, 4D, 7O
    cycle: [
      'N', 'N', 'N', 'N', 'O', 'O', 'O',
      'D', 'D', 'D', 'O', 'N', 'N', 'N',
      'O', 'O', 'O', 'D', 'D', 'D', 'D',
      'O', 'O', 'O', 'O', 'O', 'O', 'O',
    ],
    teams: 4,
    shiftLength: 12,
    fixedShiftChoice: false,
    description: '28-day rotating cycle mixing days and nights, with a full 7-day break.',
  },
  {
    slug: '4-on-4-off',
    code: '4 ON 4',
    name: '4 On 4 Off Schedule',
    path: '/4-on-4-off-schedule-calculator',
    cycle: ['D', 'D', 'D', 'D', 'O', 'O', 'O', 'O'],
    teams: 2,
    shiftLength: 12,
    fixedShiftChoice: true,
    description: 'Four consecutive 12-hour shifts followed by four days off.',
  },
  {
    slug: '48-96',
    code: '48/96',
    name: '48/96 Shift Schedule',
    path: '/48-96-shift-calendar',
    cycle: ['D', 'D', 'O', 'O', 'O', 'O'],
    teams: 3,
    shiftLength: 24,
    fixedShiftChoice: false,
    description: 'Two 24-hour shifts on, four days off. Common in fire departments.',
  },
  {
    slug: 'cal-fire',
    code: '3 ON 4',
    name: '3 On 4 Off (CAL FIRE-style)',
    path: '/cal-fire-shift-calendar',
    cycle: ['D', 'D', 'D', 'O', 'O', 'O', 'O'],
    teams: 3,
    shiftLength: 24,
    fixedShiftChoice: false,
    description: 'Three consecutive 24-hour duty days, four days off. CAL FIRE base pattern.',
  },
  {
    slug: 'kelly',
    code: 'KELLY',
    name: 'Kelly Schedule',
    path: '/kelly-schedule-calculator',
    // 9일 주기: 24h on/off 3회 후 4일 휴무
    cycle: ['D', 'O', 'D', 'O', 'D', 'O', 'O', 'O', 'O'],
    teams: 3,
    shiftLength: 24,
    fixedShiftChoice: false,
    description: '24-hour shifts every other day, three times, then four days off.',
  },
];

export function patternBySlug(slug: string): ShiftPattern | undefined {
  return PATTERNS.find((p) => p.slug === slug);
}

/** anchorDate = 본인 근무 스트레치 첫날(cycle[0]). date의 근무 코드를 반환 */
export function shiftOn(pattern: ShiftPattern, anchorDate: Date, date: Date): ShiftCode {
  const MS_PER_DAY = 86_400_000;
  const utc = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.floor((utc(date) - utc(anchorDate)) / MS_PER_DAY);
  const n = pattern.cycle.length;
  return pattern.cycle[((diff % n) + n) % n]!;
}
