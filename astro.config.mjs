// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// site: 가비아에서 도메인 구매 후 실제 도메인으로 교체 (sitemap/canonical에 사용됨)
export default defineConfig({
  site: 'https://shiftcal.pages.dev',
  trailingSlash: 'never',
  integrations: [sitemap()],
});
