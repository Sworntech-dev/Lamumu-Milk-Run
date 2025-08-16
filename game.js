// game.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let player, cowModel;
let lane = 0; // -1 left, 0 middle, 1 right
let obstacles = [];
let milks = [];
let score = 0;
let speed = 0.1;
let gameOver = false;
let gameStarted = false;
let selectedCharacter = null;

// HTML elementleri
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const scoreElement = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreElement = document.getElementById("finalScore");
const characterSelectButtons = document.querySelectorAll(".character-select");

// Renderer setup
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Scene ve camera
scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d0f0);
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 2;

// Light
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// Floor
const floorGeometry = new THREE.PlaneGeometry(10, 1000);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Load cow model
const loader = new GLTFLoader();
loader.load(
  "cow_-_farm_animal_-_3december2022.glb",
  function (gltf) {
    cowModel = gltf.scene;
    cowModel.scale.set(0.5, 0.5, 0.5);
    cowModel.position.set(0, 0, 0);
  },
  undefined,
  function (error) {
    console.error("Error loading cow model:", error);
  }
);

// ----------------- GAME FUNCTIONS -----------------
function createPlayerBox() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.y = 0.5;
  return cube;
}

function startGame() {
  if (!selectedCharacter) return; // karakter seçilmemişse başlamasın

  // Player reset
  if (player) scene.remove(player);

  if (selectedCharacter === "box") {
    player = createPlayerBox();
  } else if (selectedCharacter === "cow" && cowModel) {
    player = cowModel.clone();
    player.position.y = 0;
  } else {
    // fallback olarak kutu
    player = createPlayerBox();
  }

  lane = 0;
  player.position.set(0, 0.5, 0);
  scene.add(player);

  obstacles = [];
  milks = [];
  score = 0;
  speed = 0.1;
  gameOver = false;
  gameStarted = true;

  gameOverScreen.style.display = "none";
  scoreElement.innerText = "Score: 0";
  animate();
}

function endGame() {
  gameOver = true;
  gameStarted = false;
  gameOverScreen.style.display = "block";
  finalScoreElement.innerText = `Your Score: ${score}`;
}

function spawnObstacle() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const obstacle = new THREE.Mesh(geometry, material);

  const laneX = (Math.floor(Math.random() * 3) - 1) * 2;
  obstacle.position.set(laneX, 0.5, -20);
  scene.add(obstacle);
  obstacles.push(obstacle);
}

function spawnMilk() {
  const geometry = new THREE.SphereGeometry(0.3, 16, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const milk = new THREE.Mesh(geometry, material);

  const laneX = (Math.floor(Math.random() * 3) - 1) * 2;
  milk.position.set(laneX, 0.3, -20);
  scene.add(milk);
  milks.push(milk);
}

function checkCollisions() {
  const playerBox = new THREE.Box3().setFromObject(player);

  for (let obs of obstacles) {
    const obsBox = new THREE.Box3().setFromObject(obs);
    if (playerBox.intersectsBox(obsBox)) {
      endGame();
      return;
    }
  }

  for (let i = milks.length - 1; i >= 0; i--) {
    const milkBox = new THREE.Box3().setFromObject(milks[i]);
    if (playerBox.intersectsBox(milkBox)) {
      scene.remove(milks[i]);
      milks.splice(i, 1);
      score += 10;
      scoreElement.innerText = `Score: ${score}`;
    }
  }
}

function animate() {
  if (!gameStarted) return;
  if (gameOver) return;

  requestAnimationFrame(animate);

  obstacles.forEach((obs, i) => {
    obs.position.z += speed;
    if (obs.position.z > 5) {
      scene.remove(obs);
      obstacles.splice(i, 1);
    }
  });

  milks.forEach((milk, i) => {
    milk.position.z += speed;
    if (milk.position.z > 5) {
      scene.remove(milk);
      milks.splice(i, 1);
    }
  });

  if (Math.random() < 0.02) spawnObstacle();
  if (Math.random() < 0.015) spawnMilk();

  speed = Math.min(0.3, speed + 0.00001); // yavaş yavaş hızlansın

  checkCollisions();
  renderer.render(scene, camera);
}

// ----------------- INPUT -----------------
document.addEventListener("keydown", (event) => {
  if (!player || !gameStarted) return;

  if (event.key === "a" && lane > -1) {
    lane -= 1;
    player.position.x = lane * 2;
  } else if (event.key === "d" && lane < 1) {
    lane += 1;
    player.position.x = lane * 2;
  }
});

// ----------------- MENU LOGIC -----------------
characterSelectButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCharacter = btn.dataset.character;
    characterSelectButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    startButton.disabled = false; // karakter seçilince aktif
  });
});

startButton.addEventListener("click", () => {
  startGame();
});

restartButton.addEventListener("click", () => {
  startGame();
});
