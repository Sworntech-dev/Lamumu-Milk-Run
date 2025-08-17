// Selecting DOM elements
const overlay = document.getElementById("overlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreBoard = document.getElementById("scoreBoard");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const finalScoreText = document.getElementById("finalScoreText");

// Game variables
let scene, camera, renderer;
let player = null;
let mixer; // Not used anymore but kept for compatibility
let animations; // Not used anymore but kept for compatibility
let clock = new THREE.Clock();
let gameStarted = false;
let gameOver = false;
let score = 0;

// Music variables
let synth;
let loop;

// Lane positions
const lanes = [-3, 0, 3];
let currentLane = 1;

// Arrays to hold objects
const obstacles = [];
const milkCartons = [];

let spawnTimer = 0;
const spawnInterval = 1;

// Global variables for road lines
let laneLines = [];
const lineDashLength = 5;
const lineGap = 5;
const totalLineLength = 100;

// Keyboard Controls
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

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // Ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 1000),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  
  // Create simple player, obstacles, and collectibles
  player = createPlayerModel();
  scene.add(player);

  createDashedLaneLines();
  setupMusic();
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function createPlayerModel() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue cube
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(lanes[currentLane], 0.5, 0);
  return cube;
}

function createObstacleModel() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red cube
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.y = 0.5;
  return obstacle;
}

function createMilkCartonModel() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xffd700 }); // Gold sphere
  const collectible = new THREE.Mesh(geometry, material);
  collectible.position.y = 0.5;
  return collectible;
}

function setupMusic() {
  synth = new Tone.Synth().toDestination();
  const notes = ["C4", "E4", "G4", "A4", "G4", "E4"];
  loop = new Tone.Sequence((time, note) => {
    synth.triggerAttackRelease(note, "8n", time);
  }, notes, "4n").start(0);
  Tone.Transport.bpm.value = 120;
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

startButton.addEventListener("click", () => {
  overlay.style.display = "none";
  Tone.start();
  Tone.Transport.start();
  startGame();
});

restartButton.addEventListener("click", () => {
  location.reload();
});

function createObstacle() {
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const obstacle = createObstacleModel();
  obstacle.position.set(lanes[laneIndex], obstacle.position.y, -50);
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function createMilkCarton() {
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const milkCarton = createMilkCartonModel();
  milkCarton.position.set(lanes[laneIndex], milkCarton.position.y, -50);
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
  finalScoreText.innerText = `Final Score: ${score}`;
  gameOverOverlay.style.display = "flex";
  Tone.Transport.stop();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (player && !gameOver) {
    const targetX = lanes[currentLane];
    player.position.x += (targetX - player.position.x) * 0.1;
  }

  // Update line positions
  const speed = 2 * 0.1;
  const totalSegmentLength = lineDashLength + lineGap;
  if (laneLines.length > 0) {
    laneLines.forEach(line => {
      line.position.z += speed;
      if (line.position.z > player.position.z + 5) {
        line.position.z -= totalSegmentLength * (laneLines.length / 2);
      }
    });
  }

  renderer.render(scene, camera);
  if (!gameStarted || gameOver) {
    return;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    obstacle.position.z += speed;
    if (obstacle.position.z > 5) {
      scene.remove(obstacle);
      obstacles.splice(i, 1);
    }
    if (
      Math.abs(player.position.x - obstacle.position.x) < 1 &&
      Math.abs(player.position.z - obstacle.position.z) < 1.5
    ) {
      console.log("Game Over! Hit an obstacle.");
      endGame();
    }
  }

  for (let i = milkCartons.length - 1; i >= 0; i--) {
    const milkCarton = milkCartons[i];
    milkCarton.position.z += speed;
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
      console.log("Collected a collectible! Score: " + score);
    }
  }
}

init();
