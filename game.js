import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer;
let player, playerType = null; 
let mixer;
let clock = new THREE.Clock();

let gameStarted = false;
let speed = 0.1;
let objects = [];
let score = 0;
let scoreElement = document.getElementById("scoreValue");
let startButton = document.getElementById("startButton");
let gameOverScreen = document.getElementById("gameOverScreen");
let finalScore = document.getElementById("finalScore");
let restartButton = document.getElementById("restartButton");

const loader = new GLTFLoader();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0d0ff);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    let ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    let ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 1000),
        new THREE.MeshPhongMaterial({ color: 0x228822 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    document.getElementById("chooseCube").addEventListener("click", () => selectCharacter("cube"));
    document.getElementById("chooseCow").addEventListener("click", () => selectCharacter("cow"));
    startButton.addEventListener("click", startGame);
    restartButton.addEventListener("click", restartGame);

    animate();
}

function selectCharacter(type) {
    playerType = type;
    startButton.disabled = false; 
    console.log("Selected:", type);
}

function startGame() {
    if (!playerType) return;

    document.getElementById("menu").style.display = "none";
    score = 0;
    scoreElement.innerText = score;
    gameStarted = true;
    speed = 0.1;

    if (playerType === "cube") {
        let geometry = new THREE.BoxGeometry(1, 1, 1);
        let material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        player = new THREE.Mesh(geometry, material);
        player.position.set(0, 0.5, 0);
        scene.add(player);
    } else if (playerType === "cow") {
        loader.load(
            "cow_-_farm_animal_-_3december2022.glb",
            (gltf) => {
                player = gltf.scene;
                player.scale.set(0.5, 0.5, 0.5);
                player.position.set(0, 0, 0);
                scene.add(player);
                mixer = new THREE.AnimationMixer(player);
                if (gltf.animations.length > 0) {
                    mixer.clipAction(gltf.animations[0]).play();
                }
            },
            undefined,
            (error) => {
                console.error("Error loading cow:", error);
            }
        );
    }
}

function restartGame() {
    window.location.reload();
}

function gameOver() {
    gameStarted = false;
    gameOverScreen.style.display = "block";
    finalScore.innerText = score;
}

function animate() {
    requestAnimationFrame(animate);
    let delta = clock.getDelta();

    if (gameStarted && player) {
        score++;
        scoreElement.innerText = score;

        if (mixer) mixer.update(delta);
    }

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
