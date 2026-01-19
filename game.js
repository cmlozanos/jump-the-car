// ============================================================================
// VERSIÓN DE LA APLICACIÓN
// ============================================================================
const APP_VERSION = '1.4.0'; // Versión actual del juego (MAJOR.MINOR.PATCH)

// ============================================================================
// CONSTANTES DEL JUEGO - AJUSTE FINO CENTRALIZADO
// ============================================================================

// FÍSICA DEL SALTO
const JUMP_PHYSICS = {
    GRAVITY: 0.2,                    // Gravedad base para Monster Trucks (menor = cae más lento, mayor = cae más rápido)
    GRAVITY_BUS: 0.25,                 // Gravedad para buses (ligeramente mayor)
    GRAVITY_F1: 0.18,                  // Gravedad para F1 (ligeramente menor)
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
    MIN_MULTIPLIER: 0.5,              // Multiplicador mínimo de velocidad (50% de velocidad base)
    MAX_MULTIPLIER: 3.0,              // Multiplicador máximo de velocidad (300% de velocidad base)
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
    LEVEL_INFO_FONT_SIZE: 28,         // Tamaño de fuente del texto de nivel
    BUTTON_ICON_FONT_SIZE: 40,        // Tamaño de fuente de los iconos de botones
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

// ============================================================================
// GESTIÓN DE COOKIES PARA NIVELES DESBLOQUEADOS
// ============================================================================

// Función para establecer una cookie sin fecha de expiración (persistente)
function setCookie(name, value) {
    // Cookie sin fecha de expiración = dura para siempre hasta que se borre manualmente
    document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
}

// Función para obtener el valor de una cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Obtener niveles desbloqueados desde cookie
function getUnlockedLevels() {
    const unlockedStr = getCookie('unlockedLevels');
    if (!unlockedStr) {
        // El nivel 1 siempre está desbloqueado por defecto
        return [1];
    }
    try {
        const unlocked = JSON.parse(unlockedStr);
        // Asegurar que el nivel 1 siempre esté desbloqueado
        if (!unlocked.includes(1)) {
            unlocked.push(1);
        }
        return unlocked.sort((a, b) => a - b);
    } catch (e) {
        console.error('Error al parsear niveles desbloqueados:', e);
        return [1];
    }
}

// Guardar niveles desbloqueados en cookie
function saveUnlockedLevels(unlockedLevels) {
    const uniqueLevels = [...new Set(unlockedLevels)].sort((a, b) => a - b);
    setCookie('unlockedLevels', JSON.stringify(uniqueLevels));
}

// Desbloquear un nivel específico
function unlockLevel(levelNumber) {
    const unlocked = getUnlockedLevels();
    if (!unlocked.includes(levelNumber)) {
        unlocked.push(levelNumber);
        saveUnlockedLevels(unlocked);
        return true;
    }
    return false;
}

// Verificar si un nivel está desbloqueado
function isLevelUnlocked(levelNumber) {
    const unlocked = getUnlockedLevels();
    return unlocked.includes(levelNumber);
}

// Configuración del juego
let canvas = null;
let ctx = null;

// Estados del juego
let gameState = 'selecting'; // 'selecting', 'playing', 'jumping', 'won', 'lost', 'exploded', 'paused'
let selectedCar = null;
let currentLevel = 1;
let attempts = 0;
let explosionActive = false;
let explosionParticles = [];
let landingSoundPlayed = false; // Control para evitar reproducir sonido de aterrizaje múltiples veces
let cloudPositions = []; // Posiciones de las nubes para animación
let cloudSpeed = 0.03; // Velocidad de movimiento de las nubes (muy lenta)
let gamePaused = false; // Control de pausa del juego
let previousGameState = null; // Guardar el estado anterior cuando se pausa

// Sistema de audio
let audioContext = null;
let engineSoundOscillator = null;
let engineSoundGain = null;
let isEngineSoundPlaying = false;
let gameLoopRunning = false; // Control para evitar múltiples bucles de juego

// Sprites cargados
const sprites = {
    cars: {},
    levels: {},
    carShadow: null,
    obstacle: null,
    spikes: null,
    tree: null,
    hole: null,
    ufo: null,
    fire: null,
    goal: null,
    cloud: null,
    sun: null,
    moonFull: null,
    moonCrescent: null,
    moonWaning: null,
    moonHalf: null,
    settings: null,
    arrowUp: null,
    arrowDown: null,
    carIcon: null,
    close: null
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
        const versionParam = `?v=${APP_VERSION}`;
        
        // Cargar sprites de coches (14 coches disponibles)
        for (let i = 1; i <= 14; i++) {
            sprites.cars[i] = await loadImage(`sprites/cars/car_${i}.svg${versionParam}`);
        }
        
        // Cargar sprite de sombra
        sprites.carShadow = await loadImage(`sprites/cars/car_shadow.svg${versionParam}`);
        
        // Cargar sprites de obstáculos
        sprites.obstacle = await loadImage(`sprites/environment/obstacle.svg${versionParam}`);
        sprites.spikes = await loadImage(`sprites/environment/spikes.svg${versionParam}`);
        sprites.tree = await loadImage(`sprites/environment/tree.svg${versionParam}`);
        sprites.hole = await loadImage(`sprites/environment/hole.svg${versionParam}`);
        sprites.ufo = await loadImage(`sprites/environment/ufo.svg${versionParam}`);
        sprites.fire = await loadImage(`sprites/environment/fire.svg${versionParam}`);
        
        // Cargar sprites de ambiente
        sprites.goal = await loadImage(`sprites/environment/goal.svg${versionParam}`);
        sprites.cloud = await loadImage(`sprites/environment/cloud.svg${versionParam}`);
        sprites.sun = await loadImage(`sprites/environment/sun.svg${versionParam}`);
        
        // Cargar sprites de luna (diferentes fases)
        sprites.moonFull = await loadImage(`sprites/environment/moon_full.svg${versionParam}`);
        sprites.moonCrescent = await loadImage(`sprites/environment/moon_crescent.svg${versionParam}`);
        sprites.moonWaning = await loadImage(`sprites/environment/moon_waning.svg${versionParam}`);
        sprites.moonHalf = await loadImage(`sprites/environment/moon_half.svg${versionParam}`);
        
        // Cargar sprite de configuración
        sprites.settings = await loadImage(`sprites/environment/settings.svg${versionParam}`);
        
        // Cargar sprites de UI
        sprites.arrowUp = await loadImage(`sprites/environment/arrow_up.svg${versionParam}`);
        sprites.arrowDown = await loadImage(`sprites/environment/arrow_down.svg${versionParam}`);
        sprites.carIcon = await loadImage(`sprites/environment/car_icon.svg${versionParam}`);
        sprites.close = await loadImage(`sprites/environment/close.svg${versionParam}`);
        
        // Cargar sprites de niveles
        for (let i = 1; i <= levels.length; i++) {
            sprites.levels[i] = await loadImage(`sprites/levels/level_${i}.svg${versionParam}`);
        }
        
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
let speedMultiplier = 1.0; // Multiplicador de velocidad (se puede aumentar con el botón de aceleración)

// Función para calcular la velocidad según el nivel (aumenta 0.1 por nivel)
function getRoadSpeedForLevel(level) {
    return (SPEED.ROAD_SCROLL + (level - 1) * 0.1) * speedMultiplier;
}

// Definición de coches disponibles - Ordenados por tipo: Monster Trucks, Buses, F1
const cars = [
    // ========== MONSTER TRUCKS (IDs 1-6) ==========
    {
        id: 1,
        name: 'Fire Blazer 🔥',
        color: '#dc143c',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Monster Truck Rojo',
        vehicleType: 'monster_truck',
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
        vehicleType: 'monster_truck',
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
        vehicleType: 'monster_truck',
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
        vehicleType: 'monster_truck',
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
        vehicleType: 'monster_truck',
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
        vehicleType: 'monster_truck',
        theme: {
            primary: '#1a1a1a',
            secondary: '#2d2d2d',
            accent: '#c0c0c0',
            gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            icon: '⚫'
        }
    },
    // ========== BUSES (IDs 7-10, 14) ==========
    {
        id: 7,
        name: 'Orange Crush 🧡',
        color: '#ff8c00',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Bus Naranja',
        vehicleType: 'bus',
        theme: {
            primary: '#ff8c00',
            secondary: '#ff4500',
            accent: '#ffd700',
            gradient: 'linear-gradient(135deg, #ff8c00 0%, #ff4500 100%)',
            icon: '🧡'
        }
    },
    {
        id: 8,
        name: 'Purple Storm 💜',
        color: '#9370db',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Bus Morado',
        vehicleType: 'bus',
        theme: {
            primary: '#9370db',
            secondary: '#8a2be2',
            accent: '#ffd700',
            gradient: 'linear-gradient(135deg, #9370db 0%, #8a2be2 100%)',
            icon: '💜'
        }
    },
    {
        id: 9,
        name: 'Turquoise Wave 💙',
        color: '#40e0d0',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Bus Turquesa',
        vehicleType: 'bus',
        theme: {
            primary: '#40e0d0',
            secondary: '#00ced1',
            accent: '#ffd700',
            gradient: 'linear-gradient(135deg, #40e0d0 0%, #00ced1 100%)',
            icon: '💙'
        }
    },
    {
        id: 10,
        name: 'Pink Blast 💗',
        color: '#ff69b4',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Bus Rosa',
        vehicleType: 'bus',
        theme: {
            primary: '#ff69b4',
            secondary: '#ff1493',
            accent: '#ffd700',
            gradient: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)',
            icon: '💗'
        }
    },
    {
        id: 14,
        name: 'City Express 🚌',
        color: '#4169E1',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Bus Azul',
        vehicleType: 'bus',
        theme: {
            primary: '#4169E1',
            secondary: '#1E90FF',
            accent: '#87CEEB',
            gradient: 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)',
            icon: '🚌'
        }
    },
    // ========== FÓRMULA 1 (IDs 11-13) ==========
    {
        id: 11,
        name: 'Red Lightning 🏎️',
        color: '#dc143c',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Fórmula 1 Rojo',
        vehicleType: 'f1',
        theme: {
            primary: '#dc143c',
            secondary: '#8b0000',
            accent: '#ffd700',
            gradient: 'linear-gradient(135deg, #dc143c 0%, #8b0000 100%)',
            icon: '🏎️'
        }
    },
    {
        id: 12,
        name: 'Blue Thunder 🏎️',
        color: '#0066cc',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Fórmula 1 Azul',
        vehicleType: 'f1',
        theme: {
            primary: '#0066cc',
            secondary: '#003d7a',
            accent: '#00ffff',
            gradient: 'linear-gradient(135deg, #0066cc 0%, #003d7a 100%)',
            icon: '🏎️'
        }
    },
    {
        id: 13,
        name: 'Racing Champion 🏎️',
        color: '#00BDB9',
        baseAngle: CAR_BASE_STATS.ANGLE,
        baseSpeed: CAR_BASE_STATS.SPEED,
        baseAcceleration: CAR_BASE_STATS.ACCELERATION,
        description: 'Fórmula 1 Racing Car',
        vehicleType: 'f1',
        theme: {
            primary: '#00BDB9',
            secondary: '#008C8E',
            accent: '#19DDD3',
            gradient: 'linear-gradient(135deg, #00BDB9 0%, #008C8E 100%)',
            icon: '🏎️'
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
            { distance: 1200, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2400, y: 520, width: 60, height: 30, type: 'hole' }
        ]
    },
    {
        goalDistance: 3500,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 380, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3000, y: 320, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 4000,
        obstacles: [
            { distance: 500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 1000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 2000, y: 520, width: 50, height: 50, type: 'fire' },
            { distance: 2500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 340, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 4500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2400, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3600, y: 380, width: 80, height: 40, type: 'ufo' },
            { distance: 4200, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 5000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 370, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 50, height: 50, type: 'fire' },
            { distance: 2500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 3500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4000, y: 520, width: 50, height: 50, type: 'fire' },
            { distance: 4500, y: 380, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 5500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 50, height: 50, type: 'fire' },
            { distance: 3000, y: 370, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4800, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 5100, y: 520, width: 50, height: 50, type: 'fire' }
        ]
    },
    {
        goalDistance: 6000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 380, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 5000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 6500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 370, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 7000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 380, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 370, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' }
        ]
    },
    {
        goalDistance: 7500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 340, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 8000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 370, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 350, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 8500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 9000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 9500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 9000, y: 350, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 10000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 9000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 9500, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 10500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 9000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 9600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 10200, y: 340, width: 80, height: 40, type: 'ufo' }
        ]
    },
    {
        goalDistance: 11000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 9000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 9500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 10000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 10500, y: 520, width: 40, height: 20, type: 'spikes' }
        ]
    },
    {
        goalDistance: 11500,
        obstacles: [
            { distance: 600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 1800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 3000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 3600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 4200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 4800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 5400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 6000, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 6600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 7200, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 7800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 8400, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 9000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 9600, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 10200, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 10800, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 11400, y: 520, width: 40, height: 20, type: 'obstacle' }
        ]
    },
    {
        goalDistance: 12000,
        obstacles: [
            { distance: 500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 1000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 1500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 2000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 2500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 3000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 3500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 4000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 4500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 5000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 5500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 6000, y: 340, width: 80, height: 40, type: 'ufo' },
            { distance: 6500, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 7000, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 7500, y: 360, width: 80, height: 40, type: 'ufo' },
            { distance: 8000, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 8500, y: 330, width: 80, height: 40, type: 'ufo' },
            { distance: 9000, y: 520, width: 60, height: 30, type: 'hole' },
            { distance: 9500, y: 520, width: 40, height: 20, type: 'obstacle' },
            { distance: 10000, y: 350, width: 80, height: 40, type: 'ufo' },
            { distance: 10500, y: 520, width: 40, height: 20, type: 'spikes' },
            { distance: 11000, y: 340, width: 80, height: 40, type: 'ufo' },
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

// Reproducir sonido de choque según el tipo de obstáculo
function playCrashSound(obstacleType = 'obstacle') {
    if (!audioContext) return;
    
    switch(obstacleType) {
        case 'fire':
            playFireCrashSound();
            break;
        case 'spikes':
            playSpikesCrashSound();
            break;
        case 'tree':
            playTreeCrashSound();
            break;
        case 'hole':
            playHoleCrashSound();
            break;
        case 'ufo':
            playUfoCrashSound();
            break;
        case 'obstacle':
        default:
            playObstacleCrashSound();
            break;
    }
}

// Sonido de choque genérico (roca/obstáculo)
function playObstacleCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido principal de choque (ruido de baja frecuencia)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(100, now);
        oscillator1.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.3);
        
        // Sonido de "clank" metálico
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(300, now);
        oscillator2.frequency.exponentialRampToValueAtTime(150, now + 0.1);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.15);
    } catch (e) {
        console.warn('Error al reproducir sonido de choque:', e);
    }
}

// Sonido de choque con fuego
function playFireCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido de fuego (ruido de alta frecuencia con variación)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(400, now);
        oscillator1.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        oscillator1.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.5, now + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.4);
        
        // Sonido de explosión
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(200, now);
        oscillator2.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.4, now + 0.005);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.25);
    } catch (e) {
        console.warn('Error al reproducir sonido de fuego:', e);
    }
}

// Sonido de choque con pinchos
function playSpikesCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido agudo de pinchazo
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'square';
        oscillator1.frequency.setValueAtTime(800, now);
        oscillator1.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.005);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.2);
        
        // Sonido de desinflado
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'sawtooth';
        oscillator2.frequency.setValueAtTime(150, now);
        oscillator2.frequency.exponentialRampToValueAtTime(50, now + 0.25);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.3);
    } catch (e) {
        console.warn('Error al reproducir sonido de pinchos:', e);
    }
}

// Sonido de choque con árbol
function playTreeCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido de madera quebrada
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sawtooth';
        oscillator1.frequency.setValueAtTime(120, now);
        oscillator1.frequency.exponentialRampToValueAtTime(80, now + 0.2);
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.3);
        
        // Sonido de crujido
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(250, now);
        oscillator2.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.2);
    } catch (e) {
        console.warn('Error al reproducir sonido de árbol:', e);
    }
}

// Sonido de choque con agujero
function playHoleCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido de caída
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(200, now);
        oscillator1.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.4, now + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.4);
        
        // Sonido de impacto
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'square';
        oscillator2.frequency.setValueAtTime(150, now);
        oscillator2.frequency.exponentialRampToValueAtTime(60, now + 0.2);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.35, now + 0.005);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.25);
    } catch (e) {
        console.warn('Error al reproducir sonido de agujero:', e);
    }
}

// Sonido de choque con UFO
function playUfoCrashSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido de energía/rayo
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'square';
        oscillator1.frequency.setValueAtTime(600, now);
        oscillator1.frequency.exponentialRampToValueAtTime(300, now + 0.2);
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.5, now + 0.01);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.3);
        
        // Sonido de zumbido
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(400, now);
        oscillator2.frequency.exponentialRampToValueAtTime(200, now + 0.25);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.3);
    } catch (e) {
        console.warn('Error al reproducir sonido de UFO:', e);
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

// Reproducir sonido de aterrizaje
function playLandingSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido principal de aterrizaje (impacto suave)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(150, now); // Frecuencia baja para sonido grave
        oscillator1.frequency.exponentialRampToValueAtTime(80, now + 0.1); // Bajar la frecuencia rápidamente
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.25, now + 0.005); // Attack muy rápido
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Decay rápido
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.15);
        
        // Sonido secundario (ruido de impacto suave)
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(200, now);
        oscillator2.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.15, now + 0.003);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.12);
    } catch (e) {
        console.warn('Error al reproducir sonido de aterrizaje:', e);
    }
}

// Reproducir sonido de aterrizaje
function playLandingSound() {
    if (!audioContext) return;
    
    try {
        const now = audioContext.currentTime;
        
        // Sonido principal de aterrizaje (impacto suave)
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(150, now); // Frecuencia baja para sonido grave
        oscillator1.frequency.exponentialRampToValueAtTime(80, now + 0.1); // Bajar la frecuencia rápidamente
        
        gainNode1.gain.setValueAtTime(0, now);
        gainNode1.gain.linearRampToValueAtTime(0.25, now + 0.005); // Attack muy rápido
        gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Decay rápido
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.start(now);
        oscillator1.stop(now + 0.15);
        
        // Sonido secundario (ruido de impacto suave)
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(200, now);
        oscillator2.frequency.exponentialRampToValueAtTime(100, now + 0.08);
        
        gainNode2.gain.setValueAtTime(0, now);
        gainNode2.gain.linearRampToValueAtTime(0.15, now + 0.003);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.start(now);
        oscillator2.stop(now + 0.12);
    } catch (e) {
        console.warn('Error al reproducir sonido de aterrizaje:', e);
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
    setupLevelSelection();
    setupControls();
    setupEventListeners();
    setupCanvasButtons();
    
    // Asegurar que el nivel 1 esté desbloqueado al iniciar
    if (!isLevelUnlocked(1)) {
        unlockLevel(1);
    }
    
    // Mostrar primero el selector de niveles (ocultar selector de coches)
    document.getElementById('carSelectionPanel').style.display = 'none';
    document.getElementById('gamePanel').style.display = 'none';
    document.getElementById('levelSelectionPanel').style.display = 'block';
    
    // Actualizar sprites de los botones después de cargar
    const changeCarButton = document.getElementById('changeCarButton');
    const configButton = document.getElementById('configButton');
    const changeLevelButton = document.getElementById('changeLevelButton');
    if (changeCarButton) {
        updateButtonSprite(changeCarButton, sprites.carIcon, `sprites/environment/car_icon.svg?v=${APP_VERSION}`);
    }
    if (configButton) {
        updateButtonSprite(configButton, sprites.settings, `sprites/environment/settings.svg?v=${APP_VERSION}`);
    }
    if (changeLevelButton && sprites.goal) {
        updateButtonSprite(changeLevelButton, sprites.goal, `sprites/environment/goal.svg?v=${APP_VERSION}`);
    }
    
    // Actualizar sprites en el HTML directamente
    const versionParam = `?v=${APP_VERSION}`;
    const configTitleIcon = document.querySelector('.config-title-icon');
    if (configTitleIcon && sprites.settings) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprites.settings, 0, 0, 24, 24);
        configTitleIcon.src = canvas.toDataURL();
    }
    
    const accelerateBtnImg = document.querySelector('#accelerateButton .button-icon-img');
    if (accelerateBtnImg && sprites.arrowUp) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprites.arrowUp, 0, 0, 24, 24);
        accelerateBtnImg.src = canvas.toDataURL();
    }
    
    const decelerateBtnImg = document.querySelector('#decelerateButton .button-icon-img');
    if (decelerateBtnImg && sprites.arrowDown) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprites.arrowDown, 0, 0, 24, 24);
        decelerateBtnImg.src = canvas.toDataURL();
    }
    
    const closeBtnImg = document.querySelector('#closeConfigButton .close-icon-img');
    if (closeBtnImg && sprites.close) {
        const canvas = document.createElement('canvas');
        canvas.width = 24;
        canvas.height = 24;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprites.close, 0, 0, 24, 24);
        closeBtnImg.src = canvas.toDataURL();
    }
    
    // Mostrar versión de la aplicación
    displayAppVersion();
    
    resetGame();
}

// Mostrar versión de la aplicación
function displayAppVersion() {
    const versionElement = document.getElementById('versionNumber');
    if (versionElement) {
        versionElement.textContent = APP_VERSION;
    }
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
        carImg.src = `sprites/cars/car_${car.id}.svg?v=${APP_VERSION}`;
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
    
    // Reiniciar el juego desde el nivel seleccionado
    // Resetear flags de pausa
    gamePaused = false;
    previousGameState = null;
    
    // Asegurar que el multiplicador esté dentro de los límites
    if (speedMultiplier < SPEED.MIN_MULTIPLIER) {
        speedMultiplier = SPEED.MIN_MULTIPLIER;
    }
    if (speedMultiplier > SPEED.MAX_MULTIPLIER) {
        speedMultiplier = SPEED.MAX_MULTIPLIER;
    }
    
    // Actualizar velocidad según el nivel actual
    roadSpeed = getRoadSpeedForLevel(currentLevel);
    attempts = 0;
    currentDistance = 0;
    roadScrollX = 0;
    
    // Mostrar panel de juego
    setTimeout(() => {
        document.getElementById('carSelectionPanel').style.display = 'none';
        document.getElementById('gamePanel').style.display = 'flex';
        // Mostrar botones HTML del canvas
        const changeCarButton = document.getElementById('changeCarButton');
        const configButton = document.getElementById('configButton');
        const changeLevelButton = document.getElementById('changeLevelButton');
        if (changeCarButton) changeCarButton.style.display = 'flex';
        if (configButton) configButton.style.display = 'flex';
        if (changeLevelButton) changeLevelButton.style.display = 'flex';
        // Actualizar posición de los botones
        setTimeout(() => updateCanvasButtonsPosition(), 100);
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

// Configurar panel de selección de niveles (usando exactamente las mismas clases que los coches)
function setupLevelSelection() {
    const levelsGrid = document.getElementById('levelsGrid');
    if (!levelsGrid) return;
    
    levelsGrid.innerHTML = '';
    
    console.log(`Creando ${levels.length} niveles en el panel de selección`);
    
    levels.forEach((level, index) => {
        const levelNumber = index + 1;
        const isUnlocked = isLevelUnlocked(levelNumber);
        const isCurrentLevel = levelNumber === currentLevel;
        
        console.log(`Creando nivel ${levelNumber}: ${isUnlocked ? 'desbloqueado' : 'bloqueado'}`);
        const levelOption = document.createElement('div');
        levelOption.className = 'car-option'; // Usar la misma clase que los coches
        
        if (isCurrentLevel) {
            levelOption.classList.add('selected'); // Usar 'selected' igual que los coches
        }
        
        if (!isUnlocked) {
            levelOption.classList.add('locked');
            levelOption.style.cursor = 'not-allowed';
            levelOption.style.opacity = '0.6';
            levelOption.style.background = 'linear-gradient(135deg, #666666 0%, #555555 100%)';
        }
        
        // Crear elemento de imagen para el sprite del nivel (igual que los coches)
        const levelSpriteDiv = document.createElement('div');
        levelSpriteDiv.className = 'car-sprite'; // Usar la misma clase que los coches
        
        // Crear imagen del nivel usando el sprite SVG cargado o cargarlo directamente
        const levelImg = document.createElement('img');
        
        // Intentar usar el sprite cargado en memoria primero
        if (sprites.levels[levelNumber]) {
            levelImg.src = sprites.levels[levelNumber].src;
        } else {
            // Fallback: cargar directamente desde la URL
            levelImg.src = `sprites/levels/level_${levelNumber}.svg?v=${APP_VERSION}`;
        }
        
        levelImg.alt = `Nivel ${levelNumber}`;
        levelImg.style.width = '100%';
        levelImg.style.height = '100%';
        levelImg.style.objectFit = 'contain';
        levelImg.style.display = 'block';
        
        // Fallback: si la imagen no carga, mostrar número
        levelImg.onerror = function() {
            console.error(`Error cargando sprite para nivel ${levelNumber}: ${levelImg.src}`);
            this.style.display = 'none';
            levelSpriteDiv.style.background = isUnlocked ? '#f0f0f0' : '#666';
            levelSpriteDiv.style.border = '3px solid #2d3436';
            // Mostrar número del nivel como fallback
            const fallbackText = document.createElement('div');
            fallbackText.textContent = levelNumber;
            fallbackText.style.fontSize = '3em';
            fallbackText.style.color = isUnlocked ? '#2d3436' : '#999';
            fallbackText.style.fontWeight = 'bold';
            fallbackText.style.display = 'flex';
            fallbackText.style.alignItems = 'center';
            fallbackText.style.justifyContent = 'center';
            fallbackText.style.height = '100%';
            levelSpriteDiv.appendChild(fallbackText);
        };
        
        levelImg.onload = function() {
            console.log(`Sprite cargado exitosamente para nivel ${levelNumber}`);
        };
        
        levelSpriteDiv.appendChild(levelImg);
        
        // Estructura exactamente igual que los coches
        const levelName = isUnlocked ? `Nivel ${levelNumber}` : `Nivel ${levelNumber} 🔒`;
        const levelDescription = isUnlocked ? `${level.goalDistance}m • ${level.obstacles.length} obstáculos` : 'Bloqueado';
        
        levelOption.innerHTML = `
            <div class="car-name">${levelName}</div>
            <div class="car-stats">${levelDescription}</div>
        `;
        levelOption.insertBefore(levelSpriteDiv, levelOption.firstChild);
        
        // Agregar evento click solo si está desbloqueado
        if (isUnlocked) {
            levelOption.addEventListener('click', (e) => {
                e.stopPropagation();
                selectLevel(levelNumber);
            });
        }
        
        levelsGrid.appendChild(levelOption);
    });
    
    console.log(`Total de niveles agregados al grid: ${levelsGrid.children.length}`);
}

// Seleccionar nivel
function selectLevel(levelNumber) {
    if (!isLevelUnlocked(levelNumber)) {
        return; // No permitir seleccionar niveles bloqueados
    }
    
    // Cambiar al nivel seleccionado
    currentLevel = levelNumber;
    currentLevelData = levels[levelNumber - 1];
    
    // Resetear flags de pausa
    gamePaused = false;
    previousGameState = null;
    
    // Asegurar que el multiplicador esté dentro de los límites
    if (speedMultiplier < SPEED.MIN_MULTIPLIER) {
        speedMultiplier = SPEED.MIN_MULTIPLIER;
    }
    if (speedMultiplier > SPEED.MAX_MULTIPLIER) {
        speedMultiplier = SPEED.MAX_MULTIPLIER;
    }
    
    // Actualizar velocidad según el nivel
    roadSpeed = getRoadSpeedForLevel(currentLevel);
    attempts = 0;
    currentDistance = 0;
    roadScrollX = 0;
    
    // Si ya hay un coche seleccionado, reiniciar el juego directamente desde este nivel
    if (selectedCar) {
        // Ocultar panel de selección de niveles
        const levelSelectionPanel = document.getElementById('levelSelectionPanel');
        if (levelSelectionPanel) {
            levelSelectionPanel.style.display = 'none';
        }
        
        // Mostrar panel de juego y reiniciar
        const gamePanel = document.getElementById('gamePanel');
        if (gamePanel) {
            gamePanel.style.display = 'flex';
        }
        
        // Mostrar botones HTML del canvas
        const changeCarButton = document.getElementById('changeCarButton');
        const configButton = document.getElementById('configButton');
        const changeLevelButton = document.getElementById('changeLevelButton');
        if (changeCarButton) changeCarButton.style.display = 'flex';
        if (configButton) configButton.style.display = 'flex';
        if (changeLevelButton) changeLevelButton.style.display = 'flex';
        
        // Actualizar posición de los botones
        setTimeout(() => updateCanvasButtonsPosition(), 100);
        
        // Reiniciar el juego desde este nivel
        gameState = 'playing';
        resetGame();
        draw();
        // Iniciar sonido del motor cuando comienza el juego
        startEngineSound();
        // Iniciar el bucle del juego automáticamente
        if (canvas && ctx && !gameLoopRunning) {
            gameLoop();
        }
    } else {
        // Si no hay coche seleccionado, mostrar selector de coches
        const levelSelectionPanel = document.getElementById('levelSelectionPanel');
        if (levelSelectionPanel) {
            levelSelectionPanel.style.display = 'none';
        }
        
        // Mostrar panel de selección de coches
        const carSelectionPanel = document.getElementById('carSelectionPanel');
        if (carSelectionPanel) {
            carSelectionPanel.style.display = 'block';
        }
    }
    
    // Actualizar la visualización de niveles para marcar el nivel seleccionado
    setupLevelSelection();
}

// Cambiar nivel (mostrar panel de selección)
function changeLevel() {
    // Permitir cambiar nivel en cualquier momento (incluso con mensajes visibles)
    // Solo evitar si está explotando activamente
    if (gameState === 'exploded' && explosionActive) {
        return;
    }
    
    // Detener sonido del motor cuando se vuelve a selección
    stopEngineSound();
    
    // Ocultar paneles de mensajes y configuración si están visibles
    document.getElementById('messageOverlay').style.display = 'none';
    document.getElementById('configOverlay').style.display = 'none';
    
    // Ocultar panel de juego y mostrar panel de selección de niveles
    document.getElementById('gamePanel').style.display = 'none';
    // Ocultar botones HTML del canvas
    const changeCarButton = document.getElementById('changeCarButton');
    const configButton = document.getElementById('configButton');
    const changeLevelButton = document.getElementById('changeLevelButton');
    if (changeCarButton) changeCarButton.style.display = 'none';
    if (configButton) configButton.style.display = 'none';
    if (changeLevelButton) changeLevelButton.style.display = 'none';
    
    // Mostrar panel de selección de niveles
    const levelSelectionPanel = document.getElementById('levelSelectionPanel');
    if (levelSelectionPanel) {
        // Actualizar la visualización antes de mostrar
        setupLevelSelection();
        levelSelectionPanel.style.display = 'block';
    }
    
    gameState = 'selecting';
    
    // Resetear flags de pausa
    gamePaused = false;
    previousGameState = null;
}

// Mostrar panel de configuración
function showConfigPanel() {
    // Permitir abrir configuración en cualquier momento (incluso con mensajes visibles)
    // Guardar el estado actual si el juego está en ejecución
    if (gameState === 'playing' || gameState === 'jumping') {
        previousGameState = gameState;
        gamePaused = true;
        gameState = 'paused';
        
        // Detener el sonido del motor
        stopEngineSound();
    } else {
        // Si hay un mensaje visible, guardar el estado para poder restaurarlo
        previousGameState = gameState;
        gamePaused = true;
    }
    
    // Mostrar el panel (con z-index más alto que el mensaje)
    document.getElementById('configOverlay').style.display = 'flex';
    updateConfigSpeedDisplay();
}

// Ocultar panel de configuración
function hideConfigPanel() {
    // Ocultar el panel
    document.getElementById('configOverlay').style.display = 'none';
    
    // Reanudar el juego si estaba en ejecución
    if (gamePaused && previousGameState) {
        const restoredState = previousGameState;
        gameState = restoredState;
        gamePaused = false;
        previousGameState = null;
        
        // Reanudar el sonido del motor si estaba en estado playing
        if (restoredState === 'playing') {
            startEngineSound();
        }
        
        // Continuar el bucle del juego si es necesario (solo si no hay mensaje visible)
        if ((restoredState === 'playing' || restoredState === 'jumping') && 
            restoredState !== 'won' && restoredState !== 'lost') {
            if (!gameLoopRunning) {
                gameLoop();
            }
        }
    }
}

// Actualizar display de velocidad en el panel de configuración
function updateConfigSpeedDisplay() {
    const speedKmh = Math.round(roadSpeed * 10);
    const speedDisplayElement = document.getElementById('currentSpeedDisplay');
    if (speedDisplayElement) {
        speedDisplayElement.textContent = `${speedKmh} km/h`;
    }
}

// Acelerar coche (aumenta la velocidad permanentemente)
function accelerateCar() {
    // Aumentar el multiplicador de velocidad en 0.2 (20% más rápido)
    speedMultiplier += 0.2;
    
    // Limitar velocidad máxima
    if (speedMultiplier > SPEED.MAX_MULTIPLIER) {
        speedMultiplier = SPEED.MAX_MULTIPLIER;
    }
    
    // Actualizar la velocidad actual
    roadSpeed = getRoadSpeedForLevel(currentLevel);
    
    // Actualizar display de velocidad
    updateConfigSpeedDisplay();
    
    // Reproducir sonido de aceleración
    playAccelerationSound();
}

// Desacelerar coche (disminuye la velocidad permanentemente)
function decelerateCar() {
    // Disminuir el multiplicador de velocidad en 0.2 (20% más lento)
    speedMultiplier -= 0.2;
    
    // Limitar velocidad mínima
    if (speedMultiplier < SPEED.MIN_MULTIPLIER) {
        speedMultiplier = SPEED.MIN_MULTIPLIER;
    }
    
    // Actualizar la velocidad actual
    roadSpeed = getRoadSpeedForLevel(currentLevel);
    
    // Actualizar display de velocidad
    updateConfigSpeedDisplay();
    
    // Reproducir sonido de desaceleración
    playDecelerationSound();
}

// Reproducir sonido de aceleración
function playAccelerationSound() {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.warn('Error al reproducir sonido de aceleración:', e);
    }
}

// Reproducir sonido de desaceleración
function playDecelerationSound() {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.warn('Error al reproducir sonido de desaceleración:', e);
    }
}

// Cambiar coche (volver al panel de selección sin perder el nivel)
function changeCar() {
    // Permitir cambiar coche en cualquier momento (incluso con mensajes visibles)
    // Solo evitar si está explotando activamente
    if (gameState === 'exploded' && explosionActive) {
        return;
    }
    
    // Detener sonido del motor cuando se vuelve a selección
    stopEngineSound();
    
    // Ocultar paneles de mensajes y configuración si están visibles
    document.getElementById('messageOverlay').style.display = 'none';
    document.getElementById('configOverlay').style.display = 'none';
    
    // Ocultar panel de juego y mostrar panel de selección
    document.getElementById('gamePanel').style.display = 'none';
    // Ocultar botones HTML del canvas
    const changeCarButton = document.getElementById('changeCarButton');
    const configButton = document.getElementById('configButton');
    const changeLevelButton = document.getElementById('changeLevelButton');
    if (changeCarButton) changeCarButton.style.display = 'none';
    if (configButton) configButton.style.display = 'none';
    if (changeLevelButton) changeLevelButton.style.display = 'none';
    document.getElementById('carSelectionPanel').style.display = 'block';
    gameState = 'selecting';
    
    // Resetear flags de pausa
    gamePaused = false;
    previousGameState = null;
    
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

// Configurar botones HTML del canvas
function setupCanvasButtons() {
    const changeCarButton = document.getElementById('changeCarButton');
    const configButton = document.getElementById('configButton');
    const changeLevelButton = document.getElementById('changeLevelButton');
    
    if (changeCarButton) {
        changeCarButton.addEventListener('click', (e) => {
            e.stopPropagation();
            changeCar();
        });
        // Actualizar sprite del botón cuando esté cargado
        updateButtonSprite(changeCarButton, sprites.carIcon, `sprites/environment/car_icon.svg?v=${APP_VERSION}`);
    }
    
    if (configButton) {
        configButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showConfigPanel();
        });
        // Actualizar sprite del botón cuando esté cargado
        updateButtonSprite(configButton, sprites.settings, `sprites/environment/settings.svg?v=${APP_VERSION}`);
    }
    
    if (changeLevelButton) {
        changeLevelButton.addEventListener('click', (e) => {
            e.stopPropagation();
            changeLevel();
        });
        // Actualizar sprite del botón cuando esté cargado (usar goal sprite)
        updateButtonSprite(changeLevelButton, sprites.goal, `sprites/environment/goal.svg?v=${APP_VERSION}`);
    }
    
    // Actualizar posición de los botones cuando cambia el tamaño del canvas
    updateCanvasButtonsPosition();
    
    // Actualizar posición cuando se redimensiona la ventana
    window.addEventListener('resize', updateCanvasButtonsPosition);
}

// Actualizar sprite de un botón HTML
function updateButtonSprite(buttonElement, spriteImage, fallbackPath) {
    if (!buttonElement) return;
    
    const imgElement = buttonElement.querySelector('img');
    if (!imgElement) return;
    
    // Si el sprite está cargado, crear un nuevo elemento img con el sprite
    if (spriteImage) {
        // Crear un nuevo elemento img usando el sprite cargado
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(spriteImage, 0, 0, 40, 40);
        
        // Convertir canvas a data URL
        const dataURL = canvas.toDataURL();
        imgElement.src = dataURL;
    } else {
        // Usar la ruta de fallback
        imgElement.src = fallbackPath;
    }
}

// Actualizar posición de los botones HTML según el tamaño del canvas
function updateCanvasButtonsPosition() {
    const canvas = document.getElementById('gameCanvas');
    const changeCarButton = document.getElementById('changeCarButton');
    const configButton = document.getElementById('configButton');
    const changeLevelButton = document.getElementById('changeLevelButton');
    
    if (!canvas || !changeCarButton || !configButton || !changeLevelButton) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Detectar pantallas pequeñas (menos de 600px de ancho)
    const isSmallScreen = window.innerWidth < 600;
    
    // Ajustar tamaño y espaciado según el tamaño de pantalla
    const buttonSize = isSmallScreen ? 45 : UI.BUTTON_SIZE;
    const padding = isSmallScreen ? 10 : UI.BUTTON_PADDING;
    const buttonSpacing = isSmallScreen ? 5 : 10;
    
    // Aplicar tamaño a los botones
    changeCarButton.style.width = `${buttonSize}px`;
    changeCarButton.style.height = `${buttonSize}px`;
    configButton.style.width = `${buttonSize}px`;
    configButton.style.height = `${buttonSize}px`;
    changeLevelButton.style.width = `${buttonSize}px`;
    changeLevelButton.style.height = `${buttonSize}px`;
    
    // Ajustar tamaño del sprite dentro del botón
    const spriteSize = isSmallScreen ? 30 : 40;
    const spriteElements = document.querySelectorAll('.button-sprite');
    spriteElements.forEach(img => {
        img.style.width = `${spriteSize}px`;
        img.style.height = `${spriteSize}px`;
    });
    
    // Calcular posición relativa al canvas (en porcentaje para que sea responsive)
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scaleX = rect.width / canvasWidth;
    const scaleY = rect.height / canvasHeight;
    
    // Botón de cambiar coche (esquina superior derecha)
    const changeX = (canvasWidth - padding - buttonSize) * scaleX;
    const changeY = padding * scaleY;
    changeCarButton.style.left = `${changeX}px`;
    changeCarButton.style.top = `${changeY}px`;
    
    // Botón de configuración (debajo del botón de cambiar coche)
    const configX = (canvasWidth - padding - buttonSize) * scaleX;
    const configY = (padding + buttonSize + buttonSpacing) * scaleY;
    configButton.style.left = `${configX}px`;
    configButton.style.top = `${configY}px`;
    
    // Botón de cambiar nivel (debajo del botón de configuración)
    const levelX = (canvasWidth - padding - buttonSize) * scaleX;
    const levelY = (padding + (buttonSize + buttonSpacing) * 2) * scaleY;
    changeLevelButton.style.left = `${levelX}px`;
    changeLevelButton.style.top = `${levelY}px`;
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
    
    // Función para verificar si se tocó un botón (ya no se usa, los botones HTML manejan los clics)
    function checkButtonClick(x, y) {
        // Los botones ahora son HTML y manejan sus propios clics
        // Esta función se mantiene por compatibilidad pero siempre retorna false
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
        
        // Si no es un botón, saltar (solo si no está pausado)
        if ((gameState === 'playing' || gameState === 'jumping') && !gamePaused) {
            startJump();
        }
    });
    
    canvas.addEventListener('click', (e) => {
        const pos = getCanvasPosition(e);
        
        // Verificar si se hizo clic en un botón
        if (checkButtonClick(pos.x, pos.y)) {
            return;
        }
        
        // Si no es un botón, saltar (solo si no está pausado)
        if ((gameState === 'playing' || gameState === 'jumping') && !gamePaused) {
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
    
    // Event listeners para el panel de configuración
    document.getElementById('accelerateButton').addEventListener('click', () => {
        accelerateCar();
        updateConfigSpeedDisplay();
    });
    
    document.getElementById('decelerateButton').addEventListener('click', () => {
        decelerateCar();
        updateConfigSpeedDisplay();
    });
    
    document.getElementById('closeConfigButton').addEventListener('click', () => {
        hideConfigPanel();
    });
    
    // Cerrar panel de configuración al hacer clic fuera de él
    document.getElementById('configOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'configOverlay') {
            hideConfigPanel();
        }
    });
    
    // Resumir audio al hacer clic en el canvas (para cumplir con política de autoplay)
    canvas.addEventListener('click', resumeAudioContext);
    canvas.addEventListener('touchstart', resumeAudioContext);
}

// Iniciar salto
function startJump() {
    // Solo permitir saltar si no está saltando, el juego está en estado 'playing' y no está pausado
    if (isJumping || gameState !== 'playing' || gamePaused) return;
    
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
        playCrashSound(collisionType); // Reproducir sonido de choque según el tipo
        const obstacleName = obstacleMessages[collisionType] || 'un obstáculo';
        showMessage('¡Oh no! 😢', `Chocaste con ${obstacleName}. ¡Inténtalo de nuevo!`);
        return;
    }
    
    attempts++;
    
    // Reproducir sonido de salto
    playJumpSound();
    
    // Resetear flag de sonido de aterrizaje para el nuevo salto
    landingSoundPlayed = false;
    
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
    
    // Si el juego está pausado, solo dibujar (sin actualizar)
    if (gameState === 'paused' || gamePaused) {
        draw();
        requestAnimationFrame(gameLoop);
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
    // No actualizar si el juego está pausado
    if (gameState === 'paused' || gamePaused) {
        return;
    }
    
    const carWidth = DIMENSIONS.CAR_WIDTH;
    const carHeight = DIMENSIONS.CAR_HEIGHT;
    const groundLevel = POSITIONS.GROUND_LEVEL;
    
    // Actualizar posición de las nubes (siempre, incluso cuando el juego está pausado)
    updateClouds();
    
    // Mover la carretera hacia la izquierda (scroll)
    if (gameState === 'playing' || gameState === 'jumping') {
        currentDistance += roadSpeed;
        roadScrollX += roadSpeed;
    }
    
    // Si el coche está saltando, actualizar física vertical
    if (isJumping) {
        // Obtener gravedad según el tipo de vehículo
        const vehicleType = selectedCar?.vehicleType || 'monster_truck';
        let gravity;
        switch(vehicleType) {
            case 'bus':
                gravity = JUMP_PHYSICS.GRAVITY_BUS;
                break;
            case 'f1':
                gravity = JUMP_PHYSICS.GRAVITY_F1;
                break;
            case 'monster_truck':
            default:
                gravity = JUMP_PHYSICS.GRAVITY;
                break;
        }
        
        // Aplicar gravedad a la velocidad vertical
        carVy += gravity;
        
        // Actualizar posición vertical
        carY += carVy;
        
        // Verificar colisiones con bordes verticales del canvas
        if (carY < 0 || carY + carHeight > canvas.height) {
            // Colisión con borde del canvas
            gameState = 'lost';
            isJumping = false;
            playCrashSound('obstacle'); // Reproducir sonido de choque genérico
            showMessage('¡Oh no! 😢', 'Chocaste con el borde del camino. ¡Inténtalo de nuevo!');
            return;
        }
        
        // Verificar colisiones con obstáculos
        const collisionType = checkObstacleCollisions();
        if (collisionType) {
            gameState = 'lost';
            isJumping = false;
            playCrashSound(collisionType); // Reproducir sonido de choque según el tipo
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
            
            // Reproducir sonido de aterrizaje solo una vez por aterrizaje
            if (!landingSoundPlayed) {
                playLandingSound();
                landingSoundPlayed = true;
            }
            
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
            playCrashSound(collisionType); // Reproducir sonido de choque según el tipo
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
    'ufo': 'un platillo volante',
    'fire': 'fuego',
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

// Dibujar información en el canvas (nivel y velocidad)
function drawCanvasButtons() {
    if (!canvas || !ctx) return;
    
    const padding = UI.BUTTON_PADDING;
    
    // Los botones ahora son HTML, solo dibujamos la información del nivel y velocidad
    
    // Información del nivel (esquina superior izquierda)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(padding, padding, UI.LEVEL_INFO_WIDTH, UI.LEVEL_INFO_HEIGHT);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, UI.LEVEL_INFO_WIDTH, UI.LEVEL_INFO_HEIGHT);
    
    ctx.fillStyle = '#2d3436';
    ctx.font = `700 ${UI.LEVEL_INFO_FONT_SIZE}px Roboto`;
    ctx.textAlign = 'left';
    ctx.fillText(`Nivel: ${currentLevel}`, padding + 10, padding + 30);
    
    // Contador de velocidad (debajo del nivel)
    const speedDisplayY = padding + UI.LEVEL_INFO_HEIGHT + 10;
    const speedDisplayHeight = 35;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(padding, speedDisplayY, UI.LEVEL_INFO_WIDTH, speedDisplayHeight);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, speedDisplayY, UI.LEVEL_INFO_WIDTH, speedDisplayHeight);
    
    // Calcular velocidad en km/h (multiplicar por 10)
    const speedKmh = Math.round(roadSpeed * 10);
    ctx.fillStyle = '#ff6b6b';
    ctx.font = `700 ${UI.LEVEL_INFO_FONT_SIZE - 4}px Roboto`;
    ctx.textAlign = 'left';
    ctx.fillText(`${speedKmh} km/h`, padding + 10, speedDisplayY + 25);
    
    // Indicador de gravedad (debajo de la velocidad, más pequeño)
    const gravityDisplayY = speedDisplayY + speedDisplayHeight + 8;
    const gravityDisplayHeight = 25;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(padding, gravityDisplayY, UI.LEVEL_INFO_WIDTH, gravityDisplayHeight);
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding, gravityDisplayY, UI.LEVEL_INFO_WIDTH, gravityDisplayHeight);
    
    // Obtener gravedad actual según el tipo de vehículo
    const vehicleType = selectedCar?.vehicleType || 'monster_truck';
    let currentGravity;
    let gravityLabel;
    switch(vehicleType) {
        case 'bus':
            currentGravity = JUMP_PHYSICS.GRAVITY_BUS;
            gravityLabel = 'Bus';
            break;
        case 'f1':
            currentGravity = JUMP_PHYSICS.GRAVITY_F1;
            gravityLabel = 'F1';
            break;
        case 'monster_truck':
        default:
            currentGravity = JUMP_PHYSICS.GRAVITY;
            gravityLabel = 'MT';
            break;
    }
    
    ctx.fillStyle = '#2d3436';
    ctx.font = `700 ${UI.LEVEL_INFO_FONT_SIZE - 8}px Roboto`;
    ctx.textAlign = 'left';
    ctx.fillText(`G (${gravityLabel}): ${currentGravity.toFixed(2)}`, padding + 8, gravityDisplayY + 18);
    
    // Los botones ahora son HTML y se dibujan por encima del canvas
}

// Temas de fondo por nivel (cambia cada nivel)
const backgroundThemes = [
    // Nivel 1: Día soleado
    {
        skyColors: ['#87ceeb', '#98d8c8', '#f7dc6f'],
        sunColor: '#ffd700',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 3,
        timeOfDay: 'day'
    },
    // Nivel 2: Atardecer
    {
        skyColors: ['#ff6b6b', '#ffa500', '#ffd700', '#ff6347'],
        sunColor: '#ff8c00',
        sunPosition: { x: 1000, y: 150 },
        cloudCount: 4,
        timeOfDay: 'sunset'
    },
    // Nivel 3: Noche estrellada
    {
        skyColors: ['#191970', '#1a1a2e', '#0f3460'],
        sunColor: '#f0e68c',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 2,
        timeOfDay: 'night',
        stars: true,
        moonPhase: 'full' // Luna llena
    },
    // Nivel 4: Amanecer
    {
        skyColors: ['#ff69b4', '#ffb6c1', '#ffd700', '#87ceeb'],
        sunColor: '#ff4500',
        sunPosition: { x: 200, y: 100 },
        cloudCount: 3,
        timeOfDay: 'sunrise'
    },
    // Nivel 5: Día nublado
    {
        skyColors: ['#b0c4de', '#d3d3d3', '#c0c0c0'],
        sunColor: '#d3d3d3',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 5,
        timeOfDay: 'cloudy'
    },
    // Nivel 6: Día tropical
    {
        skyColors: ['#4ecdc4', '#44a08d', '#f7b733'],
        sunColor: '#ffd700',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 2,
        timeOfDay: 'day'
    },
    // Nivel 7: Atardecer púrpura
    {
        skyColors: ['#667eea', '#764ba2', '#f093fb'],
        sunColor: '#ff6b9d',
        sunPosition: { x: 1000, y: 150 },
        cloudCount: 3,
        timeOfDay: 'sunset'
    },
    // Nivel 8: Noche azul profundo
    {
        skyColors: ['#0c0c0c', '#1a237e', '#283593'],
        sunColor: '#ffffff',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 1,
        timeOfDay: 'night',
        stars: true,
        moonPhase: 'crescent' // Luna creciente
    },
    // Nivel 9: Día desértico
    {
        skyColors: ['#ffeaa7', '#fdcb6e', '#e17055'],
        sunColor: '#ff7675',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 0,
        timeOfDay: 'day'
    },
    // Nivel 10: Tormenta
    {
        skyColors: ['#636e72', '#2d3436', '#000000'],
        sunColor: '#95a5a6',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 6,
        timeOfDay: 'cloudy'
    },
    // Nivel 11: Cielo rosa suave
    {
        skyColors: ['#ffc0cb', '#ffb6c1', '#ff91a4'],
        sunColor: '#ff69b4',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 4,
        timeOfDay: 'day'
    },
    // Nivel 12: Atardecer dorado
    {
        skyColors: ['#ffd89b', '#ffecd2', '#fcb69f'],
        sunColor: '#ff8c42',
        sunPosition: { x: 1000, y: 150 },
        cloudCount: 3,
        timeOfDay: 'sunset'
    },
    // Nivel 13: Cielo verde menta
    {
        skyColors: ['#a8e6cf', '#dcedc1', '#ffd3a5'],
        sunColor: '#ffd700',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 2,
        timeOfDay: 'day'
    },
    // Nivel 14: Noche violeta
    {
        skyColors: ['#2d1b69', '#11998e', '#38ef7d'],
        sunColor: '#e0e0e0',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 1,
        timeOfDay: 'night',
        stars: true,
        moonPhase: 'waning' // Luna menguante
    },
    // Nivel 15: Cielo azul claro
    {
        skyColors: ['#74b9ff', '#0984e3', '#00b894'],
        sunColor: '#fdcb6e',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 3,
        timeOfDay: 'day'
    },
    // Nivel 16: Atardecer naranja intenso
    {
        skyColors: ['#ff7675', '#fd79a8', '#fdcb6e'],
        sunColor: '#e17055',
        sunPosition: { x: 1000, y: 150 },
        cloudCount: 4,
        timeOfDay: 'sunset'
    },
    // Nivel 17: Cielo gris perla
    {
        skyColors: ['#dfe6e9', '#b2bec3', '#636e72'],
        sunColor: '#b2bec3',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 6,
        timeOfDay: 'cloudy'
    },
    // Nivel 18: Amanecer rojo
    {
        skyColors: ['#ff4757', '#ff6348', '#ffa502'],
        sunColor: '#ff6348',
        sunPosition: { x: 200, y: 100 },
        cloudCount: 2,
        timeOfDay: 'sunrise'
    },
    // Nivel 19: Cielo índigo
    {
        skyColors: ['#4834d4', '#686de0', '#30336b'],
        sunColor: '#f0932b',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 2,
        timeOfDay: 'day'
    },
    // Nivel 20: Noche estrellada final
    {
        skyColors: ['#000000', '#1a1a2e', '#16213e'],
        sunColor: '#ffffff',
        sunPosition: { x: 1050, y: 30 },
        cloudCount: 0,
        timeOfDay: 'night',
        stars: true,
        moonPhase: 'half' // Media luna
    }
];

// Obtener tema de fondo según el nivel (cambia cada nivel)
function getBackgroundTheme(level) {
    const themeIndex = Math.min(level - 1, backgroundThemes.length - 1);
    return backgroundThemes[themeIndex];
}

// Dibujar fondo
function drawBackground() {
    const theme = getBackgroundTheme(currentLevel);
    
    // Cielo con gradiente según el tema
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    theme.skyColors.forEach((color, index) => {
        skyGradient.addColorStop(index / (theme.skyColors.length - 1), color);
    });
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Estrellas para tema nocturno
    if (theme.stars) {
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % canvas.width;
            const y = (i * 23) % (canvas.height / 2);
            const size = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Sol/Luna según el tema
    if (theme.timeOfDay === 'night' && theme.moonPhase) {
        // Dibujar luna con fase correspondiente
        let moonSprite = null;
        switch(theme.moonPhase) {
            case 'full':
                moonSprite = sprites.moonFull;
                break;
            case 'crescent':
                moonSprite = sprites.moonCrescent;
                break;
            case 'waning':
                moonSprite = sprites.moonWaning;
                break;
            case 'half':
                moonSprite = sprites.moonHalf;
                break;
            default:
                moonSprite = sprites.moonFull;
        }
        
        if (moonSprite) {
            const moonSize = 80;
            ctx.globalAlpha = 1;
            ctx.drawImage(moonSprite, theme.sunPosition.x, theme.sunPosition.y, moonSize, moonSize);
            ctx.globalAlpha = 1;
        } else {
            // Fallback si el sprite no está cargado
            ctx.fillStyle = theme.sunColor;
            ctx.globalAlpha = 1;
            const moonSize = 40;
            ctx.beginPath();
            ctx.arc(theme.sunPosition.x + moonSize, theme.sunPosition.y + moonSize, moonSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    } else {
        // Dibujar sol para temas diurnos
        if (sprites.sun) {
            const sunSize = theme.timeOfDay === 'cloudy' ? 80 : 100;
            ctx.globalAlpha = theme.timeOfDay === 'cloudy' ? 0.5 : 1;
            ctx.drawImage(sprites.sun, theme.sunPosition.x, theme.sunPosition.y, sunSize, sunSize);
            ctx.globalAlpha = 1;
        } else {
            // Fallback si el sprite no está cargado
            ctx.fillStyle = theme.sunColor;
            ctx.globalAlpha = theme.timeOfDay === 'cloudy' ? 0.5 : 1;
            const sunSize = 50;
            ctx.beginPath();
            ctx.arc(theme.sunPosition.x + sunSize, theme.sunPosition.y + sunSize, sunSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// Inicializar posiciones de nubes
function initializeCloudPositions() {
    const theme = getBackgroundTheme(currentLevel);
    cloudPositions = [];
    
    // Posiciones base para las nubes
    const basePositions = [
        { x: 150, y: 70 },
        { x: 450, y: 120 },
        { x: 750, y: 90 },
        { x: 300, y: 50 },
        { x: 900, y: 100 },
        { x: 1100, y: 80 }
    ];
    
    // Crear posiciones iniciales para cada nube según el tema
    for (let i = 0; i < theme.cloudCount; i++) {
        const basePos = basePositions[i % basePositions.length];
        // Agregar variación aleatoria para que no todas empiecen igual
        cloudPositions.push({
            x: basePos.x + (Math.random() * 200 - 100),
            y: basePos.y + (Math.random() * 40 - 20),
            speed: cloudSpeed + (Math.random() * 0.015) // Velocidad ligeramente variable por nube
        });
    }
}

// Actualizar posiciones de nubes
function updateClouds() {
    if (!canvas) return;
    
    const theme = getBackgroundTheme(currentLevel);
    
    // Si el número de nubes cambió, reinicializar
    if (cloudPositions.length !== theme.cloudCount) {
        initializeCloudPositions();
    }
    
    // Si no hay posiciones inicializadas, inicializar
    if (cloudPositions.length === 0) {
        initializeCloudPositions();
    }
    
    // Actualizar posición de cada nube
    for (let i = 0; i < cloudPositions.length; i++) {
        cloudPositions[i].x += cloudPositions[i].speed;
        
        // Si la nube sale por la derecha, reaparecer por la izquierda
        if (cloudPositions[i].x > canvas.width + 100) {
            cloudPositions[i].x = -100;
        }
        // Si la nube sale por la izquierda, reaparecer por la derecha (por si acaso)
        if (cloudPositions[i].x < -100) {
            cloudPositions[i].x = canvas.width + 100;
        }
    }
}

// Dibujar nubes
function drawClouds() {
    const theme = getBackgroundTheme(currentLevel);
    const cloudOpacity = theme.timeOfDay === 'night' ? 0.3 : (theme.timeOfDay === 'cloudy' ? 0.9 : 0.8);
    
    // Asegurar que las posiciones estén inicializadas
    if (cloudPositions.length === 0 || cloudPositions.length !== theme.cloudCount) {
        initializeCloudPositions();
    }
    
    if (sprites.cloud) {
        // Dibujar nubes usando sprite según el tema
        ctx.globalAlpha = cloudOpacity;
        for (let i = 0; i < theme.cloudCount; i++) {
            const pos = cloudPositions[i];
            ctx.drawImage(sprites.cloud, pos.x, pos.y, 100, 60);
        }
        ctx.globalAlpha = 1;
    } else {
        // Fallback si el sprite no está cargado
        ctx.fillStyle = `rgba(255, 255, 255, ${cloudOpacity})`;
        
        for (let i = 0; i < theme.cloudCount; i++) {
            const pos = cloudPositions[i];
            drawCloud(pos.x, pos.y);
        }
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
                case 'ufo':
                    spriteToUse = sprites.ufo;
                    break;
                case 'fire':
                    spriteToUse = sprites.fire;
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
            if (obstacleType !== 'tree' && obstacleType !== 'ufo') {
                // Los árboles son más altos y los platillos volantes están en el aire, no necesitan el emoji arriba
                ctx.font = 'bold 28px Roboto';
                ctx.textAlign = 'center';
                ctx.fillText('⚠️', obstacleScreenX + obstacle.width / 2, obstacle.y - 10);
            }
        }
    });
}

// Dibujar meta estilo carreras (bandera a cuadros)
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
        ctx.font = '700 36px Roboto';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
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
    
    // Reproducir sonido de choque cuando explota (sonido genérico)
    playCrashSound('obstacle');
    
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
    
    // Si se completó un nivel, desbloquear el siguiente nivel
    if (showNextLevel && gameState === 'won' && currentLevel < levels.length) {
        unlockLevel(currentLevel + 1);
        console.log(`Nivel ${currentLevel} completado. Desbloqueando nivel ${currentLevel + 1}`);
    }
    
    document.getElementById('messageTitle').textContent = title;
    // Permitir saltos de línea en el texto del mensaje
    const messageTextElement = document.getElementById('messageText');
    messageTextElement.textContent = '';
    const lines = text.split('\n');
    lines.forEach((line, index) => {
        if (index > 0) {
            messageTextElement.appendChild(document.createElement('br'));
        }
        messageTextElement.appendChild(document.createTextNode(line));
    });
    
    // Mostrar el botón "Siguiente Nivel" solo si showNextLevel es true y hay más niveles
    const nextLevelButton = document.getElementById('nextLevelButton');
    const shouldShowNextLevel = showNextLevel && currentLevel < levels.length;
    if (nextLevelButton) {
        nextLevelButton.style.display = shouldShowNextLevel ? 'inline-block' : 'none';
        console.log(`Botón "Siguiente Nivel": ${shouldShowNextLevel ? 'mostrado' : 'oculto'} (showNextLevel: ${showNextLevel}, currentLevel: ${currentLevel}, total niveles: ${levels.length})`);
    }
    
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
    
    // Resetear flags de pausa para evitar que el juego quede parado
    gamePaused = false;
    previousGameState = null;
    
    // Asegurar que el multiplicador esté dentro de los límites
    if (speedMultiplier < SPEED.MIN_MULTIPLIER) {
        speedMultiplier = SPEED.MIN_MULTIPLIER;
    }
    if (speedMultiplier > SPEED.MAX_MULTIPLIER) {
        speedMultiplier = SPEED.MAX_MULTIPLIER;
    }
    
    gameState = selectedCar ? 'playing' : 'selecting';
    
    // Reinicializar posiciones de nubes cuando se reinicia el juego
    initializeCloudPositions();
    
    // Actualizar velocidad según el nivel actual (manteniendo el multiplicador)
    roadSpeed = getRoadSpeedForLevel(currentLevel);
    
    // Actualizar display de velocidad si existe
    updateConfigSpeedDisplay();
    
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
    speedMultiplier = 1.0; // Resetear el multiplicador al reiniciar desde el nivel 1
    
    // Resetear flags de pausa
    gamePaused = false;
    previousGameState = null;
    
    attempts = 0;
    currentDistance = 0;
    roadScrollX = 0;
    
    // Actualizar velocidad según el nivel 1
    roadSpeed = getRoadSpeedForLevel(1);
    
    // Seleccionar un coche aleatorio para el nivel 1
    selectRandomCar();
    
    resetGame();
}

// Seleccionar un coche aleatorio
function selectRandomCar() {
    if (cars.length === 0) {
        console.error('No hay coches disponibles para seleccionar');
        return;
    }
    
    // Seleccionar un índice aleatorio
    const randomIndex = Math.floor(Math.random() * cars.length);
    const randomCar = cars[randomIndex];
    
    if (!randomCar) {
        console.error(`Error: No se pudo seleccionar un coche en el índice ${randomIndex}`);
        return;
    }
    
    // Seleccionar el coche sin mostrar el panel de selección
    selectedCar = randomCar;
    
    // Actualizar la selección visual en el panel (si existe)
    document.querySelectorAll('.car-option').forEach((opt, index) => {
        opt.classList.remove('selected');
        // Verificar que el coche existe antes de acceder a su propiedad id
        if (cars[index] && cars[index].id === randomCar.id) {
            opt.classList.add('selected');
        }
    });
    
    // Aplicar valores pre-fijados del coche
    angle = randomCar.baseAngle;
    speed = randomCar.baseSpeed;
    acceleration = randomCar.baseAcceleration;
    
    // Aplicar tema visual del coche seleccionado
    applyCarTheme(randomCar);
    
    console.log(`Coche aleatorio seleccionado para nivel ${currentLevel}: ${randomCar.name}`);
}

// Siguiente nivel
function nextLevel() {
    console.log(`Cambiando al siguiente nivel. Nivel actual: ${currentLevel}, Total niveles: ${levels.length}`);
    
    if (currentLevel < levels.length) {
        currentLevel++;
        currentLevelData = levels[currentLevel - 1];
        
        console.log(`Nuevo nivel seleccionado: ${currentLevel}`);
        
        // Desbloquear el nivel actual en la cookie
        unlockLevel(currentLevel);
        
        // Resetear flags de pausa
        gamePaused = false;
        previousGameState = null;
        
        // Asegurar que el multiplicador esté dentro de los límites
        if (speedMultiplier < SPEED.MIN_MULTIPLIER) {
            speedMultiplier = SPEED.MIN_MULTIPLIER;
        }
        if (speedMultiplier > SPEED.MAX_MULTIPLIER) {
            speedMultiplier = SPEED.MAX_MULTIPLIER;
        }
        
        // Actualizar velocidad según el nivel (aumenta 0.1 por nivel)
        // El multiplicador de velocidad se mantiene entre niveles
        roadSpeed = getRoadSpeedForLevel(currentLevel);
        attempts = 0;
        currentDistance = 0;
        roadScrollX = 0;
        
        // Seleccionar un coche aleatorio para este nivel
        selectRandomCar();
        
        // Asegurar que el panel de juego esté visible
        const gamePanel = document.getElementById('gamePanel');
        if (gamePanel) {
            gamePanel.style.display = 'flex';
        }
        
        // Ocultar el overlay de mensajes si está visible
        const messageOverlay = document.getElementById('messageOverlay');
        if (messageOverlay) {
            messageOverlay.style.display = 'none';
        }
        
        // Asegurar que los botones del canvas estén visibles
        const changeCarButton = document.getElementById('changeCarButton');
        const configButton = document.getElementById('configButton');
        const changeLevelButton = document.getElementById('changeLevelButton');
        if (changeCarButton) changeCarButton.style.display = 'flex';
        if (configButton) configButton.style.display = 'flex';
        if (changeLevelButton) changeLevelButton.style.display = 'flex';
        
        // Actualizar posición de los botones
        setTimeout(() => updateCanvasButtonsPosition(), 100);
        
        // Reiniciar el juego
        resetGame();
        
        // Iniciar el juego desde el nuevo nivel
        gameState = 'playing';
        draw();
        // Iniciar sonido del motor cuando comienza el juego
        startEngineSound();
        // Iniciar el bucle del juego automáticamente
        if (canvas && ctx && !gameLoopRunning) {
            gameLoop();
        }
        
        console.log(`Juego reiniciado desde el nivel ${currentLevel}`);
    } else {
        // Completaste todos los niveles
        allLevelsCompleted = true;
        // Desbloquear todos los niveles al completar el último
        for (let i = 1; i <= levels.length; i++) {
            unlockLevel(i);
        }
        showMessage('¡Felicidades! 🏆', `¡Completaste todos los ${levels.length} niveles! ¡Eres un campeón!`, false, true);
    }
}

// Inicializar cuando se carga la página
init();
