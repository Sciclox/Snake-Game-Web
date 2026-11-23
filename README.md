# 🕹️ CyberSnake: Neon Arcade DX

Videojuego arcade retro-futurista de la culebrita en HTML5 Canvas con sintetizador Web Audio API, sistema de partículas y aceleración gráfica.

> **Forjado por:** `chimera-godmode:7b`  
> **Supervisado y Armonizado por:** `Antigravity`  
> **Ubicación:** `C:\Users\Lenovo\OneDrive\Documentos\Proyectos\Snake-Game-Web`

---

## 🌟 Características Principales

1. **Gráficos Neon Synthwave:**
   * Culebrita con cabeza redondeada, ojos direccionales y degradado de cola en Canvas.
   * Parrilla retro Cyberpunk con efecto scanlines CRT.
   * Sistema de partículas y chispas al comer alimentos o colisionar.
   * Efecto Screen Shake ante choques fatales.

2. **Audio Procedural Nativo (Web Audio API):**
   * Sonidos 100% sintetizados matemáticamente por código (cero dependencias de archivos MP3 externos).
   * Tonos diferenciados para giros, captura de manzana, fanfarria de estrella dorada, congelación y choque game over.
   * Botón de silencio interactivo en el HUD.

3. **Mecánicas de Juego Extendidas:**
   * **Manzana Normal:** +10 puntos y crecimiento.
   * **Estrella Dorada:** +50 puntos con temporizador circular decreciente.
   * **Fresa Criogénica:** Ralentiza temporalmente la velocidad para facilitar maniobras en espacios reducidos.
   * **Selector de Reglas:** Muros mortales sólidos vs. traspasar bordes (pantalla toroidal).
   * **4 Dificultades:** Fácil (120ms), Clásico (85ms), Turbo (60ms) e Insano (40ms).

4. **Controles Duales (Escritorio + Móvil):**
   * Teclado: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> o Flechas direccionales.
   * Pausa: <kbd>Espacio</kbd> • Reinicio: <kbd>R</kbd>.
   * D-Pad táctil virtual para dispositivos táctiles y pantallas pequeñas.

5. **Persistencia y Récords:**
   * Almacenamiento local automático de High Score (`localStorage`).
   * Medallas según desempeño: 🥉 Novato, 🥈 Pro, 🥇 Maestro, 💎 Leyenda.

---

## 🚀 Cómo Jugar

Simplemente abre `index.html` en cualquier navegador moderno.
