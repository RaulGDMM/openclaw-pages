// Cocobot OS - Script principal

// Estado global
let windows = {};
let snakeInterval, snakeDirection = { x: 1, y: 0 };
let snakePosition = [{ x: 10, y: 10 }];
let foodPosition = { x: 15, y: 10 };
let score = 0;
let miceEaten = 0;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeWindows();
    setupTerminal();
    setupClock();
    document.body.addEventListener('click', handleBackgroundClick);
    
    // Snake game setup
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    
    // Key controls for snake
    document.addEventListener('keydown', (e) => {
        if (!windows['snake-game'].active) return;
        
        switch(e.key) {
            case 'ArrowUp': if (snakeDirection.y === 0) snakeDirection = { x: 0, y: -1 }; break;
            case 'ArrowDown': if (snakeDirection.y === 0) snakeDirection = { x: 0, y: 1 }; break;
            case 'ArrowLeft': if (snakeDirection.x === 0) snakeDirection = { x: -1, y: 0 }; break;
            case 'ArrowRight': if (snakeDirection.x === 0) snakeDirection = { x: 1, y: 0 }; break;
        }
    });
    
    // Start snake game loop
    startSnakeGame();
});

function initializeWindows() {
    windows = {
        terminal: { el: document.getElementById('window-terminal'), active: true },
        'snake-game': { el: document.getElementById('window-snake-game'), active: false },
        'file-manager': { el: document.getElementById('window-file-manager'), active: false },
        'qa-dashboard': { el: document.getElementById('window-qa-dashboard'), active: false },
        settings: { el: document.getElementById('window-settings'), active: false }
    };
}

// Window management
function openWindow(windowName) {
    Object.values(windows).forEach(win => win.el.classList.remove('active'));
    windows[windowName].el.classList.add('active');
    windows[windowName].active = true;
    
    // Focus terminal input if opening terminal
    if (windowName === 'terminal') {
        setTimeout(() => document.getElementById('term-input').focus(), 100);
    }
    
    // Resume snake game
    if (windowName === 'snake-game' && !snakeInterval) startSnakeGame();
}

function closeWindow(windowName) {
    windows[windowName].el.classList.remove('active');
    windows[windowName].active = false;
    
    // Pause snake game
    if (windowName === 'snake-game') stopSnakeGame();
}

function handleBackgroundClick(e) {
    if (e.target.id === 'desktop') {
        Object.values(windows).forEach(win => win.el.classList.remove('active'));
        Object.values(windows).forEach(win => win.active = false);
    }
}

// Terminal commands
function setupTerminal() {
    const input = document.getElementById('term-input');
    const output = document.querySelector('.terminal .output');
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = input.value.trim().toLowerCase();
            processCommand(command, output);
            input.value = '';
            
            // Echo command
            addTermLine(`root@cocobot:~# ${command}`);
        }
    });
}

function addTermLine(text) {
    const output = document.querySelector('.terminal .output');
    const div = document.createElement('div');
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

function processCommand(cmd, output) {
    switch(cmd) {
        case 'help':
            addTermLine('Comandos disponibles:');
            addTermLine('  help       - Muestra este menú');
            addTermLine('  hunt       - Inicia búsqueda de bugs');
            addTermLine('  test       - Ejecuta tests automáticos');
            addTermLine('  meow       - Haz que Cocobot maúlle');
            addTermLine('  status     - Muestra estado del sistema');
            addTermLine('  clear      - Limpia la terminal');
            break;
            
        case 'hunt':
            addTermLine('🔍 Buscando bugs en el código...');
            setTimeout(() => {
                addTermLine('✅ ¡Encontrado! Un bug oculto en la línea 42.');
                addTermLine('📝 Reporte generado: /home/cocobot/bugs/bug_001.txt');
            }, 1500);
            break;
            
        case 'test':
            addTermLine('🧪 Ejecutando suite de tests...');
            setTimeout(() => {
                addTermLine('✅ test_login_user (0.2s)');
                addTermLine('✅ test_checkout_flow (0.5s)');
                addTermLine('❌ test_payment_gateway (1.2s) — Timeout');
                addTermLine('✅ test_product_search (0.1s)');
                addTermLine('');
                addTermLine(`📊 Coverage: ${Math.floor(Math.random() * 13 + 85)}%`);
            }, 2000);
            break;
            
        case 'meow':
            addTermLine('🐱 Miau~ 🐾');
            playMeowSound();
            break;
            
        case 'status':
            addTermLine('🚀 Cocobot OS v1.0 — Activo');
            addTermLine(`🕒 Hora actual: ${new Date().toLocaleTimeString()}`);
            addTermLine(`💾 Memoria: ${Math.floor(Math.random() * 20 + 40)}% usada`);
            addTermLine('🌐 Red: Conectado (WiFi: CocoNet_5G)');
            break;
            
        case 'clear':
            output.innerHTML = '';
            break;
            
        default:
            if (cmd) {
                addTermLine(`bash: ${cmd}: comando no encontrado`);
            }
    }
}

// Clock
function setupClock() {
    const clockEl = document.getElementById('clock-time');
    
    setInterval(() => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 1000);
}

// Meow sounds (using Web Audio API)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;

function playMeowSound() {
    if (!soundEnabled) return;
    
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    // Cat-like meow: frequency sweep from high to low
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
}

// Snake Game Logic
function startSnakeGame() {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    
    snakeInterval = setInterval(() => {
        // Move snake
        const head = { x: snakePosition[0].x + snakeDirection.x, y: snakePosition[0].y + snakeDirection.y };
        
        // Wall collision
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 15) {
            gameOver();
            return;
        }
        
        // Self collision
        for (let pos of snakePosition) {
            if (pos.x === head.x && pos.y === head.y) {
                gameOver();
                return;
            }
        }
        
        snakePosition.unshift(head);
        
        // Eat food
        if (head.x === foodPosition.x && head.y === foodPosition.y) {
            score += 10;
            miceEaten++;
            updateScore();
            placeFood();
            playMeowSound(); // Meow when catching a mouse!
        } else {
            snakePosition.pop();
        }
        
        drawSnake(ctx);
    }, 150);
}

function stopSnakeGame() {
    clearInterval(snakeInterval);
    snakeInterval = null;
}

function drawSnake(ctx) {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 400, 300);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    for (let x = 0; x <= 400; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke();
    }
    for (let y = 0; y <= 300; y += 20) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(400, y); ctx.stroke();
    }
    
    // Draw food (rat/mouse icon as red circle)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(foodPosition.x * 20 + 10, foodPosition.y * 20 + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    // Mouse ears
    ctx.fillStyle = '#ff8080';
    ctx.beginPath(); ctx.arc(foodPosition.x * 20 + 6, foodPosition.y * 20 + 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(foodPosition.x * 20 + 14, foodPosition.y * 20 + 6, 3, 0, Math.PI * 2); ctx.fill();
    
    // Draw snake (Cocobot blue)
    ctx.fillStyle = '#d4af37'; // Gold for Cocobot
    snakePosition.forEach((pos, i) => {
        ctx.fillRect(pos.x * 20, pos.y * 20, 20, 20);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x * 20, pos.y * 20, 20, 20);
        
        // Eyes on head
        if (i === 0) {
            ctx.fillStyle = '#fff';
            const eyeOffsetX = snakeDirection.x !== 0 ? 5 : (snakeDirection.y > 0 ? 5 : 11);
            const eyeOffsetY = snakeDirection.y !== 0 ? 5 : (snakeDirection.x > 0 ? 5 : 11);
            ctx.fillRect(pos.x * 20 + eyeOffsetX, pos.y * 20 + eyeOffsetY, 4, 4);
            ctx.fillStyle = '#d4af37';
        }
    });
}

function placeFood() {
    foodPosition = {
        x: Math.floor(Math.random() * 20),
        y: Math.floor(Math.random() * 15)
    };
    
    // Make sure not on snake
    for (let pos of snakePosition) {
        if (pos.x === foodPosition.x && pos.y === foodPosition.y) placeFood();
    }
}

function updateScore() {
    document.getElementById('snake-score').textContent = score;
    document.getElementById('mice-eaten').textContent = miceEaten;
}

function gameOver() {
    stopSnakeGame();
    alert(`GAME OVER! 🐍\n\nPuntuación final: ${score}\nRatones comidos: ${miceEaten}\n\n¡Intenta otra vez!`);
    
    // Reset game
    score = 0;
    miceEaten = 0;
    updateScore();
    snakePosition = [{ x: 10, y: 10 }];
    snakeDirection = { x: 1, y: 0 };
    placeFood();
}