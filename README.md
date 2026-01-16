# 🚗 ¡Salta el Coche! 🚗

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
