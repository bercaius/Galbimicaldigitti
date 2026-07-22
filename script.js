// ======================================================
// SANA ÖZEL ❤️ (3D Heart & Minimal UI)
// ======================================================

// STATE
const AppState = {
    title: localStorage.getItem('so_title') || "dupdup",
    subtitle: localStorage.getItem('so_subtitle') || "nasil olmus ha",
    orbitText: localStorage.getItem('so_orbit_text') || "nasil olmus",
    isPlaying: false
};

// DOM ELEMENTS
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
const threeContainer = document.getElementById('three-container');

// Three.js Globals
let scene, camera, renderer;
let heartMesh, glowMesh, textGroup;
let time = 0;
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

// Background Stars
let stars = [];

// ======================================================
// 1. BACKGROUND STARS CANVAS
// ======================================================
function initBgCanvas() {
    if (!bgCanvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    bgCanvas.width = width * dpr;
    bgCanvas.height = height * dpr;
    bgCanvas.style.width = `${width}px`;
    bgCanvas.style.height = `${height}px`;
    if (bgCtx) bgCtx.scale(dpr, dpr);

    stars = [];
    const count = Math.min(Math.floor((width * height) / 3500), 200);

    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random(),
            speed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function renderBgCanvas() {
    if (!bgCtx) return;
    const width = window.innerWidth;
    const height = window.innerHeight;

    bgCtx.clearRect(0, 0, width, height);

    // Deep cosmic space gradient
    const gradient = bgCtx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height));
    gradient.addColorStop(0, '#0d041a');
    gradient.addColorStop(0.6, '#04010a');
    gradient.addColorStop(1, '#000003');
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, width, height);

    // Nebula Glow
    const nebula = bgCtx.createRadialGradient(width / 2, height * 0.45, 0, width / 2, height * 0.45, width * 0.35);
    nebula.addColorStop(0, 'rgba(255, 42, 95, 0.25)');
    nebula.addColorStop(1, 'transparent');
    bgCtx.fillStyle = nebula;
    bgCtx.globalCompositeOperation = 'screen';
    bgCtx.fillRect(0, 0, width, height);
    bgCtx.globalCompositeOperation = 'source-over';

    // Stars
    stars.forEach(s => {
        s.phase += s.speed;
        const a = Math.abs(Math.sin(s.phase)) * 0.7 + 0.3;
        bgCtx.fillStyle = '#ffffff';
        bgCtx.globalAlpha = a;
        bgCtx.beginPath();
        bgCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        bgCtx.fill();
    });
    bgCtx.globalAlpha = 1;
}

// ======================================================
// 2. THREE.JS 3D HEART & ORBITING TEXT
// ======================================================
function createHeartShape() {
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();

    heartShape.moveTo(x + 25, y + 25);
    heartShape.bezierCurveTo(x + 25, y + 25, x + 20, y, x, y);
    heartShape.bezierCurveTo(x - 30, y, x - 30, y + 35, x - 30, y + 35);
    heartShape.bezierCurveTo(x - 30, y + 55, x - 10, y + 77, x + 25, y + 95);
    heartShape.bezierCurveTo(x + 60, y + 77, x + 80, y + 55, x + 80, y + 35);
    heartShape.bezierCurveTo(x + 80, y + 35, x + 80, y, x + 50, y);
    heartShape.bezierCurveTo(x + 35, y, x + 25, y + 25, x + 25, y + 25);

    return heartShape;
}

function initThree() {
    if (!threeContainer || typeof THREE === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 220;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeContainer.innerHTML = '';
    threeContainer.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xff2a5f, 2.5, 300);
    pointLight1.position.set(50, 50, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff758c, 1.8, 300);
    pointLight2.position.set(-50, -50, 50);
    scene.add(pointLight2);

    const backLight = new THREE.DirectionalLight(0xffffff, 1);
    backLight.position.set(0, 0, -100);
    scene.add(backLight);

    // 3D Heart Geometry
    const shape = createHeartShape();
    const extrudeSettings = {
        depth: 22,
        bevelEnabled: true,
        bevelSegments: 8,
        steps: 2,
        bevelSize: 6,
        bevelThickness: 6
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Material - Shiny 3D Crimson Ruby
    const material = new THREE.MeshPhongMaterial({
        color: 0xff1447,
        emissive: 0x4a0014,
        specular: 0xffaaaa,
        shininess: 90,
        flatShading: false
    });

    heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.scale.set(0.7, 0.7, 0.7);
    heartMesh.rotation.x = Math.PI; // Flip upright
    scene.add(heartMesh);

    // Outer Glowing Outline Mesh
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0xff6688,
        wireframe: true,
        transparent: true,
        opacity: 0.12
    });
    glowMesh = new THREE.Mesh(geometry, wireMat);
    glowMesh.scale.set(0.74, 0.74, 0.74);
    glowMesh.rotation.x = Math.PI;
    scene.add(glowMesh);

    // Create Orbiting Text Sprites
    textGroup = new THREE.Group();
    scene.add(textGroup);

    rebuildOrbitText();
}

// Create Canvas Text Textures as Sprites around the 3D Heart Arms
function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 70;

    ctx.font = 'Bold 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff2a5f';
    ctx.shadowBlur = 12;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 150, 35);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(38, 9, 1);
    return sprite;
}

function rebuildOrbitText() {
    if (!textGroup) return;

    // Clear existing
    while (textGroup.children.length > 0) {
        textGroup.remove(textGroup.children[0]);
    }

    const textToUse = AppState.orbitText || "nasil olmus";
    const count = 5;
    const radius = 62;

    for (let i = 0; i < count; i++) {
        const sprite = createTextSprite(textToUse);
        const angle = (Math.PI * 2 / count) * i;

        sprite.userData = {
            angle: angle,
            radius: radius,
            speed: 0.008,
            yOffset: Math.sin(i * 1.5) * 8
        };

        textGroup.add(sprite);
    }
}

// ======================================================
// 3. THREE.JS ANIMATION LOOP
// ======================================================
function renderThree() {
    if (!renderer || !scene || !camera) return;

    time += 0.016;

    // Smooth Mouse Interactivity Tilt
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Beating Heart Effect (lub-dub pulse)
    const beatPhase = (time * 2.8) % (Math.PI * 2);
    let scalePulse = 1;
    if (beatPhase < 0.5) {
        scalePulse = 1 + Math.sin(beatPhase * (Math.PI / 0.5)) * 0.08;
    } else if (beatPhase > 0.7 && beatPhase < 1.2) {
        scalePulse = 1 + Math.sin((beatPhase - 0.7) * (Math.PI / 0.5)) * 0.04;
    }

    const baseScale = (window.innerWidth < 600) ? 0.55 : 0.72;

    if (heartMesh) {
        heartMesh.scale.set(baseScale * scalePulse, baseScale * scalePulse, baseScale * scalePulse);
        heartMesh.rotation.y = Math.sin(time * 0.8) * 0.25 + mouse.x * 0.3;
        heartMesh.rotation.z = Math.cos(time * 0.6) * 0.08 + mouse.y * 0.15;
    }

    if (glowMesh) {
        glowMesh.scale.set(baseScale * scalePulse * 1.05, baseScale * scalePulse * 1.05, baseScale * scalePulse * 1.05);
        glowMesh.rotation.y = heartMesh.rotation.y;
        glowMesh.rotation.z = heartMesh.rotation.z;
    }

    // Orbiting Text Motion
    if (textGroup) {
        textGroup.children.forEach((sprite) => {
            sprite.userData.angle += sprite.userData.speed;
            const a = sprite.userData.angle;

            sprite.position.x = Math.cos(a) * sprite.userData.radius;
            sprite.position.z = Math.sin(a) * sprite.userData.radius;
            sprite.position.y = Math.sin(a * 2 + time) * 10 + sprite.userData.yOffset;
        });

        textGroup.rotation.y = mouse.x * 0.2;
    }

    renderer.render(scene, camera);
}

// ======================================================
// 4. MAIN ANIMATION LOOP
// ======================================================
function animate() {
    renderBgCanvas();
    renderThree();
    requestAnimationFrame(animate);
}

// ======================================================
// 5. AUDIO PLAYER (AUTOMATIC PLAYBACK & CONTROLS)
// ======================================================
function setupAudioPlayer() {
    const bgMusic = document.getElementById('bg-music');
    const playBtn = document.getElementById('btn-toggle-play');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const equalizer = document.getElementById('equalizer');

    if (!bgMusic) return;

    bgMusic.volume = 0.8;

    const playAudio = () => {
        bgMusic.play().then(() => {
            AppState.isPlaying = true;
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            equalizer.classList.add('playing');
        }).catch(() => {
            AppState.isPlaying = false;
        });
    };

    const pauseAudio = () => {
        bgMusic.pause();
        AppState.isPlaying = false;
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        equalizer.classList.remove('playing');
    };

    playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (AppState.isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    // Auto Play on first touch / click anywhere on the screen
    const autoPlayTrigger = () => {
        if (!AppState.isPlaying) {
            playAudio();
        }
        window.removeEventListener('click', autoPlayTrigger);
        window.removeEventListener('touchstart', autoPlayTrigger);
    };

    window.addEventListener('click', autoPlayTrigger, { once: true });
    window.addEventListener('touchstart', autoPlayTrigger, { once: true });

    // Try auto-play immediately on load
    playAudio();
}

// ======================================================
// 6. UI MODAL & SETTINGS
// ======================================================
function setupUI() {
    const modal = document.getElementById('settings-modal');
    const btnOpen = document.getElementById('btn-open-settings');
    const btnClose = document.getElementById('btn-close-settings');
    const btnSave = document.getElementById('btn-save-settings');

    const inputTitle = document.getElementById('input-title');
    const inputSubtitle = document.getElementById('input-subtitle');
    const inputOrbitText = document.getElementById('input-orbit-text');

    const mainTitle = document.getElementById('main-title');
    const mainSubtitle = document.getElementById('main-subtitle');

    // Update UI from initial state
    mainTitle.textContent = AppState.title;
    mainSubtitle.textContent = AppState.subtitle;
    document.title = `${AppState.title} ❤️`;

    btnOpen.addEventListener('click', () => {
        inputTitle.value = AppState.title;
        inputSubtitle.value = AppState.subtitle;
        inputOrbitText.value = AppState.orbitText;
        modal.style.display = 'flex';
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    btnSave.addEventListener('click', () => {
        AppState.title = inputTitle.value.trim() || "dupdup";
        AppState.subtitle = inputSubtitle.value.trim() || "nasil olmus ha";
        AppState.orbitText = inputOrbitText.value.trim() || "nasil olmus";

        localStorage.setItem('so_title', AppState.title);
        localStorage.setItem('so_subtitle', AppState.subtitle);
        localStorage.setItem('so_orbit_text', AppState.orbitText);

        mainTitle.textContent = AppState.title;
        mainSubtitle.textContent = AppState.subtitle;
        document.title = `${AppState.title} ❤️`;

        rebuildOrbitText();
        modal.style.display = 'none';
    });
}

// Pointer movement for 3D tilt
function setupPointerEvents() {
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });
}

// Window resize handler
function onWindowResize() {
    initBgCanvas();

    if (camera && renderer) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    }
}

// ======================================================
// 7. INITIALIZATION
// ======================================================
function init() {
    initBgCanvas();
    initThree();
    setupAudioPlayer();
    setupUI();
    setupPointerEvents();

    window.addEventListener('resize', onWindowResize);

    animate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

