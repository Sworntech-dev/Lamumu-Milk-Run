import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let player, mixer;
let clock = new THREE.Clock();
let gameStarted = false;
let selectedCharacter = null; // seçilen karakter
let obstacles = [];
let score = 0;
let scoreBoard = document.getElementById("scoreBoard");
let gameOverScreen = document.getElementById("gameOverScreen");
let finalScore = document.getElementById("finalScore");

const loader = new GLTFLoader();

// --- Karakter seçme fonksiyonu (HTML'den çağrılır) ---
window.selectCharacter = function (character) {
  selectedCharacter = character;
  document.getElementById("startButton").disabled = false;
};

// --- Oyunu başlat ---
window.startGame = function () {
  if (!selectedCharacter) return; // karakter seçilmemişse başlamasın

  document.getElementById("overlay").classList.add("hidden");

  init();
  animate();
  gameStarted = true;
};

// --- Oyunu tekrar başlat ---
window.restartGame = function () {
  location.reload();
};

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  // Zemin
  const groundGeometry = new THREE.PlaneGeometry(200, 200);
  const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Karakter ekleme
  if (selectedCharacter === "box") {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 0.5, 0);
    scene.add(player);
  } else if (selectedCharacter === "cow") {
    loader.load("cow_-_farm_animal_-_3december2022.glb", (gltf) => {
      player = gltf.scene;
      player.scale.set(2, 2, 2);
      player.position.set(0, 0, 0);
      scene.add(player);

      mixer = new THREE.AnimationMixer(player);
      if (gltf.animations.length > 0) {
        mixer.clipAction(gltf.animations[0]).play();
      }
    });
  }

  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (mixer) mixer.update(clock.getDelta());

  if (gameStarted && player) {
    // Skoru artır
    score += 0.01;
    scoreBoard.textContent = "Score: " + Math.floor(score);
  }

  renderer.render(scene, camera);
}
