// ============================================================================
// CONSTANTES DEL JUEGO - AJUSTE FINO CENTRALIZADO
// ============================================================================

// FÍSICA DEL SALTO
const JUMP_PHYSICS = {
    GRAVITY: 0.18,                    // Gravedad (menor = cae más lento, mayor = cae más rápido)
    JUMP_VELOCITY_MULTIPLIER: 2.0,   // Factor multiplicador de velocidad inicial (mayor = saltos más altos)
};

// POSICIONAMIENTO
const POSITIONS = {
    CAR_FIXED_X: 150,                // Posición X fija del coche (no cambia)
    CAR_INITIAL_Y: 500,              // Posición Y inicial del coche
    GROUND_LEVEL: 500,                // Nivel del suelo donde el coche aterriza
    ROAD_Y: 520,                      // Posición Y donde comienza la pista
    ROAD_HEIGHT: 80,                  // Altura de la pista
    GOAL_Y: 520,                      // Posición Y de la meta (mismo nivel que la pista)
};

// DIMENSIONES
const DIMENSIONS = {
    CAR_WIDTH: 60,                    // Ancho del coche
    CAR_HEIGHT: 50,                   // Alto del coche
    GOAL_WIDTH: 100,                  // Ancho de la meta
    GOAL_HEIGHT: 60,                  // Alto de la meta
    GOAL_POLE_WIDTH: 8,               // Ancho del poste de la meta
    GOAL_POLE_HEIGHT_EXTRA: 30,       // Altura extra del poste de la meta
    CAR_SHADOW_WIDTH: 60,             // Ancho de la sombra del coche
    CAR_SHADOW_HEIGHT: 15,            // Alto de la sombra del coche
    CAR_SHADOW_OFFSET: 5,             // Offset de la sombra respecto al coche
};

// VELOCIDADES Y MOVIMIENTO
const SPEED = {
    ROAD_SCROLL: 1.5,                 // Velocidad de desplazamiento de la carretera (unidades de distancia por frame)
    ROAD_LINE_OFFSET: 40,             // Offset para animación de líneas de la carretera
    PIXELS_PER_DISTANCE_UNIT: 1.0,    // Escala: píxeles por unidad de distancia (ajustar si es necesario)
};

// PARÁMETROS BASE DE LOS COCHES
const CAR_BASE_STATS = {
    ANGLE: 45,                        // Ángulo base del salto (grados)
    SPEED: 9,                         // Velocidad base del coche
    ACCELERATION: 0.96,               // Factor de resistencia del aire (0-1)
};

// UI Y CONTROLES
const UI = {
    BUTTON_SIZE: 60,                  // Tamaño de los botones circulares
    BUTTON_PADDING: 20,               // Padding de los botones desde los bordes
    LEVEL_INFO_WIDTH: 150,            // Ancho del panel de información de nivel
    LEVEL_INFO_HEIGHT: 40,            // Alto del panel de información de nivel
    LEVEL_INFO_FONT_SIZE: 18,         // Tamaño de fuente del texto de nivel
    BUTTON_ICON_FONT_SIZE: 30,        // Tamaño de fuente de los iconos de botones
};

// COLISIONES Y DETECCIÓN
const COLLISION = {
    GOAL_DETECTION_RANGE: 50,         // Rango de detección de colisión con la meta
    CANVAS_BORDER_MARGIN: 0,          // Margen para colisiones con bordes del canvas
};

// VISUALIZACIÓN DE LA META
const GOAL_VISUAL = {
    DRAW_RANGE_BEFORE: 200,           // Rango antes del coche para dibujar la meta
    DRAW_RANGE_AFTER: 200,            // Rango después del coche para dibujar la meta
    CHECKERED_SQUARE_SIZE: 10,        // Tamaño de cada cuadrado de la bandera
    ARCH_RADIUS: 150,                 // Radio del arco decorativo de la meta
    TEXT_OFFSET_Y: 15,                // Offset vertical del texto "META"
};

// ============================================================================
// FIN DE CONSTANTES - NO MODIFICAR CÓDIGO ABAJO SIN ACTUALIZAR CONSTANTES
// ============================================================================

// Configuración del juego
let canvas = null;
let ctx = null;

// Estados del juego
let gameState = 'selecting'; // 'selecting', 'playing', 'jumping', 'won', 'lost', 'exploded'
let selectedCar = null;
let currentLevel = 1;
let attempts = 0;
let explosionActive = false;
let explosionParticles = [];

// Sistema de audio
let audioContext = null;
let engineSoundOscillator = null;
let engineSoundGain = null;
let isEngineSoundPlaying = false;
let gameLoopRunning = false; // Control para evitar múltiples bucles de juego

// Sprites cargados
const sprites = {
    cars: {},
    carShadow: null,
    obstacle: null,
    spikes: null,
    tree: null,
    hole: null,
    airplane: null,
    goal: null,
    cloud: null,
    sun: null
};

// Función para cargar una imagen
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

// Cargar todos los sprites
async function loadSprites() {
    try {
        // Cargar sprites de coches (6 coches disponibles)
        for (let i = 1; i <= 6; i++) {
            sprites.cars[i] = await loadImage(`sprites/cars/car_${i}.svg`);
        }
        
        // Cargar sprite de sombra
        sprites.carShadow = await loadImage('sprites/cars/car_shadow.svg');
        
        // Cargar sprites de obstáculos
        sprites.obstacle = await loadImage('sprites/environment/obstacle.svg');
        sprites.spikes = await loadImage('sprites/environment/spikes.svg');
        sprites.tree = await loadImage('sprites/environment/tree.svg');
        sprites.hole = await loadImage('sprites/environment/hole.svg');
        sprites.airplane = await loadImage('sprites/environment/airplane.svg');
        
        // Cargar sprites de ambiente
        sprites.goal = await loadImage('sprites/environment/goal.svg');
        sprites.cloud = await loadImage('sprites/environment/cloud.svg');
        sprites.sun = await loadImage('sprites/environment/sun.svg');
        
        console.log('Todos los sprites cargados exitosamente');
        return true;
    } catch (error) {
        console.error('Error cargando sprites:', error);
        return false;
    }
}

// Parámetros del salto (se establecen según el coche seleccionado)
let angle = CAR_BASE_STATS.ANGLE;
let speed = CAR_BASE_STATS.SPEED;
let acceleration = CAR_BASE_STATS.ACCELERATION;

// Posición del coche (fijo en X, solo se mueve verticalmente)
const carFixedX = POSITIONS.CAR_FIXED_X;
let carY = POSITIONS.CAR_INITIAL_Y;
let carVx = 0; // Velocidad horizontal (no se usa, el coche está fijo)
let carVy = 0; // Velocidad vertical
let isJumping = false;
let jumpStartTime = 0;

// Scroll de la carretera
let roadScrollX = 0; // Posición de scroll de la carretera
let roadSpeed = SPEED.ROAD_SCROLL; // Velocidad que aumenta con cada nivel

// Función para calcular la velocidad según el nivel (aumenta 0.1 por nivel)
function getRoadSpeedForLevel(level) {
    return SPEED.ROAD_SCROLL + (level - 1) * 0.1;
}

// Definición de coches disponibles (Monster Trucks Hot Wheels)
const cars = [
    {
        id: 1,
        name: 'Fire Blazer 🔥',
        color: '#dc143c',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Rojo',
        theme: {
            primary: '#dc143c',
            secondary: '#ff4500',
            accent: '#ffd700',
            gradient: 'linear-gradient(135deg, #dc143c 0%, #ff4500 100%)',
            icon: '🔥'
        }
    },
    {
        id: 2,
        name: 'Golden Bolt ⚡',
        color: '#ffd700',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Amarillo',
        theme: {
            primary: '#ffd700',
            secondary: '#ff8c00',
            accent: '#ff4500',
            gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
            icon: '⚡'
        }
    },
    {
        id: 3,
        name: 'Thunder Strike ⚡',
        color: '#00bfff',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Azul',
        theme: {
            primary: '#00bfff',
            secondary: '#0066cc',
            accent: '#ffff00',
            gradient: 'linear-gradient(135deg, #00bfff 0%, #0066cc 100%)',
            icon: '⚡'
        }
    },
    {
        id: 4,
        name: 'Neon Flash 💚',
        color: '#00ff7f',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Verde',
        theme: {
            primary: '#00ff7f',
            secondary: '#228b22',
            accent: '#32cd32',
            gradient: 'linear-gradient(135deg, #00ff7f 0%, #228b22 100%)',
            icon: '💚'
        }
    },
    {
        id: 5,
        name: 'Rainbow Rider 🌈',
        color: '#ff00ff',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Multicolor',
        theme: {
            primary: '#ff00ff',
            secondary: '#00ffff',
            accent: '#ffff00',
            gradient: 'linear-gradient(135deg, #ff0000 0%, #ff7f00 25%, #ffff00 50%, #00ff00 75%, #0000ff 100%)',
            icon: '🌈'
        }
    },
    {
        id: 6,
        name: 'Shadow Beast ⚫',
        color: '#1a1a1a',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Negro',
        theme: {
            primary: '#1a1a1a',
            secondary: '#2d2d2d',
            accent: '#c0c0c0',
            gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            icon: '⚫'
        }
    }
];

// Definición de niveles (distancias desde el inicio) - Con más espacio entre obstáculos
const levels = [
    {
        goalDistance: 2500, // Distancia total hasta la meta
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20 },
            { distance: 1000, y: 520, width: 40, height: 20 },
            { distance: 1500, y: 520, width: 40, height: 20 },
            { distance: 2000, y: 520, width: 40, height: 20 }
        ]
    },
    {
        goalDistance: 3000,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2400, y: 520, width: 60, height: 30, type: 'hole' }
        ]
    },
    {
        goalDistance: 3500,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 380, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3000, y: 320, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 4000,
        obstacles: [
            { distance: 500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 1000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 340, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 4500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2400, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3600, y: 380, width: 80, height: 40, type: 'airplane' },
            { distance: 4200, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 5000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 370, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 3500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4500, y: 380, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 5500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 370, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4800, y: 340, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 6000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 380, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 5000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 6500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 370, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 7000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 380, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 370, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' }
        ]
    },
    {
        goalDistance: 7500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 340, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 8000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 370, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 350, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 8500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 9000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 9500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 9000, y: 350, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 10000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 9000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 9500, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 10500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 9000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 9600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 10200, y: 340, width: 80, height: 40, type: 'airplane' }
        ]
    },
    {
        goalDistance: 11000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 9000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 9500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 10000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 10500, y: 520, width: 40, height: 20, type: 'spikes' }
        ]
    },
    {
        goalDistance: 11500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 9000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 9600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 10200, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 10800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 11400, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 12000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'airplane' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'airplane' },
            { distance: 9000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 9500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 10000, y: 350, width: 80, height: 40, type: 'airplane' },
            { distance: 10500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 11000, y: 340, width: 80, height: 40, type: 'airplane' },
            { distance: 11500, y: 520, width: 60, height: 30, type: 'hole' }
        ]
    }
];

let currentLevelData = levels[0];
let currentDistance = 0; // Distancia recorrida en el nivel actual

// ============================================================================
// SISTEMA DE AUDIO
// ============================================================================

// Inicializar contexto de audio
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Resumir el contexto si está suspendido (necesario para algunos navegadores)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    } catch (e) {
        console.warn('AudioContext no disponible:', e);
    }
}

// Función para resumir el contexto de audio (necesario para autoplay)
function resumeAudioContext() {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log('AudioContext resumido');
        });
    }
}

// Reproducir sonido del motor (en loop)
function startEngineSound() {
    if (!audioContext || isEngineSoundPlaying) return;
    
    try {
        // Crear oscilador principal (sonido grave del motor)
        engineSoundOscillator = audioContext.createOscillator();
        engineSoundOscillator.type = 'sawtooth';
        engineSoundOscillator.frequency.setValueAtTime(80, audioContext.currentTime); // Frecuencia baja para sonido de motor
        
        // Crear ganancia para controlar el volumen
        engineSoundGain = audioContext.createGain();
        engineSoundGain.gain.setValueAtTime(0.15, audioContext.currentTime); // Volumen bajo
        
        // Crear filtro para hacer el sonido más realista
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, audioContext.currentTime);
        
        // Conectar: oscilador -> filtro -> ganancia -> destino
        engineSoundOscillator.connect(filter);
        filter.connect(engineSoundGain);
        engineSoundGain.connect(audioContext.destination);
        
        // Iniciar el sonido
        engineSoundOscillator.start();
        isEngineSoundPlaying = true;
    } catch (e) {
        console.warn('Error al iniciar sonido del motor:', e);
    }
}

// Detener sonido del motor
function stopEngineSound() {
    if (!isEngineSoundPlaying || !engineSoundOscillator) return;
    
    try {
        if (engineSoundGain) {
            engineSoundGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        }
        setTimeout(() => {
            if (engineSoundOscillator) {
                engineSoundOscillator.stop();
                engineSoundOscillator.disconnect();
                engineSoundOscillator = null;
                engineSoundGain = null;
                isEngineSoundPlaying = false;
            }
        }, 100);
    } catch (e) {
        console.warn('Error al detener sonido del motor:', e);
        isEngineSoundPlaying = false;
    }
}

// Reproducir sonido de salto
function playJumpSound() {
    if (!audioContext) return;
    
    try {
        // Crear oscilador para el sonido de salto (sonido más agudo y corto)
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime); // Frecuencia media-alta
        
        // Envelope ADSR rápido para sonido de salto
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01); // Attack rápido
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15); // Decay rápido
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15); // Sonido corto
        
        // Agregar un segundo oscilador para hacer el sonido más interesante
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
        
        gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.warn('Error al reproducir sonido de salto:', e);
    }
}

// Reproducir sonido de choque/crash
function playCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido principal de choque (ruido de baja frecuencia)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(100, now); // Frecuencia baja para sonido grave
        oscillator1.frequency.exponentialRampToValueAtTime(50, now + 0.2); // Bajar la frecuencia
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.01); // Attack muy rápido
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3); // Decay
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.3);
        
        // Sonido secundario (ruido de impacto)
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(200, now);
        oscillator2.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.005);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.2);
        
        // Sonido de "clank" metálico
        const oscillator3 = audioContext.createOscillator();
        const gainNode3 = audioContext.createGain();
        
        oscillator3.type = 'triangle';
        oscillator3.frequency.setValueAtTime(300, now);
        oscillator3.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        
        gainNode3.gain.setValueAtTime(0, now);
        gainNode3.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gainNode3.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        oscillator3.connect(gainNode3);
        gainNode3.connect(audioContext.destination);
        
        oscillator3.start(now);
        oscillator3.stop(now + 0.15);
    } catch (e) {
        console.warn('Error al reproducir sonido de choque:', e);
    }
}

// Reproducir sonido de victoria/ganador
function playWinSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Melodía ascendente de victoria (3 notas)
        const notes = [523.25, 659.25, 783.99]; // Do, Mi, Sol (acorde mayor)
        const durations = [0.15, 0.15, 0.3];
        
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now + index * 0.15);
            
            gainNode.gain.setValueAtTime(0, now + index * 0.15);
            gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + 0.01);
            gainNode.gain.linearRampToValueAtTime(0.3, now + index * 0.15 + durations[index] - 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.15 + durations[index]);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start(now + index * 0.15);
            oscillator.stop(now + index * 0.15 + durations[index]);
        });
        
        // Agregar un sonido de "fanfarria" al final
        setTimeout(() => {
            const fanfareOsc = audioContext.createOscillator();
            const fanfareGain = audioContext.createGain();
            
            fanfareOsc.type = 'square';
            fanfareOsc.frequency.setValueAtTime(880, audioContext.currentTime); // La agudo
            
            fanfareGain.gain.setValueAtTime(0, audioContext.currentTime);
            fanfareGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.01);
            fanfareGain.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.2);
            fanfareGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            fanfareOsc.connect(fanfareGain);
            fanfareGain.connect(audioContext.destination);
            
            fanfareOsc.start(audioContext.currentTime);
            fanfareOsc.stop(audioContext.currentTime + 0.4);
        }, 600);
    } catch (e) {
        console.warn('Error al reproducir sonido de victoria:', e);
    }
}

// ============================================================================
// FIN DEL SISTEMA DE AUDIO
// ============================================================================

// Inicialización
async function init() {
    // Inicializar canvas y contexto
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas no encontrado');
        return;
    }
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('No se pudo obtener el contexto 2D del canvas');
        return;
    }
    
    // Inicializar audio
    initAudio();
    
    // Cargar sprites primero
    await loadSprites();
    
    setupCarSelection();
    setupControls();
    setupEventListeners();
    resetGame();
}

// Configurar panel de selección de coches
function setupCarSelection() {
    const carsGrid = document.getElementById('carsGrid');
    carsGrid.innerHTML = '';
    
    console.log(`Creando ${cars.length} coches en el panel de selección`);
    
    cars.forEach(car => {
        console.log(`Creando coche ${car.id}: ${car.name}`);
        const carOption = document.createElement('div');
        carOption.className = 'car-option';
        
        // Crear elemento de imagen para el sprite del coche
        const carSpriteDiv = document.createElement('div');
        carSpriteDiv.className = 'car-sprite';
        
        // Crear imagen del coche usando el sprite SVG
        const carImg = document.createElement('img');
        carImg.src = `sprites/cars/car_${car.id}.svg`;
        carImg.alt = car.name;
        carImg.style.width = '100%';
        carImg.style.height = '100%';
        carImg.style.objectFit = 'contain';
        carImg.style.display = 'block';
        
        // Fallback: si la imagen no carga, mostrar color de fondo
        carImg.onerror = function() {
            console.error(`Error cargando sprite para coche ${car.id}: ${carImg.src}`);
            this.style.display = 'none';
            carSpriteDiv.style.background = car.color;
            carSpriteDiv.style.border = '3px solid #2d3436';
        };
        
        carImg.onload = function() {
            console.log(`Sprite cargado exitosamente para coche ${car.id}`);
        };
        
        carSpriteDiv.appendChild(carImg);
        
        carOption.innerHTML = `
            <div class="car-name">${car.name}</div>
            <div class="car-stats">${car.description}</div>
        `;
        carOption.insertBefore(carSpriteDiv, carOption.firstChild);
        
        carOption.addEventListener('click', (e) => selectCar(car, e.currentTarget));
        carsGrid.appendChild(carOption);
    });
    
    console.log(`Total de coches agregados al grid: ${carsGrid.children.length}`);
}

// Seleccionar coche
function selectCar(car, element = null) {
    selectedCar = car;
    document.querySelectorAll('.car-option').forEach(opt => opt.classList.remove('selected'));
    
    // Si se proporciona el elemento, marcarlo como seleccionado
    if (element) {
        element.classList.add('selected');
    } else {
        // Si no se proporciona, buscar el elemento correspondiente al coche
        const carOptions = document.querySelectorAll('.car-option');
        carOptions.forEach((opt, index) => {
            if (cars[index].id === car.id) {
                opt.classList.add('selected');
            }
        });
    }
    
    // Aplicar valores pre-fijados del coche (no ajustables)
    angle = car.baseAngle;
    speed = car.baseSpeed;
    acceleration = car.baseAcceleration;
    
    // Aplicar tema visual del coche seleccionado
    applyCarTheme(car);
    
    // Mostrar panel de juego
    setTimeout(() => {
        document.getElementById('carSelectionPanel').style.display = 'none';
        document.getElementById('gamePanel').style.display = 'flex';
        gameState = 'playing';
        resetGame();
        draw();
        // Iniciar sonido del motor cuando comienza el juego
        startEngineSound();
        // Iniciar el bucle del juego automáticamente
        if (canvas && ctx && !gameLoopRunning) {
            gameLoop();
        }
    }, 500);
}

// Aplicar tema visual según el coche seleccionado
function applyCarTheme(car) {
    const theme = car.theme;
    const header = document.querySelector('.header h1');
    
    // Actualizar título del header con el icono del coche
    if (header) {
        header.textContent = `${theme.icon} Monster Trucks Hot Wheels ${theme.icon}`;
        // Usar color sólido con sombra para mejor legibilidad
        header.style.color = theme.primary;
        header.style.textShadow = `2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px ${theme.primary}80`;
        header.style.background = 'none';
        header.style.webkitBackgroundClip = 'unset';
        header.style.webkitTextFillColor = 'unset';
        header.style.backgroundClip = 'unset';
    }
}

// Restaurar tema por defecto
function resetDefaultTheme() {
    const header = document.querySelector('.header h1');
    
    if (header) {
        header.textContent = '🔥 Monster Trucks Hot Wheels 🔥';
        header.style.color = '#ff6b6b';
        header.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 107, 107, 0.5)';
        header.style.background = 'none';
        header.style.webkitBackgroundClip = 'unset';
        header.style.webkitTextFillColor = 'unset';
        header.style.backgroundClip = 'unset';
    }
}

// Cambiar coche (volver al panel de selección sin perder el nivel)
function changeCar() {
    // Solo permitir cambiar coche si no está saltando
    if (isJumping || gameState === 'jumping' || gameState === 'exploded') {
        return;
    }
    
    // Detener sonido del motor cuando se vuelve a selección
    stopEngineSound();
    
    // Ocultar panel de juego y mostrar panel de selección
    document.getElementById('gamePanel').style.display = 'none';
    document.getElementById('carSelectionPanel').style.display = 'block';
    gameState = 'selecting';
    
    // Resaltar el coche actualmente seleccionado
    document.querySelectorAll('.car-option').forEach((opt, index) => {
        opt.classList.remove('selected');
        if (selectedCar && cars[index].id === selectedCar.id) {
            opt.classList.add('selected');
        }
    });
    
    // Restaurar tema por defecto cuando se vuelve a selección
    resetDefaultTheme();
}

// Configurar controles (ya no hay sliders, solo botones)
function setupControls() {
    // Los valores están pre-fijados según el coche seleccionado
    // No hay sliders para ajustar
}

// Actualizar displays de controles (ya no se usa, pero se mantiene para compatibilidad)
function updateControlDisplays() {
    // Función vacía - las estadísticas ya no se muestran
}

// Configurar event listeners
function setupEventListeners() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas no encontrado');
        return;
    }
    const buttonSize = UI.BUTTON_SIZE;
    const padding = UI.BUTTON_PADDING;
    
    // Función para obtener posición del toque/clic relativa al canvas
    function getCanvasPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let x, y;
        if (e.touches && e.touches.length > 0) {
            x = (e.touches[0].clientX - rect.left) * scaleX;
            y = (e.touches[0].clientY - rect.top) * scaleY;
        } else {
            x = (e.clientX - rect.left) * scaleX;
            y = (e.clientY - rect.top) * scaleY;
        }
        return { x, y };
    }
    
    // Función para verificar si se tocó un botón
    function checkButtonClick(x, y) {
        // Botón de cambiar coche (esquina superior derecha)
        const changeX = canvas.width - padding - buttonSize;
        const changeY = padding;
        const changeCenterX = changeX + buttonSize/2;
        const changeCenterY = changeY + buttonSize/2;
        const changeDist = Math.sqrt((x - changeCenterX) ** 2 + (y - changeCenterY) ** 2);
        
        if (changeDist <= buttonSize/2) {
            changeCar();
            return true;
        }
        
        return false;
    }
    
    // Tocar el canvas para saltar o interactuar con botones (tablet)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const pos = getCanvasPosition(e);
        
        // Verificar si se tocó un botón
        if (checkButtonClick(pos.x, pos.y)) {
            return;
        }
        
        // Si no es un botón, saltar
        if (gameState === 'playing' || gameState === 'jumping') {
            startJump();
        }
    });
    
    canvas.addEventListener('click', (e) => {
        const pos = getCanvasPosition(e);
        
        // Verificar si se hizo clic en un botón
        if (checkButtonClick(pos.x, pos.y)) {
            return;
        }
        
        // Si no es un botón, saltar
        if (gameState === 'playing' || gameState === 'jumping') {
            startJump();
        }
    });
    
    document.getElementById('retryButton').addEventListener('click', () => {
        document.getElementById('messageOverlay').style.display = 'none';
        resumeAudioContext(); // Resumir audio si está suspendido
        resetGame();
    });
    document.getElementById('nextLevelButton').addEventListener('click', () => {
        document.getElementById('messageOverlay').style.display = 'none';
        resumeAudioContext(); // Resumir audio si está suspendido
        nextLevel();
    });
    document.getElementById('restartFromLevel1Button').addEventListener('click', () => {
        document.getElementById('messageOverlay').style.display = 'none';
        resumeAudioContext(); // Resumir audio si está suspendido
        restartFromLevel1();
    });
    
    // Resumir audio al hacer clic en el canvas (para cumplir con política de autoplay)
    canvas.addEventListener('click', resumeAudioContext);
    canvas.addEventListener('touchstart', resumeAudioContext);
}

// Iniciar salto
function startJump() {
    // Solo permitir saltar si no está saltando y el juego está en estado 'playing'
    if (isJumping || gameState !== 'playing') return;
    
    // Verificar si ya pasó la meta
    if (currentDistance >= currentLevelData.goalDistance) {
        gameState = 'lost';
        showMessage('¡Oh no! 😢', 'Te pasaste de la meta. ¡Inténtalo de nuevo!');
        return;
    }
    
    // Verificar colisión antes de saltar (por si acaso)
    const collisionType = checkObstacleCollisions();
    if (collisionType) {
        gameState = 'lost';
        playCrashSound(); // Reproducir sonido de choque
        const obstacleName = obstacleMessages[collisionType] || 'un obstáculo';
        showMessage('¡Oh no! 😢', `Chocaste con ${obstacleName}. ¡Inténtalo de nuevo!`);
        return;
    }
    
    attempts++;
    
    // Reproducir sonido de salto
    playJumpSound();
    
    isJumping = true;
    gameState = 'jumping';
    jumpStartTime = Date.now();
    
    // Calcular velocidad inicial basada en ángulo y velocidad
    const angleRad = (angle * Math.PI) / 180;
    carVy = -speed * Math.sin(angleRad) * JUMP_PHYSICS.JUMP_VELOCITY_MULTIPLIER;
    
    // El coche NO se mueve horizontalmente (carVx = 0 siempre, está fijo en X)
    carVx = 0;
}

// Bucle principal del juego
function gameLoop() {
    if (gameState === 'lost' || gameState === 'won' || gameState === 'exploded') {
        // Si el juego terminó, solo dibujar y parar
        if (gameState === 'exploded' && explosionActive) {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        } else {
            gameLoopRunning = false; // Marcar que el bucle se detuvo
        }
        return;
    }
    
    gameLoopRunning = true; // Marcar que el bucle está ejecutándose
    update();
    draw();
    
    // Continuar el bucle mientras:
    // - El coche está saltando
    // - El coche está explotando
    // - El juego está en estado playing (carretera en movimiento)
    if (isJumping || explosionActive || gameState === 'playing') {
        requestAnimationFrame(gameLoop);
    } else {
        gameLoopRunning = false; // Marcar que el bucle se detuvo
    }
}

// Iniciar el juego automáticamente
function startGameLoop() {
    if (gameState === 'playing' || gameState === 'jumping') {
        gameLoop();
    }
}

// Actualizar física
function update() {
    const carWidth = DIMENSIONS.CAR_WIDTH;
    const carHeight = DIMENSIONS.CAR_HEIGHT;
    const groundLevel = POSITIONS.GROUND_LEVEL;
    
    // Mover la carretera hacia la izquierda (scroll)
    if (gameState === 'playing' || gameState === 'jumping') {
        currentDistance += roadSpeed;
        roadScrollX += roadSpeed;
    }
    
    // Si el coche está saltando, actualizar física vertical
    if (isJumping) {
        const gravity = JUMP_PHYSICS.GRAVITY;
        
        // Aplicar gravedad a la velocidad vertical
        carVy += gravity;
        
        // Actualizar posición vertical
        carY += carVy;
        
        // Verificar colisiones con bordes verticales del canvas
        if (carY < 0 || carY + carHeight > canvas.height) {
            // Colisión con borde del canvas
            gameState = 'lost';
            isJumping = false;
            playCrashSound(); // Reproducir sonido de choque
            showMessage('¡Oh no! 😢', 'Chocaste con el borde del camino. ¡Inténtalo de nuevo!');
            return;
        }
        
        // Verificar colisiones con obstáculos
        const collisionType = checkObstacleCollisions();
        if (collisionType) {
            gameState = 'lost';
            isJumping = false;
            playCrashSound(); // Reproducir sonido de choque
            const obstacleName = obstacleMessages[collisionType] || 'un obstáculo';
            showMessage('¡Oh no! 😢', `Chocaste con ${obstacleName}. ¡Inténtalo de nuevo!`);
            return;
        }
        
        // Verificar si llegó a la meta mientras salta
        if (checkGoalReached()) {
            gameState = 'won';
            isJumping = false;
            playWinSound(); // Reproducir sonido de victoria
            showMessage('¡Felicidades! 🎉', '¡Llegaste a la meta! ¡Eres genial!', true);
            return;
        }
        
        // Verificar si el coche está en el suelo
        if (carY >= groundLevel && carVy > 0) {
            carY = groundLevel;
            carVy = 0;
            isJumping = false;
            gameState = 'playing'; // Volver al estado de juego para permitir otro salto
            
            // Verificar si pasó la meta antes de detenerse
            // Solo si la meta ya pasó completamente por el coche (está a la izquierda del coche)
            // Y solo si no colisionó con la meta
            if (!checkGoalReached()) {
                const goalScreenX = carFixedX + (currentLevelData.goalDistance - currentDistance);
                const goalWidth = DIMENSIONS.GOAL_WIDTH;
                // Solo activar si la meta pasó completamente (está a la izquierda del coche)
                if (goalScreenX + goalWidth < carFixedX - 10 && currentDistance > currentLevelData.goalDistance) {
                    gameState = 'lost';
                    showMessage('¡Oh no! 😢', 'Te pasaste de la meta. ¡Inténtalo de nuevo!');
                    return;
                }
            }
        }
    } else if (gameState === 'playing') {
        // Verificar colisiones con obstáculos incluso cuando no está saltando (en el suelo)
        const collisionType = checkObstacleCollisions();
        if (collisionType) {
            gameState = 'lost';
            playCrashSound(); // Reproducir sonido de choque
            const obstacleName = obstacleMessages[collisionType] || 'un obstáculo';
            showMessage('¡Oh no! 😢', `Chocaste con ${obstacleName}. ¡Inténtalo de nuevo!`);
            return;
        }
        
        // Si no está saltando pero está en estado playing, verificar si llegó a la meta
        if (checkGoalReached()) {
            gameState = 'won';
            playWinSound(); // Reproducir sonido de victoria
            showMessage('¡Felicidades! 🎉', '¡Llegaste a la meta! ¡Eres genial!', true);
            return;
        }
        
        // Verificar si pasó la meta
        // Solo si la meta ya pasó completamente por el coche (está a la izquierda del coche)
        // Y solo si no colisionó con la meta
        if (!checkGoalReached()) {
            const goalScreenX = carFixedX + (currentLevelData.goalDistance - currentDistance);
            const goalWidth = 100;
            // Solo activar si la meta pasó completamente (está a la izquierda del coche)
            if (goalScreenX + goalWidth < carFixedX - 10 && currentDistance > currentLevelData.goalDistance) {
                gameState = 'lost';
                showMessage('¡Oh no! 😢', 'Te pasaste de la meta. ¡Inténtalo de nuevo!');
                return;
            }
        }
    }
}

// Mapeo de tipos de obstáculos a mensajes
const obstacleMessages = {
    'spikes': 'pinchos',
    'tree': 'un árbol',
    'hole': 'un agujero',
    'airplane': 'un avión',
    'obstacle': 'una roca'
};

// Verificar colisiones con obstáculos
function checkObstacleCollisions() {
    // No verificar colisiones si el coche ya pasó la meta
    if (currentDistance >= currentLevelData.goalDistance) {
        return null;
    }
    
    const carWidth = DIMENSIONS.CAR_WIDTH;
    const carHeight = DIMENSIONS.CAR_HEIGHT;
    
    for (const obstacle of currentLevelData.obstacles) {
        // No verificar colisiones con obstáculos que estén después de la meta (en distancia absoluta)
        if (obstacle.distance >= currentLevelData.goalDistance) {
            continue;
        }
        
        // Calcular posición X del obstáculo en pantalla
        // Los obstáculos se posicionan basándose en la distancia relativa al coche
        // Usamos carFixedX como referencia y calculamos la posición relativa
        const distanceFromCar = obstacle.distance - currentDistance;
        const obstacleScreenX = carFixedX + distanceFromCar * SPEED.PIXELS_PER_DISTANCE_UNIT;
        
        // Verificar si el obstáculo está en pantalla (entre -width y canvas.width)
        // Y asegurarse de que el obstáculo no esté después de la meta en términos de posición actual
        if (obstacleScreenX + obstacle.width > 0 && obstacleScreenX < canvas.width && obstacle.distance < currentLevelData.goalDistance) {
            // Verificar colisión: el coche está fijo en carFixedX, el obstáculo se mueve
            const carLeft = carFixedX;
            const carRight = carFixedX + carWidth;
            const carTop = carY;
            const carBottom = carY + carHeight;
            
            const obstacleLeft = obstacleScreenX;
            const obstacleRight = obstacleScreenX + obstacle.width;
            const obstacleTop = obstacle.y;
            const obstacleBottom = obstacle.y + obstacle.height;
            
            // Colisión AABB (Axis-Aligned Bounding Box)
            if (carRight > obstacleLeft &&
                carLeft < obstacleRight &&
                carBottom > obstacleTop &&
                carTop < obstacleBottom) {
                // Retornar el tipo de obstáculo con el que chocó
                return obstacle.type || 'obstacle';
            }
        }
    }
    return null;
}

// Verificar si llegó a la meta (colisión con la bandera)
function checkGoalReached() {
    const carWidth = DIMENSIONS.CAR_WIDTH;
    const carHeight = DIMENSIONS.CAR_HEIGHT;
    const goalY = POSITIONS.GOAL_Y;
    const goalWidth = DIMENSIONS.GOAL_WIDTH;
    const goalHeight = DIMENSIONS.GOAL_HEIGHT;
    
    // Calcular posición X de la meta en pantalla
    // La meta se posiciona basándose en la distancia relativa al coche
    // Cuando currentDistance = goalDistance, la meta debe estar en carFixedX
    const distanceFromCar = currentLevelData.goalDistance - currentDistance;
    const goalScreenX = carFixedX + distanceFromCar * SPEED.PIXELS_PER_DISTANCE_UNIT;
    
    // Verificar si la meta está cerca del coche (dentro de un rango razonable)
    if (goalScreenX + goalWidth < carFixedX - COLLISION.GOAL_DETECTION_RANGE || goalScreenX > carFixedX + carWidth + COLLISION.GOAL_DETECTION_RANGE) {
        return false; // La meta está demasiado lejos
    }
    
    // Verificar colisión real con la bandera usando AABB
    const carLeft = carFixedX;
    const carRight = carFixedX + carWidth;
    const carTop = carY;
    const carBottom = carY + carHeight;
    
    const goalLeft = goalScreenX;
    const goalRight = goalScreenX + goalWidth;
    const goalTop = goalY;
    const goalBottom = goalY + goalHeight;
    
    // Colisión AABB: el coche debe estar intersectando con la bandera
    return (carRight > goalLeft &&
            carLeft < goalRight &&
            carBottom > goalTop &&
            carTop < goalBottom);
}

// Dibujar en el canvas
function draw() {
    if (!canvas || !ctx) return;
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar fondo
    drawBackground();
    
    // Dibujar carretera
    drawRoad();
    
    // Dibujar obstáculos
    drawObstacles();
    
    // Dibujar meta
    drawGoal();
    
    // Dibujar coche (solo si no ha explotado)
    if (!explosionActive) {
        drawCar();
    }
    
    // Dibujar explosión si está activa
    if (explosionActive) {
        drawExplosion();
    }
    
    // Dibujar nubes
    drawClouds();
    
    // Dibujar botones dentro del canvas (solo iconografías)
    drawCanvasButtons();
}

// Dibujar botones dentro del canvas
function drawCanvasButtons() {
    if (!canvas || !ctx) return;
    
    const buttonSize = UI.BUTTON_SIZE;
    const padding = UI.BUTTON_PADDING;
    
    // Botón de cambiar coche (esquina superior derecha)
    const changeX = canvas.width - padding - buttonSize;
    const changeY = padding;
    
    // Fondo del botón
    ctx.fillStyle = 'rgba(162, 155, 254, 0.8)';
    ctx.beginPath();
    ctx.arc(changeX + buttonSize/2, changeY + buttonSize/2, buttonSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Borde
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Icono de cambiar coche
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${UI.BUTTON_ICON_FONT_SIZE}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚗', changeX + buttonSize/2, changeY + buttonSize/2);
    
    // Información del nivel (esquina superior izquierda)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(padding, padding, UI.LEVEL_INFO_WIDTH, UI.LEVEL_INFO_HEIGHT);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, UI.LEVEL_INFO_WIDTH, UI.LEVEL_INFO_HEIGHT);
    
    ctx.fillStyle = '#2d3436';
    ctx.font = `bold ${UI.LEVEL_INFO_FONT_SIZE}px Comic Sans MS`;
    ctx.textAlign = 'left';
    ctx.fillText(`Nivel: ${currentLevel}`, padding + 10, padding + 25);
}

// Dibujar fondo
function drawBackground() {
    // Cielo
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87ceeb');
    skyGradient.addColorStop(0.5, '#98d8c8');
    skyGradient.addColorStop(1, '#f7dc6f');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Sol (usando sprite)
    if (sprites.sun) {
        ctx.drawImage(sprites.sun, 1050, 30, 100, 100);
    } else {
        // Fallback si el sprite no está cargado
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(1100, 80, 50, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Dibujar nubes
function drawClouds() {
    if (sprites.cloud) {
        // Dibujar nubes usando sprite
        ctx.drawImage(sprites.cloud, 150, 70, 100, 60);
        ctx.drawImage(sprites.cloud, 450, 120, 100, 60);
        ctx.drawImage(sprites.cloud, 750, 90, 100, 60);
    } else {
        // Fallback si el sprite no está cargado
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        drawCloud(200, 100);
        drawCloud(500, 150);
        drawCloud(800, 120);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 20, 25, 0, Math.PI * 2);
    ctx.fill();
}

// Dibujar carretera con scroll
function drawRoad() {
    // Carretera principal
    ctx.fillStyle = '#555';
    ctx.fillRect(0, POSITIONS.ROAD_Y, canvas.width, POSITIONS.ROAD_HEIGHT);
    
    // Líneas de la carretera con scroll
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    const lineOffset = roadScrollX % SPEED.ROAD_LINE_OFFSET;
    const roadCenterY = POSITIONS.ROAD_Y + POSITIONS.ROAD_HEIGHT / 2;
    ctx.moveTo(-lineOffset, roadCenterY);
    ctx.lineTo(canvas.width - lineOffset, roadCenterY);
    ctx.moveTo(-lineOffset + SPEED.ROAD_LINE_OFFSET, roadCenterY);
    ctx.lineTo(canvas.width - lineOffset + SPEED.ROAD_LINE_OFFSET, roadCenterY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Bordes de la carretera
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, POSITIONS.ROAD_Y);
    ctx.lineTo(canvas.width, POSITIONS.ROAD_Y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, POSITIONS.ROAD_Y + POSITIONS.ROAD_HEIGHT);
    ctx.lineTo(canvas.width, POSITIONS.ROAD_Y + POSITIONS.ROAD_HEIGHT);
    ctx.stroke();
}

// Dibujar obstáculos
function drawObstacles() {
    // No dibujar obstáculos si el coche ya pasó la meta
    if (currentDistance >= currentLevelData.goalDistance) {
        return;
    }
    
    currentLevelData.obstacles.forEach((obstacle, index) => {
        // No dibujar obstáculos que estén después de la meta (en distancia absoluta)
        if (obstacle.distance >= currentLevelData.goalDistance) {
            return;
        }
        
        // Calcular posición X del obstáculo en pantalla
        // Los obstáculos se posicionan basándose en la distancia relativa al coche
        // Usamos carFixedX como referencia y calculamos la posición relativa
        const distanceFromCar = obstacle.distance - currentDistance;
        const obstacleScreenX = carFixedX + distanceFromCar * SPEED.PIXELS_PER_DISTANCE_UNIT;
        
        // Solo dibujar si el obstáculo está en pantalla (entre -width y canvas.width)
        // Y asegurarse de que el obstáculo no esté después de la meta en términos de posición actual
        if (obstacleScreenX + obstacle.width > 0 && obstacleScreenX < canvas.width && obstacle.distance < currentLevelData.goalDistance) {
            // Determinar qué sprite usar según el tipo de obstáculo
            const obstacleType = obstacle.type || 'obstacle'; // Por defecto 'obstacle' si no se especifica
            let spriteToUse = null;
            
            switch(obstacleType) {
                case 'spikes':
                    spriteToUse = sprites.spikes;
                    break;
                case 'tree':
                    spriteToUse = sprites.tree;
                    break;
                case 'hole':
                    spriteToUse = sprites.hole;
                    break;
                case 'airplane':
                    spriteToUse = sprites.airplane;
                    break;
                case 'obstacle':
                default:
                    spriteToUse = sprites.obstacle;
                    break;
            }
            
            if (spriteToUse) {
                // Dibujar obstáculo usando sprite según su tipo
                ctx.drawImage(spriteToUse, obstacleScreenX, obstacle.y, obstacle.width, obstacle.height);
            } else {
                // Fallback si el sprite no está cargado
                // Sombra
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(obstacleScreenX + 5, obstacle.y + obstacle.height, obstacle.width - 10, 5);
                
                // Cuerpo del obstáculo (roca)
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(obstacleScreenX, obstacle.y, obstacle.width, obstacle.height);
                
                // Detalles de la roca (textura)
                ctx.fillStyle = '#654321';
                ctx.fillRect(obstacleScreenX + 10, obstacle.y + 5, obstacle.width - 20, obstacle.height - 10);
            }
            
            // Señal de peligro (emoji de advertencia) - solo para algunos tipos
            if (obstacleType !== 'tree' && obstacleType !== 'airplane') {
                // Los árboles son más altos y los aviones están en el aire, no necesitan el emoji arriba
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('⚠️', obstacleScreenX + obstacle.width / 2, obstacle.y - 10);
            }
        }
    });
}

// Dibujar meta estilo carreras (bandera a cuadros)
function drawGoal() {
    const distanceToGoal = currentLevelData.goalDistance - currentDistance;
    // La meta debe estar en la misma posición que en checkGoalReached
    // Cuando currentDistance = goalDistance, la meta debe estar en carFixedX
    const distanceFromCar = currentLevelData.goalDistance - currentDistance;
    const goalScreenX = carFixedX + distanceFromCar * SPEED.PIXELS_PER_DISTANCE_UNIT;
    const goalY = POSITIONS.GOAL_Y;
    const goalWidth = DIMENSIONS.GOAL_WIDTH;
    const goalHeight = DIMENSIONS.GOAL_HEIGHT;
    
    // Dibujar la meta cuando está visible en pantalla o cerca
    if (goalScreenX + goalWidth > -GOAL_VISUAL.DRAW_RANGE_BEFORE && goalScreenX < canvas.width + GOAL_VISUAL.DRAW_RANGE_AFTER) {
        // Poste de la bandera
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(goalScreenX - DIMENSIONS.GOAL_POLE_WIDTH, goalY, DIMENSIONS.GOAL_POLE_WIDTH, goalHeight + DIMENSIONS.GOAL_POLE_HEIGHT_EXTRA);
        
        // Bandera a cuadros estilo carreras (checkered flag)
        const squareSize = GOAL_VISUAL.CHECKERED_SQUARE_SIZE;
        const rows = Math.ceil(goalHeight / squareSize);
        const cols = Math.ceil(goalWidth / squareSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = goalScreenX + col * squareSize;
                const y = goalY + row * squareSize;
                
                // Alternar colores en patrón de ajedrez
                if ((row + col) % 2 === 0) {
                    ctx.fillStyle = '#ffffff';
                } else {
                    ctx.fillStyle = '#000000';
                }
                
                ctx.fillRect(x, y, squareSize, squareSize);
            }
        }
        
        // Borde de la bandera
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.strokeRect(goalScreenX, goalY, goalWidth, goalHeight);
        
        // Arco de meta decorativo
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(goalScreenX + goalWidth / 2, goalY + goalHeight, GOAL_VISUAL.ARCH_RADIUS, Math.PI, 0);
        ctx.stroke();
        
        // Texto "META" con efecto
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Comic Sans MS';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('META', goalScreenX + goalWidth / 2, goalY - GOAL_VISUAL.TEXT_OFFSET_Y);
        ctx.fillText('META', goalScreenX + goalWidth / 2, goalY - GOAL_VISUAL.TEXT_OFFSET_Y);
    }
}

function drawStar(x, y, outerRadius, innerRadius) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();
}

// Explosión del coche
function explodeCar() {
    if (explosionActive) return;
    
    explosionActive = true;
    isJumping = false;
    gameState = 'exploded';
    
    // Reproducir sonido de choque cuando explota
    playCrashSound();
    
    // Guardar posición donde explotó (centro del coche, limitado al canvas)
    const carWidth = DIMENSIONS.CAR_WIDTH;
    const carHeight = DIMENSIONS.CAR_HEIGHT;
    const explosionX = Math.max(carWidth/2, Math.min(canvas.width - carWidth/2, carFixedX + carWidth/2));
    const explosionY = Math.max(carHeight/2, Math.min(canvas.height - carHeight/2, carY + carHeight/2));
    
    // Crear partículas de explosión
    explosionParticles = [];
    const colors = ['#ff6b6b', '#ffd700', '#ff8c00', '#ff4500', '#ffff00'];
    
    for (let i = 0; i < 30; i++) {
        explosionParticles.push({
            x: explosionX,
            y: explosionY,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1.0,
            decay: Math.random() * 0.02 + 0.01
        });
    }
    
    // Animar explosión
    animateExplosion();
}

// Animar explosión
function animateExplosion() {
    if (!explosionActive) return;
    
    let allDead = true;
    
    for (let particle of explosionParticles) {
        if (particle.life > 0) {
            allDead = false;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.5; // Gravedad
            particle.life -= particle.decay;
        }
    }
    
    draw();
    
    if (allDead) {
        // La explosión terminó
        explosionActive = false;
        gameState = 'lost';
        showMessage('💥 ¡BOOM! 💥', 'El coche explotó al salirse del camino. ¡Elige mejor el coche para este nivel!');
    } else {
        requestAnimationFrame(animateExplosion);
    }
}

// Dibujar explosión
function drawExplosion() {
    for (let particle of explosionParticles) {
        if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Dibujar centro de la explosión (llama)
    if (explosionParticles.length > 0 && explosionParticles[0].life > 0.5) {
        const centerX = explosionParticles[0].x;
        const centerY = explosionParticles[0].y;
        
        // Círculo de fuego central
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff8c00');
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Dibujar coche
function drawCar() {
    const carWidth = DIMENSIONS.CAR_WIDTH;
    const carHeight = DIMENSIONS.CAR_HEIGHT; // Aumentado para monster trucks
    
    // Sombra del coche (solo cuando está en el suelo)
    if (carY >= POSITIONS.GROUND_LEVEL && sprites.carShadow) {
        ctx.drawImage(sprites.carShadow, carFixedX, carY + carHeight + DIMENSIONS.CAR_SHADOW_OFFSET, DIMENSIONS.CAR_SHADOW_WIDTH, DIMENSIONS.CAR_SHADOW_HEIGHT);
    } else if (carY >= POSITIONS.GROUND_LEVEL) {
        // Fallback si el sprite no está cargado
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(carFixedX + carWidth / 2, carY + carHeight + DIMENSIONS.CAR_SHADOW_OFFSET, carWidth / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Efecto de movimiento (líneas de velocidad) - solo cuando salta
    if (isJumping) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(carFixedX - 20 - i * 15, carY + 10 + i * 5);
            ctx.lineTo(carFixedX - 10 - i * 15, carY + 15 + i * 5);
            ctx.stroke();
        }
    }
    
    // Dibujar coche usando sprite
    if (selectedCar && sprites.cars[selectedCar.id]) {
        ctx.drawImage(sprites.cars[selectedCar.id], carFixedX, carY, carWidth, carHeight);
    } else {
        // Fallback si el sprite no está cargado
        // Cuerpo del coche
        ctx.fillStyle = selectedCar ? selectedCar.color : '#ff6b6b';
        ctx.fillRect(carFixedX, carY, carWidth, carHeight);
        
        // Ventanas
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(carFixedX + 10, carY + 5, 15, 15);
        ctx.fillRect(carFixedX + 35, carY + 5, 15, 15);
        
        // Brillo en las ventanas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(carFixedX + 12, carY + 7, 5, 5);
        ctx.fillRect(carFixedX + 37, carY + 7, 5, 5);
        
        // Ruedas
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.arc(carFixedX + 15, carY + carHeight, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carFixedX + 45, carY + carHeight, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalles de las ruedas
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.arc(carFixedX + 15, carY + carHeight, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carFixedX + 45, carY + carHeight, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalles decorativos
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(carFixedX + 5, carY + 10, carWidth - 10, 10);
        
        // Ojos del coche (para hacerlo más amigable)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(carFixedX + 15, carY + 15, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carFixedX + 45, carY + 15, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(carFixedX + 15, carY + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carFixedX + 45, carY + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Sonrisa cuando está saltando
        if (isJumping) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(carFixedX + 30, carY + 25, 8, 0, Math.PI);
            ctx.stroke();
        }
    }
}

// Mostrar mensaje
function showMessage(title, text, showNextLevel = false, showRestartFromLevel1 = false) {
    // Detener sonido del motor cuando se muestra un mensaje (victoria/derrota)
    stopEngineSound();
    
    document.getElementById('messageTitle').textContent = title;
    document.getElementById('messageText').textContent = text;
    document.getElementById('nextLevelButton').style.display = showNextLevel ? 'inline-block' : 'none';
    document.getElementById('restartFromLevel1Button').style.display = showRestartFromLevel1 ? 'inline-block' : 'none';
    // Ocultar botón de reintentar cuando se muestre el botón de reiniciar desde nivel 1
    document.getElementById('retryButton').style.display = showRestartFromLevel1 ? 'none' : 'inline-block';
    document.getElementById('messageOverlay').style.display = 'flex';
}

// Reiniciar juego
function resetGame() {
    carY = POSITIONS.CAR_INITIAL_Y;
    carVx = 0;
    carVy = 0;
    isJumping = false;
    explosionActive = false;
    explosionParticles = [];
    currentDistance = 0;
    roadScrollX = 0;
    attempts = 0;
    gameState = selectedCar ? 'playing' : 'selecting';
    
    // Actualizar velocidad según el nivel actual
    roadSpeed = getRoadSpeedForLevel(currentLevel);
    
    if (selectedCar) {
        // Reestablecer valores del coche seleccionado para mantener consistencia
        angle = selectedCar.baseAngle;
        speed = selectedCar.baseSpeed;
        acceleration = selectedCar.baseAcceleration;
        
        // Reaplicar tema al reiniciar
        applyCarTheme(selectedCar);
        draw();
        // Iniciar sonido del motor cuando se reinicia el juego con un coche seleccionado
        if (gameState === 'playing') {
            startEngineSound();
        }
        // Iniciar el bucle del juego automáticamente si está en estado playing
        // Solo iniciar si no hay un bucle ya ejecutándose
        if (gameState === 'playing' && !gameLoopRunning) {
            gameLoop();
        }
    } else {
        // Detener sonido del motor si no hay coche seleccionado
        stopEngineSound();
    }
}

// Variable para indicar si se completaron todos los niveles
let allLevelsCompleted = false;

// Reiniciar desde el nivel 1
function restartFromLevel1() {
    allLevelsCompleted = false;
    currentLevel = 1;
    currentLevelData = levels[0];
    roadSpeed = getRoadSpeedForLevel(1);
    attempts = 0;
    currentDistance = 0;
    roadScrollX = 0;
    resetGame();
}

// Siguiente nivel
function nextLevel() {
    if (currentLevel < levels.length) {
        currentLevel++;
        currentLevelData = levels[currentLevel - 1];
        // Actualizar velocidad según el nivel (aumenta 0.1 por nivel)
        roadSpeed = getRoadSpeedForLevel(currentLevel);
        attempts = 0;
        currentDistance = 0;
        roadScrollX = 0;
        resetGame();
    } else {
        // Completaste todos los niveles
        allLevelsCompleted = true;
        showMessage('¡Felicidades! 🏆', `¡Completaste todos los ${levels.length} niveles! ¡Eres un campeón!`, false, true);
    }
}

// Inicializar cuando se carga la página
init();
