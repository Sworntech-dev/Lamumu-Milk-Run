import * as THREE from 'three';

let scene, camera, renderer;
let player = null;
let gameStarted = false;
let selectedCharacter = null;
let clock = new THREE.Clock();

// HTML elementleri
const startBtn = document.getElementById("startButton");
const overlay = document.getElementById("overlay");
const scoreBoard = document.getElementById("scoreBoard");

// Karakter seçim fonksiyonu
window.selectCharacter = function(type) {
    selectedCharacter = type;
    startBtn.disabled = false;
    console.log("Selected:", type);
}

// Start game fonksiyonu
window.startGame = function() {
    if (!selectedCharacter) return;

    overlay.classList.add("hidden");
    init();
    gameStarted = true;
    animate();
}

// Restart game
window.restartGame = function() {
    location.reload();
}

// Init scene
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(5,10,7);
    scene.add(light);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20,100),
        new THREE.MeshStandardMaterial({color:0x228B22})
    );
    ground.rotation.x = -Math.PI/2;
    scene.add(ground);

    // Karakter ekle
    if (selectedCharacter === "green") {
        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshStandardMaterial({color:0x00ff00});
        player = new THREE.Mesh(geometry, material);
        player.position.set(0,0.5,0);
        scene.add(player);
    } else if (selectedCharacter === "black") {
        const geometry = new THREE.BoxGeometry(1,1,1);
        const material = new THREE.MeshStandardMaterial({color:0x000000});
        player = new THREE.Mesh(geometry, material);
        player.position.set(0,0.5,0);
        scene.add(player);
    }

    window.addEventListener("resize", ()=>{
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Animate
function animate() {
    requestAnimationFrame(animate);
    if (!gameStarted) return;
    renderer.render(scene, camera);
}
