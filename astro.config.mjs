// @ts-check
import { defineConfig } from 'astro/config';

// SITE cambia al pasar a producción: https://nuevo.lols.cl → https://lols.cl
export default defineConfig({
  site: process.env.SITE ?? 'https://nuevo.lols.cl',
  output: 'static',
  trailingSlash: 'always', // mismas URLs que el WordPress viejo (/quienes-somos/)
});
