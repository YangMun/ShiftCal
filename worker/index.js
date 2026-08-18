// 실시간 방문자 카운터 워커.
// 정적 자산 앞단에서 /api/* 만 처리한다 (wrangler.jsonc의 run_worker_first).
//  - POST /api/beat?id=<uuid> : 페이지가 25초마다 보내는 하트비트. 새 id면 오늘 방문 수 +1.
//  - GET  /api/live           : { live, today, yesterday } — /live 대시보드가 폴링.
// 쿠키·개인정보 없음: id는 탭이 살아있는 동안만 존재하는 난수라서
// 기존 프라이버시 정책("cookie-free aggregate analytics")과 일치한다.

const TTL_MS = 70_000; // 하트비트(25초) 2회 연속 유실 시 이탈로 간주
const ID_RE = /^[0-9a-zA-Z-]{8,40}$/;
const MAX_PRESENCE = 20_000; // 악의적 id 폭주로 storage 값이 비대해지는 것 방지

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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/beat' || pathname === '/api/live') {
      if (pathname === '/api/beat' && request.method !== 'POST') {
        return new Response('method not allowed', { status: 405 });
      }
      const stub = env.LIVE.get(env.LIVE.idFromName('global'));
      return stub.fetch(request);
    }
    // run_worker_first가 /api/*만 워커로 보내므로 사실상 도달하지 않지만, 안전망으로 자산 폴백
    return env.ASSETS.fetch(request);
  },
};
