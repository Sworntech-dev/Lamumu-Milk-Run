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
let animations;
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

// Çizgiler için global değişkenler
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

// window resize bug fix
window.addEventListener("resize", () => {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

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

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 1000),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  loadModels();
}

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

// Zorluk seçimi ve oyun başlatma
document.querySelectorAll(".difficulty-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const difficulty = btn.dataset.difficulty;
    if (difficulty === "easy") { minSpeed = 2; maxSpeed = 4; }
    else if (difficulty === "medium") { minSpeed = 4; maxSpeed = 6; }
    else if (difficulty === "hard") { minSpeed = 6; maxSpeed = 8; }

    overlay.style.display = "none";

    const danceClip = animations.find(clip => clip.name === 'dance');
    if (danceClip) {
      const action = mixer.clipAction(danceClip);
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();
    }

    setTimeout(() => {
      createDashedLaneLines();
      startGame();
    }, 4000);
  });
});

restartButton.addEventListener("click", () => location.reload());

function createObstacle() {
  if (obstacleModels.length === 0) return;
  const randomModel = obstacleModels[Math.floor(Math.random() * obstacleModels.length)];
  const laneIndex = Math.floor(Math.random() * lanes.length);

  const obstacle = randomModel.clone();
  const bbox = new THREE.Box3().setFromObject(obstacle);
  const offsetY = -bbox.min.y;
  obstacle.position.set(lanes[laneIndex], offsetY, -50);
  obstacle.rotation.y = Math.PI * 1.5;

  if (randomModel.name === "hay_bales") obstacle.scale.set(1.5, 1.5, 1.5);

  scene.add(obstacle);
  obstacles.push(obstacle);
}

function createMilkCarton(big = false) {
  if (!milkCartonModel) return;
  const milkCarton = milkCartonModel.clone();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  milkCarton.position.set(lanes[laneIndex], 0.5, -50);
  if (big) {
    milkCarton.scale.set(1.0, 1.0, 1.0);
    milkCarton.userData.type = "bigMilk";
  } else {
    milkCarton.scale.set(0.5, 0.5, 0.5);
    milkCarton.userData.type = "milk";
  }
  scene.add(milkCarton);
  milkCartons.push(milkCarton);
}

function createShield() {
  if (!shieldModel || shieldActive) return;
  const shield = shieldModel.clone();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  shield.position.set(lanes[laneIndex], 0.5, -50);
  shield.scale.set(0.7, 0.7, 0.7);
  shield.userData.type = "shield";
  scene.add(shield);
  powerUps.push(shield);
}

function spawnObjects() {
  const rand = Math.random();
  if (rand < 0.05 && !shieldActive) {
    createShield();
  } else if (rand < 0.1) {
    createMilkCarton(true); // big milk
  } else if (rand < 0.4) {
    createMilkCarton(false);
  } else {
    createObstacle();
  }
}

function startGame() {
  if (!animations) return;
  const walkProudClip = animations.find(clip => clip.name === 'walk_proud');
  if (walkProudClip) {
    mixer.stopAllAction();
    const action = mixer.clipAction(walkProudClip);
    action.setLoop(THREE.LoopRepeat);
    action.play();
    mixer.timeScale = minSpeed;
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

function endGame() {
  gameOver = true;
  gameStarted = false;
  mixer.stopAllAction();
  finalScoreText.innerText = `Final Score: ${score}`;
  gameOverOverlay.style.display = "flex";

  backgroundMusic.pause();
  gameOverSound.currentTime = 0;
  gameOverSound.play();
}

function activateShield() {
  shieldActive = true;
  shieldTimeLeft = 10;
  shieldTimerUI.style.display = "flex";
  shieldTimerUI.innerText = shieldTimeLeft;

  shieldTimeout = setTimeout(() => deactivateShield(), 10000);
  shieldTimerInterval = setInterval(() => {
    shieldTimeLeft--;
    if (shieldTimeLeft <= 0) {
      clearInterval(shieldTimerInterval);
    }
    shieldTimerUI.innerText = shieldTimeLeft;
  }, 1000);
}

function deactivateShield() {
  shieldActive = false;
  shieldTimerUI.style.display = "none";
  clearTimeout(shieldTimeout);
  clearInterval(shieldTimerInterval);
}

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

  if (player && !gameOver) {
    const targetX = lanes[currentLane];
    player.position.x += (targetX - player.position.x) * 0.1;

    const speed = mixer.timeScale * 0.1;
    const totalSegmentLength = lineDashLength + lineGap;

    laneLines.forEach(line => {
      line.position.z += speed;
      if (line.position.z > player.position.z + 5) line.position.z -= totalSegmentLength * (laneLines.length / 2);
    });
  }

  renderer.render(scene, camera);

  if (!gameStarted || gameOver) return;

  // Obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.position.z += mixer.timeScale * 0.1;
    if (obstacle.position.z > 5) { scene.remove(obstacle); obstacles.splice(i, 1); }
    if (Math.abs(player.position.x - obstacle.position.x) < 1 &&
        Math.abs(player.position.z - obstacle.position.z) < 1.5) {
      hitSound.currentTime = 0; hitSound.play();
      if (shieldActive) {
        deactivateShield();
        scene.remove(obstacle);
        obstacles.splice(i, 1);
      } else {
        endGame();
      }
    }
  }

  // Milk cartons
  for (let i = milkCartons.length - 1; i >= 0; i--) {
    const milkCarton = milkCartons[i];
    milkCarton.position.z += mixer.timeScale * 0.1;
    if (milkCarton.position.z > 5) { scene.remove(milkCarton); milkCartons.splice(i, 1); }
    if (Math.abs(player.position.x - milkCarton.position.x) < 1 &&
        Math.abs(player.position.z - milkCarton.position.z) < 1) {
      if (milkCarton.userData.type === "bigMilk") {
        score += 200;
      } else {
        score += 10;
      }
      scoreBoard.innerText = `Score: ${score}`;
      scene.remove(milkCarton); milkCartons.splice(i, 1);
      collectSound.currentTime = 0; collectSound.play();
    }
  }

  // Power-ups (shield)
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.position.z += mixer.timeScale * 0.1;
    if (powerUp.position.z > 5) { scene.remove(powerUp); powerUps.splice(i, 1); }
    if (Math.abs(player.position.x - powerUp.position.x) < 1 &&
        Math.abs(player.position.z - powerUp.position.z) < 1) {
      if (powerUp.userData.type === "shield") {
        activateShield();
      }
      scene.remove(powerUp);
      powerUps.splice(i, 1);
      collectSound.currentTime = 0; collectSound.play();
    }
  }
}

init();
