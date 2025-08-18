// DOM
const overlay = document.getElementById("overlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreBoard = document.getElementById("scoreBoard");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const finalScoreText = document.getElementById("finalScoreText");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

// Oyun değişkenleri
let scene, camera, renderer;
let player = null, mixer, animations, clock = new THREE.Clock();
let gameStarted = false, gameOver = false, score = 0;
const lanes = [-3, 0, 3];
let currentLane = 1;
const obstacles = [], milkCartons = [];
let milkCartonModel, obstacleModels = [], laneLines = [];
const lineDashLength = 5, lineGap = 5, totalLineLength = 100;

// Sesler
const backgroundMusic = new Audio("sounds/background.mp3");
backgroundMusic.loop = true; backgroundMusic.volume = 0.5;
const collectSound = new Audio("sounds/collect.mp3");
const hitSound = new Audio("sounds/hit.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");

// Difficulty
let currentDifficulty = null;
let minSpeed = 0.2, maxSpeed = 0.4;

// Difficulty selection
difficultyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentDifficulty = btn.dataset.difficulty;
    startButton.disabled = false;

    if(currentDifficulty === "easy"){ minSpeed = 0.2; maxSpeed = 0.4; }
    else if(currentDifficulty === "medium"){ minSpeed = 0.4; maxSpeed = 0.6; }
    else if(currentDifficulty === "hard"){ minSpeed = 0.6; maxSpeed = 0.8; }

    difficultyButtons.forEach(b => b.style.backgroundColor="#4CAF50");
    btn.style.backgroundColor="#1DA1F2";
  });
});

// Klavye kontrolleri
window.addEventListener('keydown', (event) => {
  if (!gameStarted || gameOver) return;
  if(event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft'){
    if(currentLane>0) currentLane--;
  } else if(event.key==='d' || event.key==='D' || event.key==='ArrowRight'){
    if(currentLane<lanes.length-1) currentLane++;
  }
});

// Resize
window.addEventListener("resize",()=>{
  if(!camera||!renderer) return;
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

// Init
function init(){
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x87ceeb);
  camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.set(0,3,7);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(5,10,7); scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff,0.5));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20,1000),
    new THREE.MeshStandardMaterial({color:0x228B22})
  );
  ground.rotation.x=-Math.PI/2; scene.add(ground);

  loadModels();
}

function createDashedLaneLines(){
  const mat = new THREE.MeshBasicMaterial({color:0x000000});
  const geom = new THREE.BoxGeometry(0.1,0.1,lineDashLength);
  const totalSegment = lineDashLength+lineGap;
  const numDashes = Math.ceil(totalLineLength/totalSegment);
  for(let i=0;i<numDashes;i++){
    const z=-i*totalSegment;
    [-1.5,1.5].forEach(x=>{
      const line = new THREE.Mesh(geom,mat);
      line.position.set(x,0.05,z);
      scene.add(line);
      laneLines.push(line);
    });
  }
}

function loadModels(){
  const loader = new THREE.GLTFLoader();
  const modelsToLoad = [
    {name:'cow',path:'dancing_cow.glb'},
    {name:'milkCarton',path:'lowpoly_painted_milk_carton_-_realisticlow_poly.glb'},
    {name:'windmill',path:'handpainted_windmill_tower.glb'},
    {name:'scarecrow',path:'scarecrow_for_farm.glb'},
    {name:'hay_bales',path:'hay_bales.glb'}
  ];
  let loaded=0;
  modelsToLoad.forEach(model=>{
    loader.load(model.path,(gltf)=>{
      gltf.scene.name=model.name;
      if(model.name==='cow'){
        player=gltf.scene; player.position.set(lanes[currentLane],0,0);
        player.rotation.y=Math.PI; player.scale.set(1,1,1); scene.add(player);
        animations=gltf.animations;
        if(animations.length) mixer=new THREE.AnimationMixer(player);
      } else if(model.name==='milkCarton'){ milkCartonModel=gltf.scene; }
      else obstacleModels.push(gltf.scene);

      loaded++;
      if(loaded===modelsToLoad.length) animate();
    });
  });
}

startButton.addEventListener("click",()=>{
  if(!animations||!currentDifficulty) return;
  overlay.style.display="none";
  const danceClip = animations.find(c=>c.name==='dance');
  if(danceClip){
    const action = mixer.clipAction(danceClip);
    action.setLoop(THREE.LoopOnce); action.clampWhenFinished=true; action.play();
  }
  setTimeout(()=>{
    createDashedLaneLines(); startGame();
  },4000);
});

restartButton.addEventListener("click",()=>{location.reload();});

function createObstacle(){
  if(obstacleModels.length===0) return;
  const model = obstacleModels[Math.floor(Math.random()*obstacleModels.length)];
  const lane = lanes[Math.floor(Math.random()*lanes.length)];
  const obs = model.clone();
  obs.position.set(lane,0,-50); obs.rotation.y=Math.PI*1.5;
  if(model.name==="hay_bales"){ obs.scale.set(1.5,1.5,1.5); obs.position.y=1.1; }
  scene.add(obs); obstacles.push(obs);
}

function createMilkCarton(){
  if(!milkCartonModel) return;
  const carton=milkCartonModel.clone();
  const lane=lanes[Math.floor(Math.random()*lanes.length)];
  carton.position.set(lane,0.5,-50); carton.scale.set(0.5,0.5,0.5);
  scene.add(carton); milkCartons.push(carton);
}

function spawnObjects(){ Math.random()>0.6?createMilkCarton():createObstacle(); }

function startGame(){
  if(!animations) return;
  const walkProudClip = animations.find(c=>c.name==='walk_proud');
  if(walkProudClip){ mixer.stopAllAction(); const action=mixer.clipAction(walkProudClip); action.setLoop(THREE.LoopRepeat); action.play(); mixer.timeScale=minSpeed; }
  score=0; gameStarted=true; gameOver=false; scoreBoard.innerText=`Score: ${score}`;
  spawnObjects(); setInterval(spawnObjects,1000);
  backgroundMusic.currentTime=0; backgroundMusic.play();
}

function endGame(){
  gameOver=true; gameStarted=false;
  if(mixer) mixer.stopAllAction();
  finalScoreText.innerText=`Final Score: ${score}`;
  gameOverOverlay.style.display="flex";
  backgroundMusic.pause(); gameOverSound.currentTime=0; gameOverSound.play();
}

function animate(){
  requestAnimationFrame(animate);
  const delta=clock.getDelta();
  if(mixer){ if(gameStarted) mixer.timeScale=Math.min(maxSpeed,mixer.timeScale+delta*0.01); mixer.update(delta); }

  if(player && !gameOver){
    const targetX = lanes[currentLane];
    player.position.x+=(targetX-player.position.x)*0.1;

    const speed=mixer.timeScale*0.1;
    const totalSegment=lineDashLength+lineGap;
    laneLines.forEach(line=>{
      line.position.z+=speed;
      if(line.position.z>player.position.z+5) line.position.z-=totalSegment*(laneLines.length/2);
    });
  }

  renderer.render(scene,camera);
  if(!gameStarted||gameOver) return;

  // Obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i]; o.position.z+=mixer.timeScale*0.1;
    if(o.position.z>5){ scene.remove(o); obstacles.splice(i,1); }
    if(Math.abs(player.position.x-o.position.x)<1 && Math.abs(player.position.z-o.position.z)<1.5){ hitSound.currentTime=0; hitSound.play(); endGame(); }
  }

  // Milk
  for(let i=milkCartons.length-1;i>=0;i--){
    const m=milkCartons[i]; m.position.z+=mixer.timeScale*0.1;
    if(m.position.z>5){ scene.remove(m); milkCartons.splice(i,1); }
    if(Math.abs(player.position.x-m.position.x)<1 && Math.abs(player.position.z-m.position.z)<1){
      score+=10; scoreBoard.innerText=`Score: ${score}`;
      scene.remove(m); milkCartons.splice(i,1); collectSound.currentTime=0; collectSound.play();
    }
  }
}

init();
