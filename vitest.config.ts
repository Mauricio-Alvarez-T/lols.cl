// Pruebas del editor visual (tests/): corren en Node con happy-dom como DOM y leen el HTML de
// dist/, así que van después de `npm run build` (en el deploy, después de verificar-obras-reales).
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['tests/**/*.test.ts'],
	},
});
