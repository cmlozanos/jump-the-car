# Jump the Car 2.0.0

## Cambios de esta versión

- Kit Family V2 local: fuente, tema claro/oscuro/sistema, viewport y puntos de sesión de una hora.
- Inicio vuelve al selector de este juego: no cambia la URL ni borra datos. El catálogo queda en el panel adulto.
- Pausa de adultos independiente del reto educativo y de la pausa manual; puntos únicamente en la llegada nativa, 10 por nivel y sin premiar el selector.
- Ajustes existentes trasladados sin clonar controles ni perder listeners. Audio apagado en cada carga; modo ligero por defecto (la preferencia explícita de Jump se conserva).
- Caché PWA v2.0.0 con los cuatro recursos locales exactos del kit, incluida la licencia OFL. Sin módulos ni CDN de ejecución.
- Los 100 niveles y los 14 coches son seleccionables sin borrar ni reescribir el progreso guardado para desbloquearlos.
- Corregida la llegada en salto: cruzar la línea termina la carrera aunque el coche esté por encima de la bandera. Antes podía pasar la meta y perder.
- Iconos de controles servidos como SVG original, sin rasterización intermedia que perdía detalles.
- Regresiones de física: pista 1 completa con saltos, colisión y reinicio, meta aérea; se conservan comparaciones a 10/15/20/30/60 FPS para todos los coches y pistas. La ruta de navegador activa el manejador nativo del canvas, sin teletransporte.
- No se afirma que todos los pares coche/pista ni todos los ritmos de toque permitan completar cada nivel.

## Validación y publicación

Ejecutar `make build check` y `make test` en este checkout. No se crea tag ni GitHub Release; esa coordinación es independiente.
Las pruebas de ruta acreditan la primera misión/pista, no una campaña completa ni hardware Android.

## Evidencia de esta entrega

- `make build check`: correcto; recursos locales y cuatro archivos del kit precargados.
- `make test`: correcto en Chromium 151.0.7922.34.
- Jump: 1280×800 y 360×740; tacto, reto recurrente, audio al ocultar, pausa manual/adulta, ambos modos de render, Home local y offline. Pista 1 terminada con cuatro saltos y 10 puntos, seguida de reintento.
- `make physics-check`: correcto; equivalencia temporal en 14 coches, 100 pistas y seis tipos de obstáculo, más ruta de pista 1, colisión/reintento y meta aérea.
- No ejecutado en Chrome 95 ni tablet física. No se han recorrido todas las misiones ni combinaciones coche/pista. No se declara ausencia de otros fallos.

## Shared-shell final fixes — 2026-11-23

- Shared kit matches the canonical `home/family-v2/` byte for byte: educational
  expiry closes Adult settings, shell keyboard events stay isolated, cookie
  fallback remains authoritative after failed storage writes, real keyboard/held
  pointer activity extends the session without disabling inactivity expiry, and
  educational overlays use the shared font. Game-scoped cache revision: `-shell2`.
- Delivery checks: `node --check family-v2/family.js`, `node --check sw.js` and
  `make check` passed. No gameplay source changed; no build regeneration needed.
- Reused coordinator evidence in `home/docs/v2/evidence/jump95.txt`: genuine
  Chromium 95.0.4630.0 native game checks, after native fixes and before these
  final shell fixes. Final standalone shell regressions: `shell-regressions95.txt`
  (5/5 Chromium 95) and `shell-regressions.txt` (10/10 modern Chromium/WebKit),
  in the same evidence directory. These are reused results, not new full-game
  browser runs against the final combination or physical Android certification.
  `home/docs/v2/CONTRACT.md` and `MATRIX.md` record the coordinated scope; all
  `home/` paths here are evidence references only, never runtime dependencies.
- No tags or GitHub Releases: coordinated separately.
