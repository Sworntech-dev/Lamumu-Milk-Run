// DOM elemanlarını seçme
const overlay = document.getElementById("overlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreBoard = document.getElementById("scoreBoard");
const restartButton = document.getElementById("restartButton");
const finalScoreText = document.getElementById("finalScoreText");

// Shield sayaç için element
const shieldTimerUI = document.createElement("div");
shieldTimerUI.style.position = "absolute";
shieldTimerUI.style.bottom = "20px";
shieldTimerUI.style.right = "20px";
shieldTimerUI.style.width = "60px";
shieldTimerUI.style.height = "60px";
shieldTimerUI.style.borderRadius = "50%";
shieldTimerUI.style.background = "rgba(0, 150, 255, 0.7)";
shieldTimerUI.style.color = "white";
shieldTimerUI.style.display = "flex";
shieldTimerUI.style.alignItems = "center";
shieldTimerUI.style.justifyContent = "center";
shieldTimerUI.style.fontWeight = "bold";
shieldTimerUI.style.fontSize = "20px";
shieldTimerUI.style.display = "none";
document.body.appendChild(shieldTimerUI);

// Oyun değişkenleri
let scene, camera, renderer;
let player = null;
let mixer;
let animations = [];
let clock = new THREE.Clock();
let gameStarted = false;
let gameOver = false;
let score = 0;

// Şerit pozisyonları
const lanes = [-3, 0, 3];
let currentLane = 1;

// Nesneleri tutacak diziler
const obstacles = [];
const milkCartons = [];
const powerUps = [];

// Billboard/panel galerisi dizileri
const galleryPanelsLeft = [];
const galleryPanelsRight = [];
const billboardTextures = [];
let billboardTexturesLoaded = false;
const GALLERY_SPACING = 30;
const GALLERY_COUNT_PER_SIDE = 12;
const GALLERY_X_OFFSET = 12;
const GALLERY_SIZE = { w: 8, h: 6 };

// Spawn interval
let spawnIntervalMs = 1000;

// 3D modeller
let milkCartonModel;
let shieldModel;
let obstacleModels = [];

// Shield state
let shieldActive = false;
let shieldTimeout = null;
let shieldTimerInterval = null;
let shieldTimeLeft = 0;

// Lane çizgileri
let laneLines = [];
const lineDashLength = 5;
const lineGap = 5;
const totalLineLength = 100;

// Ses dosyaları
const backgroundMusic = new Audio("sounds/background.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const collectSound = new Audio("sounds/collect.mp3");
const hitSound = new Audio("sounds/hit.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");

// Zorluk seviyeleri
let minSpeed = 2;
let maxSpeed = 4;

// Klavye Kontrolleri
window.addEventListener('keydown', (event) => {
  if (!gameStarted || gameOver) return;
  if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') {
    if (currentLane > 0) currentLane--;
  } else if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') {
    if (currentLane < lanes.length - 1) currentLane++;
  }
});

// window resize fix
window.addEventListener("resize", () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- INIT ---
let ground, groundTexture;
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 7);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const texLoader = new THREE.TextureLoader();
  groundTexture = texLoader.load("grass.jpg");
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(4, 1); // sadece x tekrar, z sabit

  const groundMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
  ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 1000), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  preloadBillboardTextures();
  loadModels();
}

// --- Lane çizgileri ---
function createDashedLaneLines() {
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const lineDashGeometry = new THREE.BoxGeometry(0.1, 0.1, lineDashLength);
  const totalSegmentLength = lineDashLength + lineGap;
  const numberOfDashes = Math.ceil(totalLineLength / totalSegmentLength);

  for (let i = 0; i < numberOfDashes; i++) {
    const zPosition = -i * totalSegmentLength;

    const line1 = new THREE.Mesh(lineDashGeometry, lineMaterial);
    line1.position.set(-1.5, 0.05, zPosition);
    scene.add(line1);
    laneLines.push(line1);

    const line2 = new THREE.Mesh(lineDashGeometry, lineMaterial);
    line2.position.set(1.5, 0.05, zPosition);
    scene.add(line2);
    laneLines.push(line2);
  }
}

// --- MODEL LOAD ---
function loadModels() {
  const loader = new THREE.GLTFLoader();
  const modelsToLoad = [
    { name: 'cow', path: 'dancing_cow.glb' },
    { name: 'milkCarton', path: 'lowpoly_painted_milk_carton_-_realisticlow_poly.glb' },
    { name: 'shield', path: 'shield.glb' },
    { name: 'windmill', path: 'handpainted_windmill_tower.glb' },
    { name: 'scarecrow', path: 'scarecrow_for_farm.glb' },
    { name: 'hay_bales', path: 'hay_bales.glb' }
  ];

  let loadedCount = 0;

  modelsToLoad.forEach(model => {
    loader.load(
      model.path,
      (gltf) => {
        if (model.name === 'cow') {
          player = gltf.scene;
          player.position.set(lanes[currentLane], 0, 0);
          player.rotation.y = Math.PI;
          player.scale.set(1, 1, 1);
          scene.add(player);
          animations = gltf.animations;
          if (animations && animations.length) mixer = new THREE.AnimationMixer(player);
        } else if (model.name === 'milkCarton') {
          milkCartonModel = gltf.scene;
        } else if (model.name === 'shield') {
          shieldModel = gltf.scene;
        } else {
          obstacleModels.push(gltf.scene);
        }

        loadedCount++;
        if (loadedCount === modelsToLoad.length) animate();
      },
      undefined,
      (error) => console.error(`Yükleme hatası: ${model.path}`, error)
    );
  });
}

// --- BILLBOARD PRELOAD ---
function preloadBillboardTextures() {
  const texLoader = new THREE.TextureLoader();
  let loaded = 0;
  for (let i = 1; i <= 10; i++) {
    texLoader.load(
      `${i}.jpg`,
      (tex) => {
        billboardTextures.push(tex);
        loaded++;
        if (loaded === 10) setupGallery();
      },
      undefined,
      () => {
        const canvas = document.createElement('canvas');
        canvas.width = 4; canvas.height = 4;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#888"; ctx.fillRect(0,0,4,4);
        billboardTextures.push(new THREE.CanvasTexture(canvas));
        loaded++;
        if (loaded === 10) setupGallery();
      }
    );
  }
}

// --- GALLERY SETUP ---
function setupGallery() {
  for (let i = 0; i < GALLERY_COUNT_PER_SIDE; i++) {
    const z = -i * GALLERY_SPACING;
    galleryPanelsLeft.push(createPanel(-GALLERY_X_OFFSET, z, Math.PI / 2));
    galleryPanelsRight.push(createPanel(GALLERY_X_OFFSET, z, -Math.PI / 2));
  }
}

function createPanel(x, z, rotY) {
  const geom = new THREE.PlaneGeometry(GALLERY_SIZE.w, GALLERY_SIZE.h);
  const tex = billboardTextures[Math.floor(Math.random() * billboardTextures.length)];
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(x, GALLERY_SIZE.h / 2, z);
  mesh.rotation.y = rotY;
  scene.add(mesh);
  return mesh;
}

// --- SPAWN ---
function createObstacle() {
  if (obstacleModels.length === 0) return;
  const randomModel = obstacleModels[Math.floor(Math.random() * obstacleModels.length)];
  const laneIndex = Math.floor(Math.random() * lanes.length);

  const obstacle = randomModel.clone();
  const bbox = new THREE.Box3().setFromObject(obstacle);
  const offsetY = -bbox.min.y;
  obstacle.position.set(lanes[laneIndex], offsetY, player.position.z - 50); // player önünde spawn
  obstacle.rotation.y = Math.PI * 1.5;
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function createMilkCarton(big = false) {
  if (!milkCartonModel) return;
  const milkCarton = milkCartonModel.clone();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  milkCarton.position.set(lanes[laneIndex], 0.5, player.position.z - 50); // player önünde spawn
  milkCarton.scale.set(big ? 1 : 0.5, big ? 1 : 0.5, big ? 1 : 0.5);
  milkCarton.userData.type = big ? "bigMilk" : "milk";
  scene.add(milkCarton);
  milkCartons.push(milkCarton);
}

function createShield() {
  if (!shieldModel || shieldActive) return;
  const shield = shieldModel.clone();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  shield.position.set(lanes[laneIndex], 0.5, player.position.z - 50); // player önünde spawn
  shield.scale.set(0.7, 0.7, 0.7);
  shield.userData.type = "shield";
  scene.add(shield);
  powerUps.push(shield);
}

function spawnObjects() {
  const rand = Math.random();
  if (rand < 0.05 && !shieldActive) createShield();
  else if (rand < 0.1) createMilkCarton(true);
  else if (rand < 0.4) createMilkCarton(false);
  else createObstacle();
}

// --- START GAME ---
document.querySelectorAll(".difficulty-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const diff = btn.dataset.difficulty;
    if (diff === "easy") { minSpeed = 2; maxSpeed = 4; }
    else if (diff === "medium") { minSpeed = 4; maxSpeed = 6; }
    else if (diff === "hard") { minSpeed = 6; maxSpeed = 8; }

    overlay.style.display = "none";

    if (animations && animations.length) {
      const danceClip = animations.find(c => c.name === 'dance');
      if (danceClip) {
        const action = mixer.clipAction(danceClip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();

        action.onFinished = () => {
          createDashedLaneLines();
          startGame();
        };

        setTimeout(() => {
          if (!gameStarted) {
            createDashedLaneLines();
            startGame();
          }
        }, 2000);
      } else {
        createDashedLaneLines();
        startGame();
      }
    } else {
      createDashedLaneLines();
      startGame();
    }
  });
});

restartButton.addEventListener("click", () => location.reload());

function startGame() {
  if (animations && animations.length) {
    const walkClip = animations.find(c => c.name === 'walk_proud');
    if (walkClip) {
      mixer.stopAllAction();
      const action = mixer.clipAction(walkClip);
      action.setLoop(THREE.LoopRepeat);
      action.play();
      mixer.timeScale = minSpeed;
    }
  }

  score = 0;
  gameStarted = true;
  gameOver = false;
  scoreBoard.innerText = `Score: ${score}`;
  spawnObjects();
  setInterval(spawnObjects, spawnIntervalMs);
  backgroundMusic.currentTime = 0;
  backgroundMusic.play();
}

// --- END GAME ---
function endGame() {
  gameOver = true;
  gameStarted = false;
  if (mixer) mixer.stopAllAction();
  finalScoreText.innerText = `Final Score: ${score}`;
  gameOverOverlay.style.display = "flex";
  backgroundMusic.pause();
  gameOverSound.currentTime = 0;
  gameOverSound.play();
}

// --- SHIELD ---
function activateShield() {
  shieldActive = true;
  shieldTimeLeft = 10;
  shieldTimerUI.style.display = "flex";
  shieldTimerUI.innerText = shieldTimeLeft;
  clearTimeout(shieldTimeout); clearInterval(shieldTimerInterval);
  shieldTimeout = setTimeout(() => deactivateShield(), 10000);
  shieldTimerInterval = setInterval(() => {
    shieldTimeLeft--;
    shieldTimerUI.innerText = shieldTimeLeft;
    if (shieldTimeLeft <= 0) clearInterval(shieldTimerInterval);
  }, 1000);
}

function deactivateShield() {
  shieldActive = false;
  shieldTimerUI.style.display = "none";
  clearTimeout(shieldTimeout);
  clearInterval(shieldTimerInterval);
}

// --- ANIMATE ---
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (mixer) {
    if (gameStarted) {
      mixer.timeScale += delta * 0.05;
      if (mixer.timeScale > maxSpeed) mixer.timeScale = maxSpeed;
    }
    mixer.update(delta);
  }

  if (player && gameStarted && !gameOver) {
    // Lane geçiş
    const targetX = lanes[currentLane];
    player.position.x += (targetX - player.position.x) * 0.1;

    const speed = mixer ? mixer.timeScale * 0.1 : minSpeed * 0.1;

    // Kamera/player ilerliyor hissi
    camera.position.z = player.position.z + 7;
    camera.lookAt(player.position);

    player.position.z -= speed; // ileri hareket

    // Lane çizgileri
    laneLines.forEach(line => {
      line.position.z -= speed;
      if (line.position.z < player.position.z - 50) line.position.z += (lineDashLength + lineGap) * (laneLines.length / 2);
    });

    // Gallery paneller
    galleryPanelsLeft.forEach(p => {
      p.position.z -= speed;
      if (p.position.z < player.position.z - 50) p.position.z += GALLERY_COUNT_PER_SIDE * GALLERY_SPACING;
    });
    galleryPanelsRight.forEach(p => {
      p.position.z -= speed;
      if (p.position.z < player.position.z - 50) p.position.z += GALLERY_COUNT_PER_SIDE * GALLERY_SPACING;
    });

    // Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      obstacle.position.z -= speed;
      if (obstacle.position.z > player.position.z + 5) { scene.remove(obstacle); obstacles.splice(i, 1); }
      if (Math.abs(player.position.x - obstacle.position.x) < 1 &&
          Math.abs(player.position.z - obstacle.position.z) < 1.5) {
        hitSound.currentTime = 0; hitSound.play();
        if (shieldActive) { deactivateShield(); scene.remove(obstacle); obstacles.splice(i, 1); }
        else { endGame(); }
      }
    }

    // MilkCartons
    for (let i = milkCartons.length - 1; i >= 0; i--) {
      const milkCarton = milkCartons[i];
      milkCarton.position.z -= speed;
      if (milkCarton.position.z > player.position.z + 5) { scene.remove(milkCarton); milkCartons.splice(i, 1); }
      if (Math.abs(player.position.x - milkCarton.position.x) < 1 &&
          Math.abs(player.position.z - milkCarton.position.z) < 1) {
        score += milkCarton.userData.type === "bigMilk" ? 200 : 10;
        scoreBoard.innerText = `Score: ${score}`;
        scene.remove(milkCarton); milkCartons.splice(i, 1);
        collectSound.currentTime = 0; collectSound.play();
      }
    }

    // PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i];
      powerUp.position.z -= speed;
      if (powerUp.position.z > player.position.z + 5) { scene.remove(powerUp); powerUps.splice(i, 1); }
      if (Math.abs(player.position.x - powerUp.position.x) < 1 &&
          Math.abs(player.position.z - powerUp.position.z) < 1) {
        if (powerUp.userData.type === "shield") activateShield();
        scene.remove(powerUp); powerUps.splice(i, 1);
        collectSound.currentTime = 0; collectSound.play();
      }
    }
  }

  renderer.render(scene, camera);
}

init();
