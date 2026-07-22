// ======================================================
// DOKULU 3D KALP & TEMİZ EKRAN (Three.js + music.mp3)
// ======================================================

// DOM ELEMENTS
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
const threeContainer = document.getElementById('three-container');

// Three.js Globals
let scene, camera, renderer;
let heartMesh, wireframeMesh, dustParticles;
let time = 0;
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let isAudioPlaying = false;

// Background Stars
let stars = [];

// ======================================================
// 1. BACKGROUND STARS & NEBULA CANVAS
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
    const count = Math.min(Math.floor((width * height) / 3000), 220);

    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.6 + 0.4,
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

    // Nebula Glow Behind Heart
    const nebula = bgCtx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.4);
    nebula.addColorStop(0, 'rgba(255, 30, 80, 0.28)');
    nebula.addColorStop(0.5, 'rgba(180, 20, 60, 0.12)');
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
// 2. PROCEDURAL TEXTURE GENERATION (3D Surface Texture)
// ======================================================
function createProceduralTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Crimson Velvet Background
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#ff1a53');
    grad.addColorStop(0.5, '#d60b3b');
    grad.addColorStop(1, '#8f0022');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Add Procedural Organic Grain / Noise Texture
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 28;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.3)); // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.4)); // B
    }
    ctx.putImageData(imgData, 0, 0);

    // Subtle Radial Surface Highlights
    for (let j = 0; j < 40; j++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 60 + 20;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255, 180, 200, 0.15)');
        g.addColorStop(1, 'transparent');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    return texture;
}

function createBumpMapTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // High detail bump map pattern
    for (let i = 0; i < 1200; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 4 + 1;
        const val = Math.floor(Math.random() * 255);

        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    const bumpTex = new THREE.CanvasTexture(canvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(3, 3);
    return bumpTex;
}

// ======================================================
// 3. THREE.JS REALISTIC 3D HEART
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
    camera.position.z = 210;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    threeContainer.innerHTML = '';
    threeContainer.appendChild(renderer.domElement);

    // Multi-Light Setup for rich 3D shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xff5588, 3, 350);
    mainLight.position.set(60, 60, 120);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0xff2255, 2.5, 300);
    rimLight.position.set(-70, -50, 80);
    scene.add(rimLight);

    const backKeyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    backKeyLight.position.set(0, 50, -100);
    scene.add(backKeyLight);

    // 3D Extruded Heart Geometry
    const shape = createHeartShape();
    const extrudeSettings = {
        depth: 26,
        bevelEnabled: true,
        bevelSegments: 12,
        steps: 3,
        bevelSize: 8,
        bevelThickness: 8
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    // Procedural Textures
    const colorTex = createProceduralTexture();
    const bumpTex = createBumpMapTexture();

    // Textured Metallic/Velvet Material
    const material = new THREE.MeshStandardMaterial({
        map: colorTex,
        bumpMap: bumpTex,
        bumpScale: 0.8,
        roughness: 0.35,
        metalness: 0.25,
        emissive: 0x4a0015,
        emissiveIntensity: 0.4
    });

    heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.scale.set(0.75, 0.75, 0.75);
    heartMesh.rotation.x = Math.PI; // Flip upright
    scene.add(heartMesh);

    // Glowing Geometric Wireframe Mesh Overlay ("Ağlı" 3D Mesh)
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0xff66a0,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
    });
    wireframeMesh = new THREE.Mesh(geometry, wireMat);
    wireframeMesh.scale.set(0.755, 0.755, 0.755);
    wireframeMesh.rotation.x = Math.PI;
    scene.add(wireframeMesh);

    // Soft Ambient Particle Dust around Heart
    const dustGeo = new THREE.BufferGeometry();
    const dustCount = 120;
    const posArray = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount * 3; i += 3) {
        posArray[i] = (Math.random() - 0.5) * 200;
        posArray[i + 1] = (Math.random() - 0.5) * 200;
        posArray[i + 2] = (Math.random() - 0.5) * 150;
    }

    dustGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const dustMat = new THREE.PointsMaterial({
        size: 2.2,
        color: 0xff6688,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    dustParticles = new THREE.Points(dustGeo, dustMat);
    scene.add(dustParticles);
}

// ======================================================
// 4. ANIMATION LOOP
// ======================================================
function renderThree() {
    if (!renderer || !scene || !camera) return;

    time += 0.016;

    // Smooth Mouse Interactivity
    mouse.x += (mouse.targetX - mouse.x) * 0.05;
    mouse.y += (mouse.targetY - mouse.y) * 0.05;

    // Realistic Organic Pulse Wave (lub-dub heartbeat)
    const beatPhase = (time * 2.8) % (Math.PI * 2);
    let scalePulse = 1;
    if (beatPhase < 0.5) {
        scalePulse = 1 + Math.sin(beatPhase * (Math.PI / 0.5)) * 0.09;
    } else if (beatPhase > 0.7 && beatPhase < 1.2) {
        scalePulse = 1 + Math.sin((beatPhase - 0.7) * (Math.PI / 0.5)) * 0.045;
    }

    const baseScale = (window.innerWidth < 600) ? 0.62 : 0.8;

    if (heartMesh) {
        heartMesh.scale.set(baseScale * scalePulse, baseScale * scalePulse, baseScale * scalePulse);
        heartMesh.rotation.y = Math.sin(time * 0.7) * 0.22 + mouse.x * 0.35;
        heartMesh.rotation.z = Math.cos(time * 0.5) * 0.06 + mouse.y * 0.18;
    }

    if (wireframeMesh) {
        const wireScale = baseScale * scalePulse * 1.008;
        wireframeMesh.scale.set(wireScale, wireScale, wireScale);
        wireframeMesh.rotation.y = heartMesh.rotation.y;
        wireframeMesh.rotation.z = heartMesh.rotation.z;
    }

    if (dustParticles) {
        dustParticles.rotation.y = time * 0.05;
        dustParticles.rotation.x = time * 0.02;
    }

    renderer.render(scene, camera);
}

function animate() {
    renderBgCanvas();
    renderThree();
    requestAnimationFrame(animate);
}

// ======================================================
// 5. AUTOMATIC AUDIO PLAYBACK (music.mp3)
// ======================================================
function setupAudio() {
    const bgMusic = document.getElementById('bg-music');
    if (!bgMusic) return;

    bgMusic.volume = 0.85;

    const tryPlay = () => {
        bgMusic.play().then(() => {
            isAudioPlaying = true;
        }).catch(() => {
            isAudioPlaying = false;
        });
    };

    // User gesture handler to enable sound if browser restricts unmuted autoplay
    const userGesturePlay = () => {
        if (!isAudioPlaying) {
            tryPlay();
        }
        window.removeEventListener('click', userGesturePlay);
        window.removeEventListener('touchstart', userGesturePlay);
    };

    window.addEventListener('click', userGesturePlay, { once: true });
    window.addEventListener('touchstart', userGesturePlay, { once: true });

    // Initial load try
    tryPlay();
}

// Pointer Events for 3D Tilt
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

// Resize Handler
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
// 6. INITIALIZATION
// ======================================================
function init() {
    initBgCanvas();
    initThree();
    setupAudio();
    setupPointerEvents();

    window.addEventListener('resize', onWindowResize);

    animate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


