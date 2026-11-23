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
