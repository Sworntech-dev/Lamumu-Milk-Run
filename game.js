// game.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let player, playerBox, playerCow;
let mixers = [];
let clock = new THREE.Clock();
let obstacles = [];
let milks = [];
let score = 0;
let gameSpeed = 0.05;
let isGameRunning = false;
let selectedCharacter = "box"; // default

// HTML UI
const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const startBoxBtn = document.getElementById("startBox");
const startCowBtn = document.getElementById("startCow");
const restartBtn = document.getElementById("restartBtn");
const scoreDisplay = document.getElementById("score");
const finalScore = document.getElementById("finalScore");

startBoxBtn.addEventListener("click", () => startGame("box"));
startCowBtn.addEventListener("click", () => startGame("cow"));
restartBtn.addEventListener("click", () => restartGame());

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Light
    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 2);
    scene.add(light);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(50, 200, 10, 10);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Player placeholder (box)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    playerBox = new THREE.Mesh(geometry, material);

    // Load Cow
    const loader = new GLTFLoader();
    loader.load('/cow_-_farm_animal_-_3december2022.glb', function (gltf) {
        playerCow = gltf.scene;
        playerCow.scale.set(0.5, 0.5, 0.5);
        playerCow.visible = false;
        scene.add(playerCow);

        if (gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(playerCow);
            mixer.clipAction(gltf.animations[0]).play();
            mixers.push(mixer);
        }
    });

    window.addEventListener("resize", onWindowResize, false);
}

function startGame(character) {
    selectedCharacter = character;
    startScreen.style.display = "none";
    endScreen.style.display = "none";
    score = 0;
    gameSpeed = 0.05;
    obstacles = [];
    milks = [];

    if (character === "box") {
        player = playerBox;
        player.position.set(0, 0.5, 0);
        scene.add(player);
    } else if (character === "cow" && playerCow) {
        player = playerCow;
        player.position.set(0, 0, 0);
        player.visible = true;
    }

    isGameRunning = true;
}

function endGame() {
    isGameRunning = false;
    endScreen.style.display = "flex";
    finalScore.textContent = score;
    if (player === playerCow) player.visible = false;
    if (player === playerBox) scene.remove(playerBox);
}

function restartGame() {
    startScreen.style.display = "flex";
    endScreen.style.display = "none";
}

function spawnObstacle() {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const obstacle = new THREE.Mesh(geometry, material);
    const lane = Math.floor(Math.random() * 3) - 1;
    obstacle.position.set(lane * 3, 1, -100);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function spawnMilk() {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const milk = new THREE.Mesh(geometry, material);
    const lane = Math.floor(Math.random() * 3) - 1;
    milk.position.set(lane * 3, 0.5, -100);
    scene.add(milk);
    milks.push(milk);
}

function detectCollisions() {
    if (!player) return;

    const playerBox3 = new THREE.Box3().setFromObject(player);

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacleBox = new THREE.Box3().setFromObject(obstacles[i]);
        if (playerBox3.intersectsBox(obstacleBox)) {
            endGame();
        }
    }

    for (let i = milks.length - 1; i >= 0; i--) {
        const milkBox = new THREE.Box3().setFromObject(milks[i]);
        if (playerBox3.intersectsBox(milkBox)) {
            scene.remove(milks[i]);
            milks.splice(i, 1);
            score += 10;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    mixers.forEach(mixer => mixer.update(delta));

    if (isGameRunning) {
        scoreDisplay.textContent = score;

        // move objects
        obstacles.forEach(obstacle => obstacle.position.z += gameSpeed);
        milks.forEach(milk => milk.position.z += gameSpeed);

        // cleanup
        obstacles = obstacles.filter(o => o.position.z < 20);
        milks = milks.filter(m => m.position.z < 20);

        // spawn
        if (Math.random() < 0.02) spawnObstacle();
        if (Math.random() < 0.015) spawnMilk();

        // speed up slowly
        gameSpeed = Math.min(0.3, gameSpeed + 0.00001);

        detectCollisions();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
