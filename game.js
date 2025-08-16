import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, player;
let obstacles = [], milks = [];
let score = 0;
const lanes = [-2,0,2]; 
let currentLane = 1;
let targetX = lanes[currentLane];

const scoreboard = document.getElementById('scoreboard');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');

const keys = {};
let gameStarted = false;
let gameSpeed = 0; 
const maxSpeed = 0.06; 
const gameSpeedIncrement = 0.00001; 
let spawnCooldown = 0; 

startBtn.addEventListener('click', () => {
    startGame();
});

function startGame(){
    gameStarted = true;
    overlay.style.display = 'none';
    score = 0;
    gameSpeed = 0.02; 
    obstacles.forEach(o=>scene.remove(o)); obstacles=[];
    milks.forEach(m=>scene.remove(m)); milks=[];
    if(player) player.position.set(lanes[1],0,0);
    currentLane = 1;
    targetX = lanes[currentLane];
    spawnCooldown = 0;
    updateScoreboard();
}

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

init();
animate();

function init(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 100);
    camera.position.set(0,5,10);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(10,10,10);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x888888);
    scene.add(ambient);

    const groundGeo = new THREE.PlaneGeometry(10,50);
    const groundMat = new THREE.MeshPhongMaterial({color:0x228B22});
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.position.z = 0;
    scene.add(ground);

    // Player = inek modeli
    const loader = new GLTFLoader();
    loader.load('cow/scene.gltf', function(gltf){
        player = gltf.scene;
        player.scale.set(0.5,0.5,0.5);
        player.position.set(lanes[currentLane], 0.25, 0); // y yüksekliği ayarlandı
        scene.add(player);
    }, undefined, function(error){
        console.error('GLTF yükleme hatası:', error);
    });
}

function spawnItem(){
    const zPos = -25;

    // Engel spawn %20 olasılık
    if(Math.random()<0.2){
        const freeLanes = lanes.slice();
        const laneIndex = Math.floor(Math.random() * freeLanes.length);
        const obsLane = freeLanes.splice(laneIndex,1)[0];
        const box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshPhongMaterial({color:0x8B4513}));
        box.position.set(obsLane,0.5,zPos);
        scene.add(box);
        obstacles.push(box);
    }

    // Süt spawn %20 olasılık
    if(Math.random()<0.2){
        const freeLanes = lanes.slice();
        const laneIndex = Math.floor(Math.random() * freeLanes.length);
        const milkLane = freeLanes.splice(laneIndex,1)[0];
        const milk = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), new THREE.MeshPhongMaterial({color:0xFFFF00}));
        milk.position.set(milkLane,0.25,zPos);
        scene.add(milk);
        milks.push(milk);
    }
}

function updateScoreboard(){
    let wlChance = 0;
    if(score>=50) wlChance=100;
    else if(score>=25) wlChance=75;
    else if(score>=15) wlChance=50;
    else if(score>=5) wlChance=25;
    scoreboard.innerText = `Score: ${score} | WL Chance: ${wlChance}%`;
}

function gameOver(){
    gameStarted = false;
    overlayText.innerText = `Game Over!\nScore: ${score}`;
    startBtn.innerText = "Restart";
    overlay.style.display = 'flex';
}

function animate(){
    requestAnimationFrame(animate);

    if(!gameStarted || !player) return;

    if(gameSpeed < maxSpeed) gameSpeed += gameSpeedIncrement;

    if(keys['a'] && currentLane>0){ currentLane--; keys['a']=false; targetX=lanes[currentLane]; }
    if(keys['d'] && currentLane<2){ currentLane++; keys['d']=false; targetX=lanes[currentLane]; }

    player.position.x += (targetX - player.position.x)*0.2;

    // Spawn cooldown
    spawnCooldown -= gameSpeed*5;
    if(spawnCooldown <= 0){
        spawnItem();
        spawnCooldown = 5;
    }

    const playerBox = new THREE.Box3().setFromObject(player);

    obstacles.forEach((obs,i)=>{
        obs.position.z += gameSpeed*5;
        const obsBox = new THREE.Box3().setFromObject(obs);
        if(playerBox.intersectsBox(obsBox)){
            gameOver();
        }
        if(obs.position.z>5){ scene.remove(obs); obstacles.splice(i,1); }
    });

    milks.forEach((milk,i)=>{
        milk.position.z += gameSpeed*5;
        const milkBox = new THREE.Box3().setFromObject(milk);
        if(playerBox.intersectsBox(milkBox)){
            score++;
            updateScoreboard();
            scene.remove(milk);
            milks.splice(i,1);
        }
        if(milk.position.z>5){ scene.remove(milk); milks.splice(i,1); }
    });

    updateScoreboard();
    renderer.render(scene,camera);
}
