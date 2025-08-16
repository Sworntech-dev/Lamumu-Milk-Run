import * as THREE from 'three';

let scene, camera, renderer;
let player = null;
let clock = new THREE.Clock();
let gameStarted = false;
let score = 0;

// HTML elementleri
const overlay = document.getElementById("overlay");
const scoreBoard = document.getElementById("scoreBoard");

let selectedCharacter = null;

// ----------------- Karakter Seçimi -----------------
document.getElementById("charGreen").addEventListener("click", ()=>{
    selectedCharacter = "green";
    startGame();
});
document.getElementById("charBlack").addEventListener("click", ()=>{
    selectedCharacter = "black";
    startGame();
});

// ----------------- Start Game -----------------
function startGame(){
    overlay.style.display = "none";
    init();
    gameStarted = true;
    animate();
}

// ----------------- Init Scene -----------------
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7);
    scene.add(light);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 100),
        new THREE.MeshStandardMaterial({ color: 0x228B22 })
    );
    ground.rotation.x = -Math.PI/2;
    scene.add(ground);

    // Karakter ekle
    const geometry = new THREE.BoxGeometry(1,1,1);
    const material = new THREE.MeshStandardMaterial({ color: selectedCharacter==="green"?0x00ff00:0x000000 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0,0.5,0);
    scene.add(player);

    window.addEventListener("resize", ()=>{
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ----------------- Animate -----------------
function animate() {
    requestAnimationFrame(animate);
    if(!gameStarted || !player) return;

    score++;
    scoreBoard.innerText = `Score: ${score}`;

    renderer.render(scene, camera);
}
