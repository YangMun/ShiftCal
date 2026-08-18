// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// site: 가비아에서 도메인 구매 후 실제 도메인으로 교체 (sitemap/canonical에 사용됨)
export default defineConfig({
  site: 'https://ondutycal.com',
  trailingSlash: 'never',
  // 'file' 출력이라야 /slug 요청이 리다이렉트 없이 200으로 서빙됨 (canonical과 일치)
  build: { format: 'file' },
  // /live는 내부용 실시간 대시보드라 sitemap에서 제외 (페이지 자체도 noindex)
  integrations: [sitemap({ filter: (page) => !page.endsWith('/live') })],
});
