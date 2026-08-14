// ads.txt는 빌드 시점에 환경변수 ADSENSE_PUB에서 생성 — 게시자 ID를 저장소에 커밋하지 않기 위함.
// (파일 자체는 AdSense 크롤러가 읽어야 하므로 사이트에서는 공개 서빙됨)
export function GET() {
  const pub = process.env.ADSENSE_PUB ?? import.meta.env.ADSENSE_PUB;
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# placeholder — set ADSENSE_PUB build variable to publish the AdSense line\n';
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
