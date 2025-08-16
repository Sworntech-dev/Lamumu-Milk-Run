// DOM elemanlarını seçme
const overlay = document.getElementById("overlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreBoard = document.getElementById("scoreBoard");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const finalScoreText = document.getElementById("finalScoreText");

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

let spawnTimer = 0;
const spawnInterval = 1;

// 3D modelleri
let milkCartonModel;
let obstacleModels = [];

// Çizgiler için global değişkenler
let laneLines = [];
const lineSegmentCount = 10; // Yolun sürekli görünmesi için çizgi sayısı
const lineLength = 20; // Her bir çizgi parçasının uzunluğu

// Klavye Kontrolleri
window.addEventListener('keydown', (event) => {
  if (!gameStarted || gameOver) return;

  if (event.key === 'a' || event.key === 'A') {
    if (currentLane > 0) {
      currentLane--;
    }
  } else if (event.key === 'd' || event.key === 'D') {
    if (currentLane < lanes.length - 1) {
      currentLane++;
    }
  }
});

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 3, 7);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Işıklandırma
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Zemin oluşturma
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 1000),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Şerit çizgilerini oluşturma
  createLaneLines();

  loadModels();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function createLaneLines() {
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const lineGeometry = new THREE.BoxGeometry(0.1, 0.1, lineLength);

  for (let i = 0; i < lineSegmentCount; i++) {
    const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.position.set(-1.5, 0.05, -50 - (i * lineLength));
    scene.add(line1);
    laneLines.push(line1);

    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.position.set(1.5, 0.05, -50 - (i * lineLength));
    scene.add(line2);
    laneLines.push(line2);
  }
}

function loadModels() {
  const loader = new THREE.GLTFLoader();
  const modelsToLoad = [
    { name: 'cow', path: 'dancing_cow.glb' },
    { name: 'milkCarton', path: 'lowpoly_painted_milk_carton_-_realisticlow_poly.glb' },
    { name: 'windmill', path: 'handpainted_windmill_tower.glb' },
    { name: 'scarecrow', path: 'scarecrow_for_farm.glb' },
    { name: 'hay_bales', path: 'hay_bales.glb' }
  ];

  let loadedCount = 0;

  modelsToLoad.forEach(model => {
    loader.load(
      model.path,
      (gltf) => {
        const modelName = model.name;
        gltf.scene.name = modelName;

        if (model.name === 'cow') {
          player = gltf.scene;
          player.position.set(lanes[currentLane], 0, 0);
          player.rotation.y = Math.PI;
          player.scale.set(1, 1, 1);
          scene.add(player);
          animations = gltf.animations;
          if (animations && animations.length) {
            mixer = new THREE.AnimationMixer(player);
          }
        } else if (model.name === 'milkCarton') {
          milkCartonModel = gltf.scene;
        } else {
          obstacleModels.push(gltf.scene);
        }

        loadedCount++;
        if (loadedCount === modelsToLoad.length) {
          animate();
        }
      },
      (xhr) => {
        console.log(`Model yükleniyor: ${model.name} ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error(`Yükleme hatası: ${model.path} dosyası bulunamadı veya yüklenemedi.`, error);
      }
    );
  });
}

startButton.addEventListener("click", () => {
  overlay.style.display = "none";
  const danceClip = animations.find(clip => clip.name === 'dance');
  if (danceClip) {
    const action = mixer.clipAction(danceClip);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    action.play();
  }
  setTimeout(() => {
    startGame();
  }, 4000);
});

restartButton.addEventListener("click", () => {
  location.reload();
});

function createObstacle() {
  if (obstacleModels.length === 0) return;
  const randomModel = obstacleModels[Math.floor(Math.random() * obstacleModels.length)];
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const obstaclePosition = new THREE.Vector3(lanes[laneIndex], 0, -50);
  const obstacle = randomModel.clone();
  obstacle.position.copy(obstaclePosition);
  obstacle.rotation.y = Math.PI * 1.5;
  if (randomModel.name === "windmill") {
    obstacle.scale.set(1, 1, 1);
    obstacle.position.y = 0;
  } else if (randomModel.name === "scarecrow") {
    obstacle.scale.set(1, 1, 1);
    obstacle.position.y = 0;
  } else if (randomModel.name === "hay_bales") {
    obstacle.scale.set(1.5, 1.5, 1.5);
    obstacle.position.y = 1.1;
  }
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function createMilkCarton() {
  if (!milkCartonModel) return;
  const milkCarton = milkCartonModel.clone();
  const laneIndex = Math.floor(Math.random() * lanes.length);
  milkCarton.position.set(lanes[laneIndex], 0.5, -50);
  milkCarton.scale.set(0.5, 0.5, 0.5);
  scene.add(milkCarton);
  milkCartons.push(milkCarton);
}

function spawnObjects() {
  if (Math.random() > 0.6) {
    createMilkCarton();
  } else {
    createObstacle();
  }
}

function startGame() {
  const walkProudClip = animations.find(clip => clip.name === 'walk_proud');
  if (walkProudClip) {
    mixer.stopAllAction();
    const action = mixer.clipAction(walkProudClip);
    action.setLoop(THREE.LoopRepeat);
    action.play();
    mixer.timeScale = 2;
  }
  score = 0;
  gameStarted = true;
  gameOver = false;
  scoreBoard.innerText = `Score: ${score}`;
  spawnObjects();
  setInterval(spawnObjects, 1000);
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  mixer.stopAllAction();
  finalScoreText.innerText = `Final Score: ${score}`;
  gameOverOverlay.style.display = "flex";
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) {
    if (gameStarted) {
      mixer.timeScale = Math.min(4, mixer.timeScale + delta * 0.05);
    }
    mixer.update(delta);
  }
  if (player && !gameOver) {
    const targetX = lanes[currentLane];
    player.position.x += (targetX - player.position.x) * 0.1;

    // Çizgilerin hareketini güncelleme
    const speed = mixer.timeScale * 0.1;
    laneLines.forEach(line => {
      line.position.z += speed;
      if (line.position.z > player.position.z + 5) {
        line.position.z -= lineLength * lineSegmentCount;
      }
    });
  }
  renderer.render(scene, camera);
  if (!gameStarted || gameOver) {
    return;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.position.z += mixer.timeScale * 0.1;
    if (obstacle.position.z > 5) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
    }
    if (
      Math.abs(player.position.x - obstacle.position.x) < 1 &&
      Math.abs(player.position.z - obstacle.position.z) < 1.5
    ) {
      console.log("Game Over! Engelle çarpıştı.");
      endGame();
    }
  }
  for (let i = milkCartons.length - 1; i >= 0; i--) {
    const milkCarton = milkCartons[i];
    milkCarton.position.z += mixer.timeScale * 0.1;
    if (milkCarton.position.z > 5) {
      scene.remove(milkCarton);
      milkCartons.splice(i, 1);
    }
    if (
      Math.abs(player.position.x - milkCarton.position.x) < 1 &&
      Math.abs(player.position.z - milkCarton.position.z) < 1
    ) {
      score += 10;
      scoreBoard.innerText = `Score: ${score}`;
      scene.remove(milkCarton);
      milkCartons.splice(i, 1);
      console.log("Süt toplandı! Skor: " + score);
    }
  }
}

init();