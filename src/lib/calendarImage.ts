// 화면과 같은 디자인의 12개월 달력을 캔버스로 그려 PNG로 저장 — 전부 클라이언트에서 실행
export interface DayMark {
  fill?: 'day' | 'night' | 'duty';
  pay?: boolean;
  holiday?: boolean;
}

interface Options {
  title: string;
  start: Date; // 이 달의 1일부터 12개월
  classify: (d: Date) => DayMark;
  filename: string;
}

// 라이트(종이) 팔레트 고정 — 공유·인쇄 어디서나 읽히도록
const C = {
  bg: '#f5f4f0',
  paper: '#fffefb',
  ink: '#1c1e21',
  muted: '#5a5f66',
  rule: '#d9d6ce',
  accent: '#b57400',
  day: '#c9dff6',
  night: '#cdd2f1',
  duty: '#f3ddcb',
  pay: '#c2e5cb',
  holiday: '#1f7a70',
};

const CELL = 46;
const MONTH_W = CELL * 7;
const MONTH_H = 320;
const GAP = 28;
const MARGIN = 36;
const TITLE_H = 76;

const HEAD = "'Barlow Semi Condensed', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";

function drawMonth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  first: Date,
  classify: (d: Date) => DayMark,
): void {
  const monthName = first
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase();
  ctx.fillStyle = C.ink;
  ctx.font = `700 17px ${HEAD}`;
  ctx.textAlign = 'left';
  ctx.fillText(monthName, x, y + 16);

  const gridY = y + 28;
  ctx.fillStyle = C.paper;
  ctx.fillRect(x, gridY, MONTH_W, MONTH_H - 34);
  ctx.strokeStyle = C.rule;
  ctx.strokeRect(x + 0.5, gridY + 0.5, MONTH_W - 1, MONTH_H - 35);

  ctx.fillStyle = C.muted;
  ctx.font = `500 12px ${MONO}`;
  ctx.textAlign = 'center';
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  for (let i = 0; i < 7; i++) {
    ctx.fillText(weekdays[i]!, x + i * CELL + CELL / 2, gridY + 17);
  }
  ctx.beginPath();
  ctx.moveTo(x, gridY + 24.5);
  ctx.lineTo(x + MONTH_W, gridY + 24.5);
  ctx.stroke();

  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  let col = first.getDay();
  let row = 0;
  const rowH = 42;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(first.getFullYear(), first.getMonth(), day);
    const mark = classify(date);
    const cx = x + col * CELL;
    const cy = gridY + 28 + row * rowH;

    if (mark.fill) {
      ctx.fillStyle = mark.fill === 'day' ? C.day : mark.fill === 'night' ? C.night : C.duty;
      ctx.fillRect(cx + 2, cy, CELL - 4, rowH - 4);
    }
    if (mark.pay) {
      // 급여일: 우하단 삼각형
      ctx.fillStyle = C.pay;
      if (mark.fill) {
        ctx.beginPath();
        ctx.moveTo(cx + CELL - 2, cy);
        ctx.lineTo(cx + CELL - 2, cy + rowH - 4);
        ctx.lineTo(cx + 2, cy + rowH - 4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(cx + 2, cy, CELL - 4, rowH - 4);
      }
    }
    if (mark.holiday) {
      ctx.strokeStyle = C.holiday;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx + 3, cy + 1, CELL - 6, rowH - 6);
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = C.ink;
    ctx.font = `500 15px ${MONO}`;
    ctx.fillText(String(day), cx + CELL / 2, cy + 26);

    col = (col + 1) % 7;
    if (col === 0) row++;
  }
}

export function downloadCalendarPng(opts: Options): void {
  const cols = 3;
  const rows = 4;
  const width = MARGIN * 2 + cols * MONTH_W + (cols - 1) * GAP;
  const height = TITLE_H + MARGIN + rows * MONTH_H + (rows - 1) * GAP + 46;

  const canvas = document.createElement('canvas');
  const scale = 2; // 레티나 선명도
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = C.ink;
  ctx.font = `700 26px ${HEAD}`;
  ctx.textAlign = 'left';
  ctx.fillText(opts.title.toUpperCase(), MARGIN, 46);

  // 범례
  ctx.font = `600 12px ${HEAD}`;
  let lx = MARGIN;
  const legend: Array<[string, string | null, boolean]> = [
    ['DAY', C.day, false],
    ['NIGHT', C.night, false],
    ['HOLIDAY', null, true],
    ['PAYDAY', C.pay, false],
  ];
  for (const [label, color, ring] of legend) {
    if (color) {
      ctx.fillStyle = color;
      ctx.fillRect(lx, 58, 12, 12);
    }
    if (ring) {
      ctx.strokeStyle = C.holiday;
      ctx.lineWidth = 2;
      ctx.strokeRect(lx + 1, 59, 10, 10);
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = C.muted;
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + 17, 68);
    lx += 30 + ctx.measureText(label).width + 18;
  }

  for (let m = 0; m < 12; m++) {
    const first = new Date(opts.start.getFullYear(), opts.start.getMonth() + m, 1);
    const x = MARGIN + (m % cols) * (MONTH_W + GAP);
    const y = TITLE_H + MARGIN + Math.floor(m / cols) * (MONTH_H + GAP);
    drawMonth(ctx, x, y, first, opts.classify);
  }

  ctx.fillStyle = C.accent;
  ctx.font = `700 15px ${HEAD}`;
  ctx.textAlign = 'right';
  ctx.fillText('ONDUTYCAL.COM', width - MARGIN, height - 18);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = opts.filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
}
