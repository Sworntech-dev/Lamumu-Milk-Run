import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let player = null;
let mixer = null;
let clock = new THREE.Clock();
let gameStarted = false;
let selectedCharacter = null;

// HTML elementleri
const startBtn = document.getElementById("startButton");
const overlay = document.getElementById("overlay");
const scoreBoard = document.getElementById("scoreBoard");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");

const loader = new GLTFLoader();

// -------- Karakter Seçim Fonksiyonu --------
window.selectCharacter = function(type) {
  selectedCharacter = type;
  startBtn.disabled = false; // karakter seçildi, start aktif
  console.log("Selected character:", type);
}

// -------- Start Game Fonksiyonu --------
window.startGame = function() {
  if (!selectedCharacter) return;

  overlay.classList.add("hidden");
  init();
  gameStarted = true;
  animate();
}

// -------- Restart Game --------
window.restartGame = function() {
  location.reload();
}

// -------- Init Scene --------
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 1000),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Karakter ekle
  if (selectedCharacter === "box") {
    const geometry = new THREE.BoxGeometry(1,1,1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0,0.5,0);
    scene.add(player);
  } else if (selectedCharacter === "cow") {
    loader.load("cow_-_farm_animal_-_3december2022.glb", (gltf)=>{
      player = gltf.scene;
      player.scale.set(0.5,0.5,0.5);
      player.position.set(0,0,0);
      scene.add(player);
      mixer = new THREE.AnimationMixer(player);
      if(gltf.animations.length>0) mixer.clipAction(gltf.animations[0]).play();
    });
  }

  window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// -------- Animate --------
function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) return;
  if (!player) return;

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);
}
