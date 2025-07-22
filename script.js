/**
 * SNACKFLY - RASCA Y GANA
 * Dinámica virtual de scratch card con premios aleatorios
 * Desarrollado con HTML5 Canvas y JavaScript puro
 */

// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    // Porcentaje mínimo para revelar automáticamente
    REVEAL_THRESHOLD: 70,
    
    // Tamaño del pincel de raspado
    BRUSH_SIZE: 30,
    
    // Premios disponibles
    PRIZES: [
        {
            text: "¡10% de descuento en tu próxima compra!",
            icon: "🎉",
            type: "discount",
            description: "Aplica el código SNACK10 al finalizar tu compra"
        },
        {
            text: "¡Producto gratis en tu siguiente compra!",
            icon: "🆓",
            type: "free_product",
            description: "Válido para productos de hasta $50.000"
        },
        {
            text: "PepinSnack Extra! 🥒",
            icon: "🥒",
            type: "free_shipping",
            description: "¡Recibe una porcion extra de PepinSnack en tu proximo pedido!"
        },
        {
            text: "Nada por hoy, ¡intenta de nuevo mañana!",
            icon: "😊",
            type: "try_again",
            description: "¡No te desanimes! Mañana tendrás otra oportunidad"
        },
        {
            text: "¡🍎 ManzanaBox 2x1!",
            icon: "🍎",
            type: "free_shipping",
            description: "¡Lleva dos ManzanaBox y paga solo una! Oferta especial para ti."
        }
    ],
    
    // Clave para localStorage
    STORAGE_KEY: "snackfly_scratch_game",
    
    // Milisegundos en un día
    ONE_DAY_MS: 24 * 60 * 60 * 1000
};

// ===== VARIABLES GLOBALES =====
let canvas, ctx;
let isScratching = false;
let scratchedPixels = 0;
let totalPixels = 0;
let gameCompleted = false;
let currentPrize = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

/**
 * Inicializa el juego completo
 */
function initializeGame() {
    console.log('🎮 Inicializando Snackfly Rasca y Gana...');
    
    // Verificar si ya jugó hoy
    if (hasPlayedToday()) {
        showAlreadyPlayed();
        return;
    }
    
    // Configurar canvas
    setupCanvas();
    
    // Generar premio aleatorio
    generateRandomPrize();
    
    // Configurar eventos
    setupEventListeners();
    
    // Crear capa de raspado
    createScratchLayer();
    
    console.log('✅ Juego inicializado correctamente');
}

/**
 * Configura el canvas para el raspado
 */
function setupCanvas() {
    canvas = document.getElementById('scratchCanvas');
    ctx = canvas.getContext('2d');
    
    // Configurar tamaño del canvas
    const card = document.querySelector('.scratch-card');
    const rect = card.getBoundingClientRect();
    
    canvas.width = 300;
    canvas.height = 200;
    
    // Calcular total de píxeles
    totalPixels = canvas.width * canvas.height;
    
    console.log(`📐 Canvas configurado: ${canvas.width}x${canvas.height}`);
}

/**
 * Genera un premio aleatorio
 */
function generateRandomPrize() {
    // Probabilidades: 25% descuento, 20% producto gratis, 15% envío gratis, 40% nada
    const random = Math.random();
    let prizeIndex;
    
    if (random < 0.25) {
        prizeIndex = 0; // 10% descuento
    } else if (random < 0.45) {
        prizeIndex = 1; // Producto gratis
    } else if (random < 0.60) {
        prizeIndex = 2; // Envío gratis
    } else {
        prizeIndex = 3; // Nada por hoy
    }
    
    currentPrize = CONFIG.PRIZES[prizeIndex];
    
    // Actualizar el mensaje de premio en el HTML
    const prizeText = document.getElementById('prizeText');
    const prizeIcon = document.querySelector('.prize-icon');
    
    prizeText.textContent = currentPrize.text;
    prizeIcon.textContent = currentPrize.icon;
    
    console.log('🎁 Premio generado:', currentPrize.text);
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
    // Eventos de mouse
    canvas.addEventListener('mousedown', startScratching);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', stopScratching);
    canvas.addEventListener('mouseleave', stopScratching);
    
    // Eventos táctiles para móvil
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopScratching);
    
    // Botón del modal
    document.getElementById('modalBtn').addEventListener('click', closeModal);
    
    // Botón de reinicio (para demo)
    // document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    console.log('🎯 Event listeners configurados');
}

/**
 * Crea la capa gris de raspado
 */
function createScratchLayer() {
    // Llenar con color gris
    ctx.fillStyle = '#95A5A6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Agregar patrón de textura
    ctx.fillStyle = '#7F8C8D';
    for (let i = 0; i < canvas.width; i += 20) {
        for (let j = 0; j < canvas.height; j += 20) {
            if ((i + j) % 40 === 0) {
                ctx.fillRect(i, j, 10, 10);
            }
        }
    }
    
    // Agregar texto "RASCA AQUÍ"
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Fredoka One, cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RASCA AQUÍ', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.font = '16px Poppins, sans-serif';
    ctx.fillText('🎁 ¡Descubre tu premio! 🎁', canvas.width / 2, canvas.height / 2 + 20);
    
    console.log('🎨 Capa de raspado creada');
}

/**
 * Inicia el proceso de raspado
 */
function startScratching(e) {
    if (gameCompleted) return;
    
    isScratching = true;
    canvas.style.cursor = 'none';
    
    // Reproducir sonido de raspado
    playSound('scratch');
    
    // Realizar primer raspado
    scratch(e);
}

/**
 * Realiza el raspado en la posición del cursor
 */
function scratch(e) {
    if (!isScratching || gameCompleted) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Configurar el pincel
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, CONFIG.BRUSH_SIZE, 0, 2 * Math.PI);
    ctx.fill();
    
    // Calcular porcentaje raspado
    calculateScratchedArea();
}

/**
 * Detiene el proceso de raspado
 */
function stopScratching() {
    isScratching = false;
    canvas.style.cursor = 'crosshair';
}

/**
 * Maneja el inicio del toque en móvil
 */
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

/**
 * Maneja el movimiento del toque en móvil
 */
function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

/**
 * Calcula el área raspada y verifica si debe revelar automáticamente
 */
function calculateScratchedArea() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let transparentPixels = 0;
    
    // Contar píxeles transparentes (raspados)
    for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) { // Canal alpha = 0 (transparente)
            transparentPixels++;
        }
    }
    
    const percentage = (transparentPixels / totalPixels) * 100;
    
    // Si se raspó más del umbral, revelar automáticamente
    if (percentage >= CONFIG.REVEAL_THRESHOLD && !gameCompleted) {
        revealPrize();
    }
}

/**
 * Revela el premio automáticamente
 */
function revealPrize() {
    gameCompleted = true;
    
    // Limpiar completamente el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Agregar animación a la tarjeta
    const card = document.querySelector('.scratch-card');
    card.classList.add('completed');
    
    // Ocultar instrucciones
    document.querySelector('.instructions').style.display = 'none';
    
    // Mostrar sección de reinicio
    document.getElementById('resetSection').style.display = 'block';
    
    // Guardar que ya jugó hoy
    savePlayDate();
    
    // Mostrar modal con premio después de una pequeña pausa
    setTimeout(() => {
        showPrizeModal();
        createConfetti();
    }, 800);
    
    console.log('🎊 Premio revelado:', currentPrize.text);
}

/**
 * Muestra el modal con el premio ganado
 */
function showPrizeModal() {
    const modal = document.getElementById('modalOverlay');
    const modalIcon = document.getElementById('modalIcon');
    const modalPrize = document.getElementById('modalPrize');
    const modalDescription = document.getElementById('modalDescription');
    
    // Configurar contenido del modal
    modalIcon.textContent = currentPrize.icon;
    modalPrize.textContent = currentPrize.text;
    modalDescription.textContent = currentPrize.description;
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Reproducir sonido de victoria
    playSound('win');
}

/**
 * Cierra el modal
 */
function closeModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('show');
}

/**
 * Crea efecto de confetti
 */
function createConfetti() {
    const colors = ['#FF6B35', '#F7931E', '#FFD23F', '#4CAF50', '#FF5722'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 2 + 's';
            
            document.body.appendChild(confetti);
            
            // Remover después de la animación
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 50);
    }
}

/**
 * Reproduce efectos sonoros
 */
function playSound(type) {
    // Crear sonidos sintéticos usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === 'scratch') {
        // Sonido de raspado (ruido blanco corto)
        const bufferSize = audioContext.sampleRate * 0.1; // 0.1 segundos
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.1; // Ruido suave
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        
    } else if (type === 'win') {
        // Sonido de victoria (secuencia de tonos ascendentes)
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            }, index * 150);
        });
    }
}

/**
 * Verifica si ya jugó hoy
 */
function hasPlayedToday() {
    const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    if (!savedData) return false;
    
    const data = JSON.parse(savedData);
    const lastPlayDate = new Date(data.lastPlayDate);
    const today = new Date();
    
    // Verificar si es el mismo día
    return lastPlayDate.toDateString() === today.toDateString();
}

/**
 * Guarda la fecha de juego actual
 */
function savePlayDate() {
    const data = {
        lastPlayDate: new Date().toISOString(),
        totalPlays: getTotalPlays() + 1
    };
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
    console.log('💾 Fecha de juego guardada');
}

/**
 * Obtiene el total de veces que ha jugado
 */
function getTotalPlays() {
    const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    if (!savedData) return 0;
    
    const data = JSON.parse(savedData);
    return data.totalPlays || 0;
}

/**
 * Muestra mensaje cuando ya jugó hoy
 */
function showAlreadyPlayed() {
    // Ocultar tarjeta de raspado
    document.querySelector('.scratch-card-container').style.display = 'none';
    
    // Mostrar mensaje
    const gameSection = document.querySelector('.game-section');
    const alreadyPlayedDiv = document.createElement('div');
    alreadyPlayedDiv.className = 'already-played';
    alreadyPlayedDiv.innerHTML = `
        <div style="text-align: center; color: white; padding: 40px;">
            <div style="font-size: 4rem; margin-bottom: 20px;">⏰</div>
            <h3 style="font-family: 'Fredoka One', cursive; font-size: 2rem; margin-bottom: 15px;">
                ¡Ya jugaste hoy!
            </h3>
            <p style="font-size: 1.2rem; margin-bottom: 20px;">
                Vuelve mañana para otra oportunidad de ganar
            </p>
            <p style="font-size: 1rem; opacity: 0.8;">
                Total de veces jugadas: ${getTotalPlays()}
            </p>
            <button onclick="resetGame()" style="
                background: white; 
                color: #FF6B35; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 25px; 
                font-size: 1rem; 
                font-weight: 600; 
                cursor: pointer; 
                margin-top: 20px;
                transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🔄 Probar Demo
            </button>
        </div>
    `;
    
    gameSection.appendChild(alreadyPlayedDiv);
    
    console.log('⏰ Usuario ya jugó hoy');
}

/**
 * Reinicia el juego (solo para demo)
 */
function resetGame() {
    // Limpiar localStorage
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    
    // Recargar página
    location.reload();
    
    console.log('🔄 Juego reiniciado');
}

// ===== UTILIDADES ADICIONALES =====

/**
 * Detecta si es un dispositivo móvil
 */
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Ajusta el tamaño del pincel según el dispositivo
 */
function adjustBrushSize() {
    if (isMobileDevice()) {
        CONFIG.BRUSH_SIZE = 40; // Pincel más grande para móvil
    }
}

// Ajustar configuración al cargar
adjustBrushSize();

console.log('🚀 Script de Snackfly Rasca y Gana cargado correctamente');

