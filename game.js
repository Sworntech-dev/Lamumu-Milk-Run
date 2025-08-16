import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let cow, mixer;
let clock = new THREE.Clock();

let lanes = [ -2, 0, 2 ]; 
let currentLane = 1;
let moveDirection = 0;

let obstacles = [];
let milks = [];

let score = 0;
let speed = 0.05;
let gameStarted = false;
let gameOver = false;

const startButton = document.getElementById("startButton");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreText = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);

function startGame() {
    gameStarted = true;
    gameOver = false;
    score = 0;
    speed = 0.05;
    obstacles.forEach(o => scene.remove(o));
    milks.forEach(m => scene.remove(m));
    obstacles = [];
    milks = [];
    cow.position.set(0, 0, 0);
    gameOverScreen.style.display = "none";
    startButton.style.display = "none";
}

function restartGame() {
    startGame();
}

function endGame() {
    gameOver = true;
    gameOverScreen.style.display = "block";
    finalScoreText.textContent = "Score: " + score;
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaddff);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    scene.add(light);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 1000),
        new THREE.MeshStandardMaterial({ color: 0x228822 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // 🐄 COW MODEL LOAD
    const loader = new GLTFLoader();
    loader.load('./cow_-_farm_animal_-_3december2022.glb', (gltf) => {
        cow = gltf.scene;
        cow.scale.set(2, 2, 2);
        cow.position.set(0, 0, 0);
        scene.add(cow);

        // Animations (if available in model)
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(cow);
            mixer.clipAction(gltf.animations[0]).play();
        }
    });

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onWindowResize);
}

function onKeyDown(event) {
    if (!gameStarted || gameOver) return;
    if (event.key === "a" && currentLane > 0) {
        currentLane--;
    } else if (event.key === "d" && currentLane < lanes.length - 1) {
        currentLane++;
    }
}

function spawnObstacle() {
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(lanes[Math.floor(Math.random() * 3)], 1, -50);
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function spawnMilk() {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const milk = new THREE.Mesh(geometry, material);
    milk.position.set(lanes[Math.floor(Math.random() * 3)], 0.5, -50);
    scene.add(milk);
    milks.push(milk);
}

function animate() {
    requestAnimationFrame(animate);

    let delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (gameStarted && !gameOver) {
        if (cow) {
            cow.position.x += (lanes[currentLane] - cow.position.x) * 0.2;
        }

        if (Math.random() < 0.02) spawnObstacle();
        if (Math.random() < 0.01) spawnMilk();

        obstacles.forEach((obstacle, index) => {
            obstacle.position.z += speed;
            if (cow && obstacle.position.distanceTo(cow.position) < 1.5) {
                endGame();
            }
            if (obstacle.position.z > 10) {
                scene.remove(obstacle);
                obstacles.splice(index, 1);
            }
        });

        milks.forEach((milk, index) => {
            milk.position.z += speed;
            if (cow && milk.position.distanceTo(cow.position) < 1.5) {
                score += 10;
                scene.remove(milk);
                milks.splice(index, 1);
            }
            if (milk.position.z > 10) {
                scene.remove(milk);
                milks.splice(index, 1);
            }
        });

        speed = Math.min(speed + 0.00005, 0.3);

        document.getElementById("score").textContent = "Score: " + score;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();
animate();
