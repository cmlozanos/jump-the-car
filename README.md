# 🚗 Jump the Car 🚗

Un juego educativo y divertido para niños de 5 años donde deben ayudar a un coche a saltar sobre obstáculos y llegar a la meta.

## 🎮 Cómo Jugar

1. **Selecciona tu coche**: Elige entre 4 coches diferentes, cada uno con características únicas
2. **Ajusta los parámetros**: 
   - **Ángulo de Salto**: Controla la dirección del salto (20° - 80°)
   - **Velocidad**: Controla qué tan rápido va el coche (30 - 100)
   - **Aceleración**: Controla la fuerza del salto (5 - 20)
3. **¡Salta!**: Presiona el botón "¡SALTAR!" y observa cómo el coche vuela
4. **Llega a la meta**: Evita los obstáculos y llega a la bandera de meta

## 🚙 Coches Disponibles

- **Coche Rápido 🏎️**: Muy rápido pero difícil de controlar
- **Coche Saltador 🦘**: Salta muy alto
- **Coche Equilibrado ⚖️**: Bueno para todo
- **Coche Fuerte 💪**: Muy estable

## 🎯 Características

- Gráficos coloridos y amigables para niños
- Sistema de física realista para los saltos
- Múltiples niveles con diferentes desafíos
- Controles intuitivos con sliders visuales
- Animaciones suaves y divertidas

## 🌐 Publicación Gratuita en Internet

### Opción 1: GitHub Pages (Recomendado - Más Fácil)

GitHub Pages es completamente gratuito y se configura en minutos:

1. **Habilita GitHub Pages en tu repositorio:**
   - Ve a tu repositorio en GitHub: `https://github.com/cmlozanos/jump-the-car`
   - Haz clic en **Settings** (Configuración)
   - En el menú lateral, busca **Pages**
   - En **Source** (Fuente), selecciona **Deploy from a branch**
   - Selecciona la rama **main** (o **master** si es tu rama principal)
   - Selecciona la carpeta **/ (root)**
   - Haz clic en **Save**

2. **Espera unos minutos** mientras GitHub procesa tu sitio

3. **Tu juego estará disponible en:**
   ```
   https://cmlozanos.github.io/jump-the-car
   ```
   
   🎮 **¡Juega ahora!** Una vez configurado, tu juego estará disponible públicamente en la URL de arriba.

4. **Actualizaciones automáticas:** Cada vez que hagas `git push` a la rama main, tu sitio se actualizará automáticamente en unos minutos.

### Opción 2: Netlify (Muy Fácil - Despliegue Automático)

1. Ve a [netlify.com](https://www.netlify.com) y crea una cuenta gratuita
2. Haz clic en **Add new site** → **Import an existing project**
3. Conecta tu repositorio de GitHub
4. Netlify detectará automáticamente la configuración
5. Haz clic en **Deploy site**
6. Tu sitio estará disponible en una URL como: `https://jump-the-car-xyz.netlify.app`
7. Puedes personalizar el dominio en **Site settings** → **Change site name**

**Ventaja:** Netlify ofrece despliegues automáticos cada vez que haces push a GitHub.

### Opción 3: Vercel (Similar a Netlify)

1. Ve a [vercel.com](https://www.vercel.com) y crea una cuenta gratuita
2. Haz clic en **Add New Project**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente que es un sitio estático
5. Haz clic en **Deploy**
6. Tu sitio estará disponible en una URL como: `https://jump-the-car.vercel.app`

**Ventaja:** Vercel también ofrece despliegues automáticos y es muy rápido.

### Opción 4: Surge.sh (Desde la Terminal)

```bash
# Instala Surge globalmente
npm install -g surge

# Desde la carpeta del proyecto, ejecuta:
surge

# Te pedirá crear una cuenta (gratis) y elegir un dominio
# Ejemplo: jump-the-car.surge.sh
```

## 🚀 Instalación y Ejecución Local

### Opción 1: Usando Makefile (Recomendado)

El Makefile incluye un servidor web local para ejecutar el juego:

```bash
# Ver ayuda
make help

# Iniciar servidor (puerto 8000 por defecto)
make serve

# Iniciar servidor en otro puerto
make serve PORT=3000

# Iniciar servidor accesible desde otras máquinas
make serve HOST=0.0.0.0 PORT=8000

# Detener servidor
make stop

# Verificar dependencias
make install
```

Luego abre tu navegador en `http://localhost:8000`

### Opción 2: Servidor Python Manual

```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Opción 3: Servidor Node.js

```bash
npx http-server -p 8000
```

### Opción 4: Abrir directamente

Simplemente abre el archivo `index.html` en tu navegador web. Nota: Algunas funcionalidades pueden no funcionar correctamente al abrir el archivo directamente debido a restricciones de seguridad del navegador.

## 📝 Tecnologías Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla)
- Canvas API para renderizado 2D

## 🎨 Diseño

El juego está diseñado con:
- Colores brillantes y alegres
- Fuente Comic Sans MS para un aspecto infantil
- Animaciones suaves
- Interfaz intuitiva y fácil de usar

¡Diviértete saltando con el coche! 🎉

## Compatibilidad y retos educativos — 25 septiembre 2026

Adaptación aprobada al portal https://cmlozanos.github.io/games/: el botón ⌂
sale a todos los juegos. El reto compartido aparece al entrar y cada diez minutos
de reloj real, también tras volver de otra aplicación. La pausa educativa no
modifica `gamePaused`: conserva el panel de configuración/pausa manual, saltos,
posición, explosiones y temporizadores. El audio comienza apagado y se activa
únicamente mediante 🔇/🔊. No hay dependencia de Ubuntu ni de fuentes remotas.

Los parámetros físicos, coches, pistas y progreso existente permanecen sin cambios. El
service worker conserva exclusivamente sus propias cachés `jump-the-car-*` y
precarga recursos con las mismas versiones que solicita el juego, incluidos los
sprites de todos los niveles. Offline requiere una primera carga completa online.

Validación: `npm install`, `make build`, `make check`, `make test`.
`CHROME95_PATH=/ruta/a/Chromium make test` usa un motor Chromium 95 real. Esto no
sustituye verificar el rendimiento en la tablet Android 5.0.2 física.

Comprobado el 25/09/2026: `make check` y `make test` correctos en Chromium
151.0.7922.34 y 95.0.4630.0, a 1280×800 y 360×740. Las pruebas resuelven el
reto mediante su interfaz, saltan táctilmente, avanzan diez minutos de reloj,
comprueban pausa manual, física, partículas y temporizadores congelados y
reanudados. También arrancan offline con nuevo reto. Se corrigió el solapamiento
de botones móviles: su separación ahora utiliza los mismos píxeles CSS que sus
áreas táctiles, con fila horizontal en pantallas pequeñas.

Nota de dependencias preexistentes: `npm audit` detecta avisos altos en `sharp`
0.34.x del generador de iconos (desarrollo; no se carga en el navegador).
La actualización a 0.35.4 queda fuera de esta adaptación; no se ejecutó el
generador ni una actualización forzada de dependencias.

## Rendimiento para tablets — v1.5.1

Alcance aprobado: optimización compatible con Android 5/Chrome 95, conservación
del juego existente y modo ligero opcional. No cambia el progreso ni añade
servicios. El modo ligero es el predeterminado cuando no existe una preferencia
válida, también si el almacenamiento está bloqueado. Una elección explícita de
modo normal o ligero se conserva sin reescribir el progreso. El botón de hoja activa/desactiva el modo y conserva
solamente esa preferencia local (`jump-the-car-light-mode`). Si el almacenamiento
está bloqueado, el botón sigue funcionando durante la sesión.

- Física a 60 pasos por segundo, independientemente del ritmo de dibujo. Se
  conservan gravedad, impulsos y comprobación de colisiones de cada paso original.
  A 10/15/20/30/60 FPS se procesan respectivamente 6/4/3/2/1 pasos por fotograma.
  El máximo es ocho: tras bloqueos superiores a 133 ms no se intenta recuperar
  ilimitadamente el tiempo perdido. Por debajo de 7,5 FPS puede ralentizarse la
  simulación, sin aumentar distancias de salto o saltarse colisiones.
- Un solo bucle para carretera, salto y explosión. Las pausas manuales,
  educativas y la pestaña oculta no mantienen RAF ni repintado del juego. Al
  reanudar no se acumula el tiempo detenido. El reto sigue controlando su reloj.
  El audio activado por el usuario también se suspende al ocultar la pestaña y
  vuelve al mostrarla, sin cambiar la preferencia ni saltarse un reto pendiente.
- Cielo y HUD se prerenderizan y reutilizan. Cambiar nivel, vehículo, velocidad
  o modo invalida solo la caché correspondiente. Las estrellas no se regeneran
  aleatoriamente cada fotograma. Los botones de velocidad repintan el HUD también
  estando en pausa.
- Normal: 1200×600 píxeles. Ligero: 800×400 (55,6 % menos píxeles), hasta dos
  nubes, veinte estrellas y doce partículas sin halo de explosión.
  Selector sin pulso de sombras y sin capas decorativas costosas en modo ligero.
  El mundo lógico permanece 1200×600: ni recortes de pista ni cambios de hitboxes/tacto.
  Estos ahorros son de trabajo gráfico, no una promesa de FPS en hardware real.
- SW `jump-the-car-v1.5.1`, estáticos versionados y nuevo `frame-clock.js`
  precargado. No se eliminan cachés de otros juegos.

Comprobaciones reproducibles:

```sh
make build check
make physics-check
make test
CHROME95_PATH=/ruta/a/Chromium make test
QA_DIR=/ruta/temporal/de/capturas make test
```

`physics-check` ejecuta las funciones reales de física del juego y compara cada
paso contra ejecución directa a 60 Hz: catorce coches, cien configuraciones de
pista durante diez segundos o hasta colisión/meta, seis tipos de obstáculo fino,
meta, explosión, saltos, pausas, límite de recuperación y unicidad del RAF.
No demuestra que todas las pistas puedan completarse: comprueba equivalencia
temporal con las reglas existentes. Incluye un tramo diagnóstico sin obstáculos:
antes recorría 900/450/225 unidades en diez segundos a 60/30/15 FPS; ahora son
900 unidades en todos los ritmos comprobados.

`make test` comprueba interacción táctil, reto inicial y recurrente, pausa sin
repintados, caché diurna/nocturna, actualización de HUD, resolución sin cambio
físico, preferencia local y partida offline en ambos modos. Comprueba AudioContext
real suspendido mediante el evento de ocultación y la reanudación condicionada al
reto, sin modificar la preferencia. Registra tiempos de
120 dibujos como diagnóstico del motor de escritorio, no del dispositivo Android.

Validación final 25/09/2026: `make check` verde; dos escenarios completos en
Chromium 151.0.7922.34 y dos en Chromium 95.0.4630.0, a 1280×800 y 360×740.
La tanda 95 usa además el user agent Android 5.0.2/SM-T530NU/Chrome 95.0.4638.75;
esto comprueba rutas de navegador, no emula la CPU/GPU ni sustituye probar la tablet.
Cero reconstrucciones de cielo en 120 dibujos por modo y cero repintados durante
la pausa. En la última pasada95 los 120 dibujos tardaron 8,1/7,4 ms (normal/ligero,
tablet) y 7,9/7,2 ms (teléfono), solo tiempo de envío de órdenes Canvas desde JS.
No son FPS de presentación ni incluyen una medida fiable del coste de GPU.
Capturas revisadas en ambos tamaños/modos: botón de hoja reconocible, misma pista
visible y sin recortes nuevos. La segunda revisión independiente del código
confirmó el desacoplamiento de resolución, cachés, límites y único RAF.

Segunda auditoría de código: siguen presentes comentarios/documentación antigua
que describen cuatro coches y controles inexistentes, dos definiciones antiguas
de `playLandingSound`, emojis heredados y carga secuencial de SVG al entrar. No se
han rediseñado ni alterado esas partes fuera del alcance de rendimiento. La
explosión no tiene llamadores normales actuales; se conserva y prueba igualmente
para evitar que su antiguo RAF independiente produzca duplicaciones futuras.
