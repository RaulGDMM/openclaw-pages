// Cocobot OS - Script principal

// Estado global
let windows = {};
let snakeInterval, snakeDirection = { x: 1, y: 0 };
let snakePosition = [{ x: 12, y: 10 }];
let foodPosition = { x: 18, y: 12 };
let score = 0;
let miceEaten = 0;

// Contadores para easter egg
let rightClickCount = 0;
let rightClickTimer;

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeWindows();
    setupTerminal();
    setupClock();
    setupMenu();
    setupDraggableWindows();
    setupResizing();
    
    // Setup click en desktop para cerrar menús
    document.getElementById('desktop').addEventListener('click', (e) => {
        if (e.target.id === 'desktop' || e.target.closest('.window')) return;
        
        // Cerrar menú si se hace click fuera
        const startMenu = document.getElementById('start-menu');
        if (startMenu.style.display === 'block') {
            startMenu.style.display = 'none';
        }
    });
    
    // Easter egg: right-click counter
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        handleRightClick();
    });
});

function initializeWindows() {
    windows = {
        terminal: { el: document.getElementById('window-terminal'), active: false },
        'snake-game': { el: document.getElementById('window-snake-game'), active: false },
        'file-manager': { el: document.getElementById('window-file-manager'), active: false },
        'qa-dashboard': { el: document.getElementById('window-qa-dashboard'), active: false },
        settings: { el: document.getElementById('window-settings'), active: false }
    };
}

// Menu management
function setupMenu() {
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    let menuOpen = false;
    
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuOpen = !menuOpen;
        startMenu.style.display = menuOpen ? 'block' : 'none';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', () => {
        if (menuOpen) {
            menuOpen = false;
            startMenu.style.display = 'none';
        }
    });
    
    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!item.dataset.target && !item.onclick) return;
            
            menuOpen = false;
            startMenu.style.display = 'none';
            
            if (item.dataset.target) {
                openWindow(item.dataset.target);
            } else if (item.onclick) {
                item.onclick();
            }
        });
    });
}

// Window management
function openWindow(windowName) {
    // Close all windows first
    Object.values(windows).forEach(win => win.el.classList.remove('active'));
    Object.values(windows).forEach(win => win.active = false);
    
    // Update taskbar buttons
    document.querySelectorAll('.taskbar button').forEach(btn => btn.classList.remove('active'));
    
    // Open requested window
    const win = windows[windowName];
    if (win) {
        win.el.classList.add('active');
        win.active = true;
        
        // Bring to front
        win.el.style.zIndex = 20 + Object.keys(windows).length;
        
        // Highlight taskbar button
        const btnId = `btn-${windowName.replace('-', '_')}`;
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('active');
    }
    
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
    
    // Dim taskbar button
    const btnId = `btn-${windowName.replace('-', '_')}`;
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.remove('active');
    
    // Pause snake game
    if (windowName === 'snake-game') stopSnakeGame();
}

// Reset OS
function resetOS() {
    location.reload();
}

// Draggable windows
function setupDraggableWindows() {
    const headers = document.querySelectorAll('.window-header');
    
    headers.forEach(header => {
        let isDragging = false;
        let offsetX, offsetY;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return; // Don't drag if clicking close button
            
            isDragging = true;
            const windowEl = header.closest('.window');
            
            // Bring to front
            document.querySelectorAll('.window').forEach(w => w.style.zIndex = 10);
            windowEl.style.zIndex = 20 + Object.keys(windows).length;
            
            offsetX = e.clientX - windowEl.getBoundingClientRect().left;
            offsetY = e.clientY - windowEl.getBoundingClientRect().top;
            
            windowEl.dataset.offsetX = offsetX;
            windowEl.dataset.offsetY = offsetY;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const windowEl = header.closest('.window');
            const desktop = document.getElementById('desktop');
            const rect = desktop.getBoundingClientRect();
            
            let newX = e.clientX - rect.left - offsetX;
            let newY = e.clientY - rect.top - offsetY;
            
            // Keep within bounds
            const maxX = rect.width - windowEl.offsetWidth - 20;
            const maxY = rect.height - windowEl.offsetHeight - 20;
            
            newX = Math.max(20, Math.min(newX, maxX));
            newY = Math.max(30, Math.min(newY, maxY));
            
            windowEl.style.left = `${newX}px`;
            windowEl.style.top = `${newY}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    });
}

// Resizing windows
function setupResizing() {
    const windowsList = document.querySelectorAll('.window');
    
    windowsList.forEach(win => {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        win.appendChild(resizer);
        
        let isResizing = false;
        
        resizer.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = win.offsetWidth;
            const startHeight = win.offsetHeight;
            
            function doResize(e) {
                if (!isResizing) return;
                
                let newWidth = startWidth + (e.clientX - startX);
                let newHeight = startHeight + (e.clientY - startY);
                
                // Min/max constraints
                newWidth = Math.max(300, Math.min(newWidth, 90vw));
                newHeight = Math.max(300, Math.min(newHeight, 80vh));
                
                win.style.width = `${newWidth}px`;
                win.style.height = `${newHeight}px`;
            }
            
            document.addEventListener('mousemove', doResize);
            
            document.addEventListener('mouseup', () => {
                isResizing = false;
                document.removeEventListener('mousemove', doResize);
            }, { once: true });
        });
    });
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
    if (!output) return;
    
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

document.getElementById('sound-toggle').addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

function playMeowSound() {
    if (!soundEnabled) return;
    
    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
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

// Easter egg: Right-click counter
function handleRightClick() {
    rightClickCount++;
    
    clearTimeout(rightClickTimer);
    rightClickTimer = setTimeout(() => {
        rightClickCount = 0;
    }, 2000); // Reset after 2 seconds
    
    if (rightClickCount === 3) {
        showCocoPlushie();
        rightClickCount = 0;
    }
}

function showCocoPlushie() {
    playMeowSound(); // Play a special sound for Coco
    
    const cocoIcon = document.getElementById('coco-plushie');
    cocoIcon.classList.remove('hidden');
    
    // Make it bounce
    let bounce = 0;
    const interval = setInterval(() => {
        cocoIcon.style.transform = `scale(${1 + Math.sin(bounce * 0.3) * 0.2})`;
        bounce++;
        
        if (bounce > 10) {
            clearInterval(interval);
            cocoIcon.style.transform = 'none';
            setTimeout(() => {
                cocoIcon.classList.add('hidden');
            }, 3000);
        }
    }, 50);
}

// Snake Game Logic
function startSnakeGame() {
    const canvas = document.getElementById('snake-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    snakeInterval = setInterval(() => {
        // Move snake
        const head = { x: snakePosition[0].x + snakeDirection.x, y: snakePosition[0].y + snakeDirection.y };
        
        // Wall collision
        if (head.x < 0 || head.x >= 24 || head.y < 0 || head.y >= 18) {
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
    ctx.fillRect(0, 0, 480, 360);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    const gridSize = 20;
    for (let x = 0; x <= 480; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 360); ctx.stroke();
    }
    for (let y = 0; y <= 360; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(480, y); ctx.stroke();
    }
    
    // Draw food (rat/mouse icon as red circle)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(foodPosition.x * gridSize + gridSize/2, foodPosition.y * gridSize + gridSize/2, 8, 0, Math.PI * 2);
    ctx.fill();
    // Mouse ears
    ctx.fillStyle = '#ff8080';
    ctx.beginPath(); 
    ctx.arc(foodPosition.x * gridSize + gridSize/2 - 6, foodPosition.y * gridSize + gridSize/2 - 6, 3, 0, Math.PI * 2); 
    ctx.fill();
    ctx.beginPath(); 
    ctx.arc(foodPosition.x * gridSize + gridSize/2 + 6, foodPosition.y * gridSize + gridSize/2 - 6, 3, 0, Math.PI * 2); 
    ctx.fill();
    
    // Draw snake (Cocobot blue/gold)
    const headColor = '#d4af37'; // Gold for Cocobot
    const bodyColor = '#b8962a';
    
    snakePosition.forEach((pos, i) => {
        ctx.fillStyle = i === 0 ? headColor : bodyColor;
        ctx.fillRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x * gridSize, pos.y * gridSize, gridSize, gridSize);
        
        // Eyes on head
        if (i === 0) {
            ctx.fillStyle = '#fff';
            const eyeOffsetX = snakeDirection.x !== 0 ? gridSize/2 - 5 : (snakeDirection.y > 0 ? gridSize/2 - 5 : gridSize/2 + 5);
            const eyeOffsetY = snakeDirection.y !== 0 ? gridSize/2 - 5 : (snakeDirection.x > 0 ? gridSize/2 - 5 : gridSize/2 + 5);
            
            ctx.fillRect(pos.x * gridSize + gridSize/2 - 3, pos.y * gridSize + gridSize/2 - 3, 6, 6);
        }
    });
}

function placeFood() {
    foodPosition = {
        x: Math.floor(Math.random() * 24),
        y: Math.floor(Math.random() * 18)
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
    snakePosition = [{ x: 12, y: 10 }];
    snakeDirection = { x: 1, y: 0 };
    placeFood();
}