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

## 🚀 Instalación y Ejecución

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
