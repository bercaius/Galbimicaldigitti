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
let burstParticleGroup = null;
let time = 0;
let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
let isAudioPlaying = false;
let heartPulseBoost = 0;

// Cursor Light Trail Array
let cursorTrail = [];

// Background Stars
let stars = [];

// ======================================================
// 1. BACKGROUND STARS & NEBULA CANVAS WITH CURSOR TRAIL
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
    const count = Math.min(Math.floor((width * height) / 2500), 250);

    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 1.8 + 0.5,
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
    gradient.addColorStop(0, '#1a0526');
    gradient.addColorStop(0.5, '#0a0212');
    gradient.addColorStop(1, '#020005');
    bgCtx.fillStyle = gradient;
    bgCtx.fillRect(0, 0, width, height);

    // Vibrant Glowing Red/Pink Nebula Behind Heart
    const nebula = bgCtx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.45);
    nebula.addColorStop(0, 'rgba(255, 30, 85, 0.35)');
    nebula.addColorStop(0.5, 'rgba(180, 20, 70, 0.18)');
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

    // Subtle Soft Cursor Trail
    for (let i = cursorTrail.length - 1; i >= 0; i--) {
        const pt = cursorTrail[i];
        pt.life -= 0.025;
        if (pt.life <= 0) {
            cursorTrail.splice(i, 1);
            continue;
        }
        bgCtx.fillStyle = '#ff4d79';
        bgCtx.globalAlpha = pt.life * 0.35;
        bgCtx.beginPath();
        bgCtx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
        bgCtx.fill();
    }

    bgCtx.globalAlpha = 1;
}

// ======================================================
// 2. PROCEDURAL TEXTURE GENERATION (Fast & Safe 2D Canvas)
// ======================================================
function createProceduralTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Rich Crimson Ruby Gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#ff1f5a');
    grad.addColorStop(0.5, '#d80036');
    grad.addColorStop(1, '#7a001c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Safe procedural organic texture dots
    for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const radius = Math.random() * 2 + 0.5;
        const opacity = Math.random() * 0.25;
        ctx.fillStyle = `rgba(255, 200, 220, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Organic Velvet Highlights
    for (let j = 0; j < 30; j++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 70 + 20;

        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255, 180, 210, 0.2)');
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

    for (let i = 0; i < 1500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 3 + 1;
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
// 3. THREE.JS REALISTIC 3D HEART & DYNAMIC PARTICLES
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
    if (!threeContainer) return;
    if (typeof THREE === 'undefined') {
        setTimeout(initThree, 100);
        return;
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    threeContainer.innerHTML = '';
    threeContainer.appendChild(renderer.domElement);

    // Multi-Light Setup for rich 3D shading
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
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

    // Textured Metallic/Velvet Shiny Material
    const material = new THREE.MeshPhongMaterial({
        map: colorTex,
        bumpMap: bumpTex,
        bumpScale: 0.6,
        color: 0xff1e53,
        emissive: 0x5a001a,
        specular: 0xffaaaa,
        shininess: 90
    });

    heartMesh = new THREE.Mesh(geometry, material);
    heartMesh.scale.set(0.75, 0.75, 0.75);
    heartMesh.rotation.x = Math.PI; // Flip upright
    scene.add(heartMesh);

    // Glowing Geometric Wireframe Mesh Overlay ("Ağlı" 3D Wireframe)
    const wireMat = new THREE.MeshBasicMaterial({
        color: 0xff66a0,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
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

    // Particle Group for Interactive Tap/Click Sparks
    burstParticleGroup = new THREE.Group();
    scene.add(burstParticleGroup);
}

// Spawns soft 3D floating sparks on click/tap
function triggerClickSparks() {
    if (!burstParticleGroup) return;

    heartPulseBoost = 0.24; // Extra Heart Jump

    const sparkCount = 18;
    for (let i = 0; i < sparkCount; i++) {
        const pMat = new THREE.PointsMaterial({
            size: Math.random() * 3 + 1.5,
            color: new THREE.Color().setHSL(0.95, 0.9, 0.6 + Math.random() * 0.3),
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });

        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));

        const pMesh = new THREE.Points(pGeo, pMat);
        pMesh.userData = {
            vx: (Math.random() - 0.5) * 2.2,
            vy: (Math.random() - 0.5) * 2.2 + 0.8,
            vz: (Math.random() - 0.5) * 2.0,
            life: 1.0
        };

        burstParticleGroup.add(pMesh);
    }
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

    // Decay Heart Pulse Boost
    if (heartPulseBoost > 0) {
        heartPulseBoost *= 0.92;
        if (heartPulseBoost < 0.001) heartPulseBoost = 0;
    }

    // Realistic Organic Pulse Wave (lub-dub heartbeat)
    const beatPhase = (time * 2.8) % (Math.PI * 2);
    let scalePulse = 1;
    if (beatPhase < 0.5) {
        scalePulse = 1 + Math.sin(beatPhase * (Math.PI / 0.5)) * 0.09;
    } else if (beatPhase > 0.7 && beatPhase < 1.2) {
        scalePulse = 1 + Math.sin((beatPhase - 0.7) * (Math.PI / 0.5)) * 0.045;
    }

    scalePulse += heartPulseBoost;

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

    // Update Click Sparks
    if (burstParticleGroup) {
        for (let i = burstParticleGroup.children.length - 1; i >= 0; i--) {
            const spark = burstParticleGroup.children[i];
            spark.position.x += spark.userData.vx;
            spark.position.y += spark.userData.vy;
            spark.position.z += spark.userData.vz;
            spark.userData.life -= 0.02;

            spark.material.opacity = spark.userData.life;

            if (spark.userData.life <= 0) {
                burstParticleGroup.remove(spark);
                spark.geometry.dispose();
                spark.material.dispose();
            }
        }
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
    const btnSound = document.getElementById('btn-sound');
    const soundOnIcon = document.getElementById('sound-on-icon');
    const soundOffIcon = document.getElementById('sound-off-icon');

    if (!bgMusic) return;

    bgMusic.volume = 0.85;

    const updateSoundIcons = (playing) => {
        if (soundOnIcon && soundOffIcon) {
            soundOnIcon.style.display = playing ? 'block' : 'none';
            soundOffIcon.style.display = playing ? 'none' : 'block';
        }
    };

    const tryPlay = () => {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isAudioPlaying = true;
                updateSoundIcons(true);
            }).catch((err) => {
                isAudioPlaying = false;
                updateSoundIcons(false);
            });
        }
    };

    // Log warning if music.mp3 is missing or fails to load
    bgMusic.addEventListener('error', () => {
        console.warn('Müzik bulunamadı (music.mp3)');
        updateSoundIcons(false);
    });

    // Discreet Sound Toggle Button
    if (btnSound) {
        btnSound.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgMusic.paused) {
                tryPlay();
            } else {
                bgMusic.pause();
                isAudioPlaying = false;
                updateSoundIcons(false);
            }
        });
    }

    // Gesture Unlock for browser autoplay policies (First touch/click anywhere)
    const userGesturePlay = () => {
        if (!isAudioPlaying) {
            tryPlay();
        }
        window.removeEventListener('click', userGesturePlay);
        window.removeEventListener('touchstart', userGesturePlay);
    };

    window.addEventListener('click', userGesturePlay, { once: true });
    window.addEventListener('touchstart', userGesturePlay, { once: true });

    // Initial attempt on page load
    tryPlay();
}

// Pointer Events for 3D Tilt & Cursor Particles
function setupPointerEvents() {
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

        // Add point to cursor trail
        cursorTrail.push({
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 4 + 2,
            life: 1.0
        });
        if (cursorTrail.length > 25) cursorTrail.shift();
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.targetX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.targetY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;

            cursorTrail.push({
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                size: Math.random() * 4 + 2,
                life: 1.0
            });
            if (cursorTrail.length > 25) cursorTrail.shift();
        }
    }, { passive: true });

    // Click/Tap on Heart
    window.addEventListener('click', (e) => {
        // Ignore clicks on sound button
        if (e.target.closest('#btn-sound')) return;
        triggerClickSparks();
    });

    window.addEventListener('touchstart', (e) => {
        if (e.target.closest('#btn-sound')) return;
        triggerClickSparks();
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
