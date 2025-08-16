import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

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
let gameSpeed = 0; // başlangıçta 0
const maxSpeed = 0.08; // maksimum hız

startBtn.addEventListener('click', () => {
    startGame();
});

function startGame(){
    gameStarted = true;
    overlay.style.display = 'none';
    score = 0;
    gameSpeed = 0.02; // oyun yavaş başlar
    obstacles.forEach(o=>scene.remove(o)); obstacles=[];
    milks.forEach(m=>scene.remove(m)); milks=[];
    player.position.set(lanes[1],0,0);
    currentLane = 1;
    targetX = lanes[currentLane];
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

    // Ground
    const groundGeo = new THREE.PlaneGeometry(10,50);
    const groundMat = new THREE.MeshPhongMaterial({color:0x228B22});
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.position.z = 0;
    scene.add(ground);

    // Player = kutu
    player = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshPhongMaterial({color:0xffffff})
    );
    player.position.set(lanes[currentLane],0,0);
    scene.add(player);
}

function spawnItem(){
    if(Math.random()<0.02){
        let obsLane = lanes[Math.floor(Math.random()*3)];
        let box = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshPhongMaterial({color:0x8B4513}));
        box.position.set(obsLane,0.5,-25);
        scene.add(box);
        obstacles.push(box);
    }
    if(Math.random()<0.02){
        let milkLane = lanes[Math.floor(Math.random()*3)];
        let milk = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), new THREE.MeshPhongMaterial({color:0xFFFF00}));
        milk.position.set(milkLane,0.25,-25);
        scene.add(milk);
        milks.push(milk);
    }
}

function updateScoreboard(){
    let wlChance = 0;
    if(score>=500) wlChance=100;
    else if(score>=300) wlChance=75;
    else if(score>=200) wlChance=50;
    else if(score>=100) wlChance=25;
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

    if(!gameStarted) return; // oyun başlamadıysa hiçbir şey yapma

    // hız yavaş başlar, sonra artar
    if(gameSpeed<maxSpeed) gameSpeed += 0.00003;

    // WASD lane switch
    if(keys['a'] && currentLane>0){ currentLane--; keys['a']=false; targetX=lanes[currentLane]; }
    if(keys['d'] && currentLane<2){ currentLane++; keys['d']=false; targetX=lanes[currentLane]; }

    // Smooth lane movement
    player.position.x += (targetX - player.position.x)*0.2;
    player.position.z -= gameSpeed*5;

    spawnItem();

    // Obstacles
    obstacles.forEach((obs,i)=>{
        obs.position.z += gameSpeed*5;
        if(Math.abs(player.position.z - obs.position.z)<0.5 && player.position.x===obs.position.x){
            gameOver();
        }
        if(obs.position.z>5){ scene.remove(obs); obstacles.splice(i,1); }
    });

    // Milk bottles
    milks.forEach((milk,i)=>{
        milk.position.z += gameSpeed*5;
        if(Math.abs(player.position.z - milk.position.z)<0.5 && player.position.x===milk.position.x){
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
