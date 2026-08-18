// 실시간 방문자 카운터 워커.
// 정적 자산 앞단에서 /api/* 와 /live 만 처리한다 (wrangler.jsonc의 run_worker_first).
//  - POST /api/beat?id=<uuid> : 페이지가 25초마다 보내는 하트비트. 새 id면 오늘 방문 수 +1. (공개)
//  - GET  /api/live           : { live, today, yesterday } — 대시보드가 폴링. (소유자 전용)
//  - GET  /live               : 대시보드 페이지. (소유자 전용)
//
// 소유자 인증: DASH_KEY 시크릿(`wrangler secret put DASH_KEY`)과 일치하는 ?key= 로
// 처음 한 번 접속하면 1년짜리 HttpOnly 쿠키(키의 SHA-256)를 발급하고,
// 이후에는 쿠키만으로 통과된다. 키·쿠키가 없으면 404로 존재 자체를 숨긴다.
// 방문자 하트비트의 id는 탭 단위 난수라서 쿠키·개인정보 수집은 여전히 없다.

const TTL_MS = 70_000; // 하트비트(25초) 2회 연속 유실 시 이탈로 간주
const ID_RE = /^[0-9a-zA-Z-]{8,40}$/;
const MAX_PRESENCE = 20_000; // 악의적 id 폭주로 storage 값이 비대해지는 것 방지
const COOKIE_MAX_AGE = 31_536_000; // 1년

export class LiveCounter {
  constructor(state) {
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const now = Date.now();
    const presence = (await this.storage.get('presence')) ?? {};
    for (const [id, t] of Object.entries(presence)) {
      if (now - t > TTL_MS) delete presence[id];
    }

    if (url.pathname === '/api/beat') {
      const id = url.searchParams.get('id') ?? '';
      if (!ID_RE.test(id) || Object.keys(presence).length >= MAX_PRESENCE) {
        return new Response('bad request', { status: 400 });
      }
      const isNew = !(id in presence);
      presence[id] = now;
      await this.storage.put('presence', presence);
      if (isNew) {
        const key = `visits:${utcDay(now)}`;
        await this.storage.put(key, ((await this.storage.get(key)) ?? 0) + 1);
      }
      return new Response(null, { status: 204 });
    }

    await this.storage.put('presence', presence);
    const [today, yesterday] = await Promise.all([
      this.storage.get(`visits:${utcDay(now)}`),
      this.storage.get(`visits:${utcDay(now - 86_400_000)}`),
    ]);
    return Response.json(
      { live: Object.keys(presence).length, today: today ?? 0, yesterday: yesterday ?? 0 },
      { headers: { 'cache-control': 'no-store' } },
    );
  }
}

function utcDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hasOwnerCookie(request, env) {
  if (!env.DASH_KEY) return false;
  const m = (request.headers.get('cookie') ?? '').match(/(?:^|;\s*)dash=([0-9a-f]{64})/);
  return m !== null && m[1] === (await sha256Hex(env.DASH_KEY));
}

function notFound() {
  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === '/api/beat') {
      if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
      return env.LIVE.get(env.LIVE.idFromName('global')).fetch(request);
    }

    if (pathname === '/api/live' || pathname === '/live') {
      const viaCookie = await hasOwnerCookie(request, env);
      const viaKey =
        !viaCookie && Boolean(env.DASH_KEY) && url.searchParams.get('key') === env.DASH_KEY;
      if (!viaCookie && !viaKey) return notFound();

      if (pathname === '/api/live') {
        return env.LIVE.get(env.LIVE.idFromName('global')).fetch(request);
      }

      const page = await env.ASSETS.fetch(new Request(new URL('/live', url), request));
      const res = new Response(page.body, page);
      res.headers.set('cache-control', 'no-store'); // 공유 캐시에 대시보드가 남지 않게
      if (viaKey) {
        res.headers.append(
          'Set-Cookie',
          `dash=${await sha256Hex(env.DASH_KEY)}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        );
      }
      return res;
    }

    // run_worker_first가 위 경로만 워커로 보내므로 사실상 도달하지 않지만, 안전망으로 자산 폴백
    return env.ASSETS.fetch(request);
  },
};
