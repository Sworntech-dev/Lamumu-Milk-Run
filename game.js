import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let clock = new THREE.Clock();
let character = null;
let mixer = null;
let obstacles = [];
let milks = [];
let speed = 0.05;
let score = 0;
let isGameRunning = false;
let selectedCharacter = null;

// HTML elementleri
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const scoreEl = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOver");
const charCubeBtn = document.getElementById("chooseCube");
const charCowBtn = document.getElementById("chooseCow");

// Karakter seçimi
charCubeBtn.addEventListener("click", () => {
    selectedCharacter = "cube";
    startBtn.disabled = false; // karakter seçildiğinde start aktif
});
charCowBtn.addEventListener("click", () => {
    selectedCharacter = "cow";
    startBtn.disabled = false;
});

// Start game
startBtn.addEventListener("click", () => {
    if (!selectedCharacter) return;
    document.getElementById("menu").style.display = "none";
    init();
    isGameRunning = true;
    animate();
});

// Restart
restartBtn.addEventListener("click", () => {
    location.reload(); // sayfayı yenile
});

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Işık
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    // Zemin
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Karakter yükle
    if (selectedCharacter === "cube") {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        character = new THREE.Mesh(geometry, material);
        character.position.set(0, 0.5, 0);
        scene.add(character);
    } else if (selectedCharacter === "cow") {
        const loader = new GLTFLoader();
        loader.load("models/cow_-_farm_animal_-_3december2022.glb", (gltf) => {
            character = gltf.scene;
            character.scale.set(0.5, 0.5, 0.5);
            character.position.set(0, 0, 0);
            scene.add(character);

            mixer = new THREE.AnimationMixer(character);
            if (gltf.animations.length > 0) {
                mixer.clipAction(gltf.animations[0]).play();
            }
        });
    }

    window.addEventListener("resize", onWindowResize);
}

// Resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    if (!isGameRunning) return;

    let delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    // Basit skor artışı
    score += 1;
    scoreEl.innerText = `Score: ${score}`;

    renderer.render(scene, camera);
}
