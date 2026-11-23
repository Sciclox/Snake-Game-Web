/**
 * CYBERSNAKE: NEON ARCADE DX - MOTOR DE VIDEOJUEGO HTML5 CANVAS
 * Generado por chimera-godmode:7b | Supervisado y Armonizado por Antigravity
 */

(() => {
    // -------------------------------------------------------------------------
    // 1. Configuración de Canvas y Entorno
    // -------------------------------------------------------------------------
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const GRID_SIZE = 20; // Tamaño de cada celda en píxeles
    const COLS = canvas.width / GRID_SIZE; // 30 columnas
    const ROWS = canvas.height / GRID_SIZE; // 30 filas

    // Elementos del DOM / HUD
    const scoreDisplay = document.getElementById('scoreDisplay');
    const highScoreDisplay = document.getElementById('highScoreDisplay');
    const speedDisplay = document.getElementById('speedDisplay');
    const muteBtn = document.getElementById('muteBtn');
    const pauseBtn = document.getElementById('pauseBtn');

    // Overlays
    const startScreen = document.getElementById('startScreen');
    const pauseScreen = document.getElementById('pauseScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startGameBtn = document.getElementById('startGameBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
    const playAgainBtn = document.getElementById('playAgainBtn');
    const changeDifficultyBtn = document.getElementById('changeDifficultyBtn');

    // Recap Modal
    const finalScore = document.getElementById('finalScore');
    const finalHighScore = document.getElementById('finalHighScore');
    const medalDisplay = document.getElementById('medalDisplay');
    const newRecordBadge = document.getElementById('newRecordBadge');

    // -------------------------------------------------------------------------
    // 2. Motor de Audio Sintetizado (Web Audio API Procedural - Cero Archivos Externos)
    // -------------------------------------------------------------------------
    let audioCtx = null;
    let isMuted = false;

    function initAudio() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playTone(freq, type = 'square', duration = 0.08, volume = 0.15) {
        if (isMuted || !audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            // Silencioso ante bloqueos de audio
        }
    }

    const Sound = {
        turn: () => playTone(360, 'sine', 0.04, 0.08),
        eat: () => {
            if (isMuted || !audioCtx) return;
            playTone(587.33, 'triangle', 0.08, 0.2); // D5
            setTimeout(() => playTone(880, 'triangle', 0.1, 0.2), 40); // A5
        },
        bonus: () => {
            if (isMuted || !audioCtx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
            notes.forEach((freq, idx) => {
                setTimeout(() => playTone(freq, 'square', 0.09, 0.18), idx * 50);
            });
        },
        freeze: () => {
            if (isMuted || !audioCtx) return;
            playTone(987.77, 'sine', 0.2, 0.15);
            setTimeout(() => playTone(659.25, 'sine', 0.25, 0.15), 80);
        },
        gameOver: () => {
            if (isMuted || !audioCtx) return;
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, audioCtx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.45);
                gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);

                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.45);
            } catch (e) {}
        }
    };

    // -------------------------------------------------------------------------
    // 3. Sistema de Partículas para Efectos Arcade
    // -------------------------------------------------------------------------
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha = 1;
            this.decay = Math.random() * 0.03 + 0.02;
            this.size = Math.random() * 3 + 2;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    let particles = [];
    function spawnParticles(gridX, gridY, color, count = 20) {
        const cx = gridX * GRID_SIZE + GRID_SIZE / 2;
        const cy = gridY * GRID_SIZE + GRID_SIZE / 2;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(cx, cy, color));
        }
    }

    // -------------------------------------------------------------------------
    // 4. Estado y Lógica del Juego
    // -------------------------------------------------------------------------
    let snake = [];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 15, y: 15, type: 'normal' };
    let bonusItem = null; // { x, y, type: 'golden'|'freeze', timer, maxTimer }
    
    let score = 0;
    let highScore = parseInt(localStorage.getItem('cybersnake_highscore') || '0', 10);
    let state = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    
    let tickSpeed = 85; // ms por movimiento
    let baseSpeed = 85;
    let speedLabel = 'CLÁSICO';
    let solidWalls = true;
    let lastTickTime = 0;
    let freezeTimer = 0;
    let screenShake = 0;

    // Actualizar High Score en pantalla
    highScoreDisplay.textContent = highScore.toString().padStart(4, '0');

    function resetGame() {
        const midX = Math.floor(COLS / 2);
        const midY = Math.floor(ROWS / 2);
        snake = [
            { x: midX, y: midY },
            { x: midX - 1, y: midY },
            { x: midX - 2, y: midY }
        ];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        bonusItem = null;
        particles = [];
        freezeTimer = 0;
        screenShake = 0;
        scoreDisplay.textContent = '0000';
        speedDisplay.textContent = speedLabel;
        spawnFood();
    }

    function spawnFood() {
        let attempts = 0;
        while (attempts < 200) {
            const rx = Math.floor(Math.random() * COLS);
            const ry = Math.floor(Math.random() * ROWS);
            const inSnake = snake.some(s => s.x === rx && s.y === ry);
            if (!inSnake) {
                food = { x: rx, y: ry, type: 'normal' };
                break;
            }
            attempts++;
        }
    }

    function maybeSpawnBonus() {
        if (bonusItem || Math.random() > 0.35) return;
        let attempts = 0;
        while (attempts < 200) {
            const rx = Math.floor(Math.random() * COLS);
            const ry = Math.floor(Math.random() * ROWS);
            const inSnake = snake.some(s => s.x === rx && s.y === ry);
            const inFood = (food.x === rx && food.y === ry);
            if (!inSnake && !inFood) {
                const isGolden = Math.random() > 0.4;
                bonusItem = {
                    x: rx,
                    y: ry,
                    type: isGolden ? 'golden' : 'freeze',
                    timer: 160, // frames activos
                    maxTimer: 160
                };
                break;
            }
            attempts++;
        }
    }

    // -------------------------------------------------------------------------
    // 5. Bucle de Simulación de Física y Colisiones
    // -------------------------------------------------------------------------
    function updateGame() {
        // Actualizar dirección si no es opuesta
        dir = nextDir;

        let newHeadX = snake[0].x + dir.x;
        let newHeadY = snake[0].y + dir.y;

        // Comprobación de Bordes / Muros
        if (solidWalls) {
            if (newHeadX < 0 || newHeadX >= COLS || newHeadY < 0 || newHeadY >= ROWS) {
                triggerGameOver();
                return;
            }
        } else {
            // Atravesar bordes (Toroidal wrap)
            if (newHeadX < 0) newHeadX = COLS - 1;
            else if (newHeadX >= COLS) newHeadX = 0;
            if (newHeadY < 0) newHeadY = ROWS - 1;
            else if (newHeadY >= ROWS) newHeadY = 0;
        }

        // Auto-colisión con el propio cuerpo
        for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === newHeadX && snake[i].y === newHeadY) {
                triggerGameOver();
                return;
            }
        }

        const newHead = { x: newHeadX, y: newHeadY };
        snake.unshift(newHead);

        // Comer Manzana Normal
        if (newHead.x === food.x && newHead.y === food.y) {
            score += 10;
            scoreDisplay.textContent = score.toString().padStart(4, '0');
            Sound.eat();
            spawnParticles(food.x, food.y, '#FF007F', 24);
            spawnFood();
            maybeSpawnBonus();
        } else if (bonusItem && newHead.x === bonusItem.x && newHead.y === bonusItem.y) {
            // Comer Ítem Especial
            if (bonusItem.type === 'golden') {
                score += 50;
                Sound.bonus();
                spawnParticles(bonusItem.x, bonusItem.y, '#FFD700', 35);
            } else {
                score += 25;
                freezeTimer = 60; // Ralentiza por unos 5 segundos
                Sound.freeze();
                spawnParticles(bonusItem.x, bonusItem.y, '#00F0FF', 35);
            }
            scoreDisplay.textContent = score.toString().padStart(4, '0');
            bonusItem = null;
        } else {
            // Si no comió, avanza quitando la cola
            snake.pop();
        }

        // Gestionar temporizador de bonus
        if (bonusItem) {
            bonusItem.timer--;
            if (bonusItem.timer <= 0) {
                bonusItem = null;
            }
        }

        // Gestionar temporizador de freeze
        if (freezeTimer > 0) {
            freezeTimer--;
        }
    }

    function triggerGameOver() {
        state = 'GAMEOVER';
        screenShake = 15;
        Sound.gameOver();
        spawnParticles(snake[0].x, snake[0].y, '#FF0055', 40);

        const isNewRecord = score > highScore;
        if (isNewRecord) {
            highScore = score;
            localStorage.setItem('cybersnake_highscore', highScore.toString());
            highScoreDisplay.textContent = highScore.toString().padStart(4, '0');
        }

        finalScore.textContent = score;
        finalHighScore.textContent = highScore;
        newRecordBadge.style.display = isNewRecord && score > 0 ? 'block' : 'none';

        // Asignar Medalla según Puntuación
        if (score >= 400) medalDisplay.textContent = '💎 Leyenda Cyber';
        else if (score >= 250) medalDisplay.textContent = '🥇 Maestro Neon';
        else if (score >= 120) medalDisplay.textContent = '🥈 Pro Arcade';
        else medalDisplay.textContent = '🥉 Novato';

        gameOverScreen.classList.add('active');
    }

    // -------------------------------------------------------------------------
    // 6. Motor Gráfico de Renderizado en Canvas
    // -------------------------------------------------------------------------
    function drawGrid() {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    function drawSnake() {
        snake.forEach((seg, index) => {
            const px = seg.x * GRID_SIZE;
            const py = seg.y * GRID_SIZE;

            ctx.save();
            if (index === 0) {
                // Cabeza de la culebra
                ctx.fillStyle = '#00FF88';
                ctx.shadowColor = '#00FF88';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.roundRect(px + 1, py + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6);
                ctx.fill();

                // Ojos direccionales
                ctx.fillStyle = '#070913';
                const eyeOffset = 4;
                const eyeSize = 3;
                let e1 = { x: px + eyeOffset, y: py + eyeOffset };
                let e2 = { x: px + GRID_SIZE - eyeOffset - eyeSize, y: py + eyeOffset };

                if (dir.x === 1) { // Derecha
                    e1 = { x: px + GRID_SIZE - eyeOffset - eyeSize, y: py + eyeOffset };
                    e2 = { x: px + GRID_SIZE - eyeOffset - eyeSize, y: py + GRID_SIZE - eyeOffset - eyeSize };
                } else if (dir.x === -1) { // Izquierda
                    e1 = { x: px + eyeOffset, y: py + eyeOffset };
                    e2 = { x: px + eyeOffset, y: py + GRID_SIZE - eyeOffset - eyeSize };
                } else if (dir.y === 1) { // Abajo
                    e1 = { x: px + eyeOffset, y: py + GRID_SIZE - eyeOffset - eyeSize };
                    e2 = { x: px + GRID_SIZE - eyeOffset - eyeSize, y: py + GRID_SIZE - eyeOffset - eyeSize };
                }
                ctx.fillRect(e1.x, e1.y, eyeSize, eyeSize);
                ctx.fillRect(e2.x, e2.y, eyeSize, eyeSize);
            } else {
                // Cuerpo con degradado de color hacia cyan
                const ratio = index / snake.length;
                ctx.fillStyle = ratio > 0.6 ? '#00E5FF' : '#00FF9D';
                ctx.shadowColor = '#00FF9D';
                ctx.shadowBlur = Math.max(2, 8 - index * 0.2);
                ctx.beginPath();
                ctx.roundRect(px + 2, py + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    function drawFood() {
        const fx = food.x * GRID_SIZE + GRID_SIZE / 2;
        const fy = food.y * GRID_SIZE + GRID_SIZE / 2;
        const radius = (GRID_SIZE / 2) - 2;

        ctx.save();
        ctx.fillStyle = '#FF007F';
        ctx.shadowColor = '#FF007F';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(fx, fy, radius, 0, Math.PI * 2);
        ctx.fill();

        // Brillo interior
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(fx - 2, fy - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawBonusItem() {
        if (!bonusItem) return;
        const bx = bonusItem.x * GRID_SIZE + GRID_SIZE / 2;
        const by = bonusItem.y * GRID_SIZE + GRID_SIZE / 2;
        const isGolden = bonusItem.type === 'golden';
        const color = isGolden ? '#FFD700' : '#00F0FF';

        // Parpadeo cuando está a punto de expirar
        if (bonusItem.timer < 40 && Math.floor(bonusItem.timer / 4) % 2 === 0) {
            return;
        }

        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;

        // Anillo de tiempo restante
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const progress = bonusItem.timer / bonusItem.maxTimer;
        ctx.arc(bx, by, (GRID_SIZE / 2) + 2, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * progress));
        ctx.stroke();

        // Estrella o Diamante central
        ctx.beginPath();
        ctx.arc(bx, by, (GRID_SIZE / 2) - 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function render(timestamp) {
        // Efecto Screen Shake
        ctx.save();
        if (screenShake > 0) {
            const rx = (Math.random() - 0.5) * screenShake;
            const ry = (Math.random() - 0.5) * screenShake;
            ctx.translate(rx, ry);
            screenShake *= 0.9;
            if (screenShake < 0.5) screenShake = 0;
        }

        // Limpieza de Canvas
        ctx.fillStyle = '#060910';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();

        if (state === 'PLAYING' || state === 'PAUSED' || state === 'GAMEOVER') {
            drawFood();
            drawBonusItem();
            drawSnake();

            // Partículas
            for (let i = particles.length - 1; i >= 0; i--) {
                particles[i].update();
                particles[i].draw(ctx);
                if (particles[i].alpha <= 0) {
                    particles.splice(i, 1);
                }
            }
        }
        ctx.restore();

        // Control de Tiempo y Ticks de Física
        if (state === 'PLAYING') {
            const currentSpeed = freezeTimer > 0 ? baseSpeed * 1.6 : baseSpeed;
            if (timestamp - lastTickTime >= currentSpeed) {
                lastTickTime = timestamp;
                updateGame();
            }
        }

        requestAnimationFrame(render);
    }

    // -------------------------------------------------------------------------
    // 7. Manejo de Controles (Teclado, Táctil, Botones)
    // -------------------------------------------------------------------------
    function changeDirection(dx, dy) {
        if (state !== 'PLAYING') return;
        // Evitar giro de 180 grados sobre sí mismo
        if ((dx !== 0 && dir.x === -dx) || (dy !== 0 && dir.y === -dy)) return;
        if (dir.x !== dx || dir.y !== dy) {
            nextDir = { x: dx, y: dy };
            Sound.turn();
        }
    }

    window.addEventListener('keydown', (e) => {
        initAudio();
        const key = e.key.toLowerCase();

        if (key === 'arrowup' || key === 'w') {
            e.preventDefault();
            changeDirection(0, -1);
        } else if (key === 'arrowdown' || key === 's') {
            e.preventDefault();
            changeDirection(0, 1);
        } else if (key === 'arrowleft' || key === 'a') {
            e.preventDefault();
            changeDirection(-1, 0);
        } else if (key === 'arrowright' || key === 'd') {
            e.preventDefault();
            changeDirection(1, 0);
        } else if (key === ' ' || key === 'spacebar') {
            e.preventDefault();
            togglePause();
        } else if (key === 'r') {
            e.preventDefault();
            startNewGame();
        }
    });

    // Controles D-Pad Táctil
    const bindTouch = (id, dx, dy) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const trigger = (e) => {
            e.preventDefault();
            initAudio();
            changeDirection(dx, dy);
        };
        btn.addEventListener('touchstart', trigger, { passive: false });
        btn.addEventListener('mousedown', trigger);
    };

    bindTouch('btnUp', 0, -1);
    bindTouch('btnDown', 0, 1);
    bindTouch('btnLeft', -1, 0);
    bindTouch('btnRight', 1, 0);

    // Controles de Pausa y Mute
    function togglePause() {
        if (state === 'PLAYING') {
            state = 'PAUSED';
            pauseScreen.classList.add('active');
        } else if (state === 'PAUSED') {
            state = 'PLAYING';
            pauseScreen.classList.remove('active');
            lastTickTime = performance.now();
        }
    }

    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (resumeBtn) resumeBtn.addEventListener('click', togglePause);
    if (restartFromPauseBtn) {
        restartFromPauseBtn.addEventListener('click', () => {
            pauseScreen.classList.remove('active');
            startNewGame();
        });
    }

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            const icon = muteBtn.querySelector('i');
            if (icon) {
                icon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            }
        });
    }

    // Configuración de Dificultad
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            baseSpeed = parseInt(btn.getAttribute('data-speed'), 10);
            speedLabel = btn.getAttribute('data-label');
            speedDisplay.textContent = speedLabel;
        });
    });

    // Configuración de Regla de Muros
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            solidWalls = btn.getAttribute('data-walls') === 'solid';
        });
    });

    function startNewGame() {
        initAudio();
        startScreen.classList.remove('active');
        gameOverScreen.classList.remove('active');
        pauseScreen.classList.remove('active');
        resetGame();
        state = 'PLAYING';
        lastTickTime = performance.now();
    }

    if (startGameBtn) startGameBtn.addEventListener('click', startNewGame);
    if (playAgainBtn) playAgainBtn.addEventListener('click', startNewGame);
    if (changeDifficultyBtn) {
        changeDifficultyBtn.addEventListener('click', () => {
            gameOverScreen.classList.remove('active');
            startScreen.classList.add('active');
            state = 'MENU';
        });
    }

    // Iniciar loop de renderizado gráfico
    requestAnimationFrame(render);
    console.log('🎮 CyberSnake DX Engine inicializado con éxito al 100%.');
})();
