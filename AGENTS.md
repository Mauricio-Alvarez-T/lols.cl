## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Editor visual (marcas `data-ed-*`)

La Bóveda edita las obras dentro de este sitio, en un iframe. El contrato está en `docs/editor-visual.md`.
Al cambiar `CarruselObras`, `FichaObra`, `TarjetaProyecto`, `TarjetaContratada`, `Pictograma` o las listas de
`src/pages/index.astro` y `src/pages/proyectos/index.astro`, mantener las marcas `data-ed-*` y la página
`src/pages/editor/moldes.astro`. Después de `npm run build`: `node scripts/verificar-editor.mjs` y `npx vitest run`.
`node scripts/huella-dist.mjs --comparar <distA> <distB>` muestra si un cambio movió algo que ve el visitante.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
