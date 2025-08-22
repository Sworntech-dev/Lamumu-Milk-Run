// DOM elemanları
const overlay = document.getElementById("overlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
const scoreBoard = document.getElementById("scoreBoard");
const restartButton = document.getElementById("restartButton");
const finalScoreText = document.getElementById("finalScoreText");

// Shield timer UI
const shieldTimerUI = document.createElement("div");
shieldTimerUI.style.position = "absolute";
shieldTimerUI.style.bottom = "20px";
shieldTimerUI.style.right = "20px";
shieldTimerUI.style.width = "60px";
shieldTimerUI.style.height = "60px";
shieldTimerUI.style.borderRadius = "50%";
shieldTimerUI.style.background = "rgba(0,150,255,0.7)";
shieldTimerUI.style.color = "white";
shieldTimerUI.style.display = "flex";
shieldTimerUI.style.alignItems = "center";
shieldTimerUI.style.justifyContent = "center";
shieldTimerUI.style.fontWeight = "bold";
shieldTimerUI.style.fontSize = "20px";
shieldTimerUI.style.display = "none";
document.body.appendChild(shieldTimerUI);

// Oyun değişkenleri
let scene, camera, renderer;
let player = null;
let mixer;
let animations = [];
let clock = new THREE.Clock();
let gameStarted = false;
let gameOver = false;
let score = 0;
let speed = 0;

// Lane ve spawn
const lanes = [-3,0,3];
let currentLane = 1;
const obstacles = [];
const milkCartons = [];
const powerUps = [];
let obstacleModels = [];
let milkCartonModel, shieldModel;

// Billboard / gallery
const galleryPanelsLeft = [];
const galleryPanelsRight = [];
const billboardTextures = [];
const GALLERY_SPACING = 30;
const GALLERY_COUNT_PER_SIDE = 12;
const GALLERY_X_OFFSET = 12;
const GALLERY_SIZE = {w:8,h:6};

// Spawn interval
let spawnIntervalMs = 1000;

// Shield
let shieldActive=false, shieldTimeout=null, shieldTimerInterval=null, shieldTimeLeft=0;

// Lane çizgileri
const laneLines=[];
const lineDashLength = 5;
const lineGap = 5;
const totalLineLength = 100;

// Sesler
const backgroundMusic = new Audio("sounds/background.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
const collectSound = new Audio("sounds/collect.mp3");
const hitSound = new Audio("sounds/hit.mp3");
const gameOverSound = new Audio("sounds/gameover.mp3");

// Difficulty
let minSpeed=2,maxSpeed=4;

// Klavye kontrol
window.addEventListener("keydown",e=>{
    if(!gameStarted||gameOver) return;
    if(e.key==="a"||e.key==="A"||e.key==="ArrowLeft") if(currentLane>0) currentLane--;
    if(e.key==="d"||e.key==="D"||e.key==="ArrowRight") if(currentLane<lanes.length-1) currentLane++;
});

// Window resize
window.addEventListener("resize",()=>{
    if(!camera||!renderer) return;
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

// --- INIT ---
let ground, groundTexture;
let stars;
function init(){
    scene=new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Tamamen siyah gökyüzü

    camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    camera.position.set(0,3,7);

    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light=new THREE.DirectionalLight(0xffffff,1);
    light.position.set(5,10,7);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff,0.5));

    // Zemin
    const texLoader = new THREE.TextureLoader();
    groundTexture = texLoader.load("grass.jpg");
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.wrapT = THREE.RepeatWrapping;
    groundTexture.repeat.set(4,200);
    const groundMat = new THREE.MeshStandardMaterial({map:groundTexture});
    ground = new THREE.Mesh(new THREE.PlaneGeometry(20,1000), groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.position.y = 0;
    scene.add(ground);

    // Yıldızlar
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starVertices = [];
    for(let i=0;i<starCount;i++){
        const x = (Math.random()-0.5)*200;
        const y = Math.random()*100+10;
        const z = (Math.random()-0.5)*200;
        starVertices.push(x,y,z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVertices,3));
    const starMat = new THREE.PointsMaterial({color:0xffffff, size:0.2});
    stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    preloadBillboardTextures();
    loadModels();
}

// --- Lane çizgileri ---
function createDashedLaneLines(){
    const lineMaterial = new THREE.MeshBasicMaterial({color:0x000000});
    const lineGeo = new THREE.BoxGeometry(0.1,0.1,lineDashLength);
    const totalSeg=lineDashLength+lineGap;
    const nDashes=Math.ceil(totalLineLength/totalSeg);

    for(let i=0;i<nDashes;i++){
        const z=-i*totalSeg;
        [-1.5,1.5].forEach(x=>{
            const line = new THREE.Mesh(lineGeo,lineMaterial);
            line.position.set(x,0.05,z);
            scene.add(line);
            laneLines.push(line);
        });
    }
}

// --- Load models ---
function loadModels(){
    const loader = new THREE.GLTFLoader();
    const models = [
        {name:'cow',path:'dancing_cow.glb'},
        {name:'milkCarton',path:'lowpoly_painted_milk_carton_-_realisticlow_poly.glb'},
        {name:'shield',path:'shield.glb'},
        {name:'windmill',path:'handpainted_windmill_tower.glb'},
        {name:'scarecrow',path:'scarecrow_for_farm.glb'},
        {name:'hay_bales',path:'hay_bales.glb'}
    ];
    let loadedCount=0;
    models.forEach(m=>{
        loader.load(m.path,gltf=>{
            if(m.name==='cow'){
                player = gltf.scene;
                player.position.set(lanes[currentLane],0,0);
                player.rotation.y = Math.PI;
                scene.add(player);
                animations=gltf.animations;
                if(animations.length) mixer = new THREE.AnimationMixer(player);
            }else if(m.name==='milkCarton') milkCartonModel=gltf.scene;
            else if(m.name==='shield') shieldModel=gltf.scene;
            else obstacleModels.push(gltf.scene);

            loadedCount++;
            if(loadedCount===models.length) animate();
        });
    });
}

// --- Billboard ---
function preloadBillboardTextures(){
    const loader = new THREE.TextureLoader();
    let loaded=0;
    for(let i=1;i<=10;i++){
        loader.load(`${i}.jpg`,tex=>{
            if("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
            billboardTextures.push(tex);
            loaded++; if(loaded===10) setupGallery();
        },undefined,()=>{
            const canvas=document.createElement('canvas');
            canvas.width=4;canvas.height=4;
            const ctx=canvas.getContext('2d');
            ctx.fillStyle="#888";ctx.fillRect(0,0,4,4);
            billboardTextures.push(new THREE.CanvasTexture(canvas));
            loaded++; if(loaded===10) setupGallery();
        });
    }
}

function setupGallery(){
    for(let i=0;i<GALLERY_COUNT_PER_SIDE;i++){
        const z=-i*GALLERY_SPACING;
        galleryPanelsLeft.push(createPanel(-GALLERY_X_OFFSET,z,Math.PI/2));
        galleryPanelsRight.push(createPanel(GALLERY_X_OFFSET,z,-Math.PI/2));
    }
}

function createPanel(x,z,rotY){
    const geom = new THREE.PlaneGeometry(GALLERY_SIZE.w,GALLERY_SIZE.h);
    const tex = billboardTextures[Math.floor(Math.random()*billboardTextures.length)];
    const mat = new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(geom,mat);
    mesh.position.set(x,GALLERY_SIZE.h/2,z);
    mesh.rotation.y = rotY;
    scene.add(mesh);
    return mesh;
}

// --- Spawn ---
function createObstacle(){
    if(obstacleModels.length===0) return;
    const model=obstacleModels[Math.floor(Math.random()*obstacleModels.length)];
    const lane=Math.floor(Math.random()*lanes.length);
    const obs=model.clone();
    const bbox = new THREE.Box3().setFromObject(obs);
    const offsetY = -bbox.min.y;
    obs.position.set(lanes[lane],offsetY,-50);
    obs.rotation.y = Math.PI*1.5;
    scene.add(obs);
    obstacles.push(obs);
}

function createMilkCarton(big=false){
    if(!milkCartonModel) return;
    const milk=milkCartonModel.clone();
    const lane=Math.floor(Math.random()*lanes.length);
    milk.position.set(lanes[lane],0.5,-50);
    milk.scale.set(big?1:0.5,big?1:0.5,big?1:0.5);
    milk.userData.type=big?"bigMilk":"milk";
    scene.add(milk);
    milkCartons.push(milk);
}

function createShield(){
    if(!shieldModel||shieldActive) return;
    const shield=shieldModel.clone();
    const lane=Math.floor(Math.random()*lanes.length);
    shield.position.set(lanes[lane],0.5,-50);
    shield.scale.set(0.7,0.7,0.7);
    shield.userData.type="shield";
    scene.add(shield);
    powerUps.push(shield);
}

function spawnObjects(){
    const r=Math.random();
    if(r<0.05&&!shieldActive) createShield();
    else if(r<0.1) createMilkCarton(true);
    else if(r<0.4) createMilkCarton(false);
    else createObstacle();
}

// --- Start game ---
document.querySelectorAll(".difficulty-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
        const diff=btn.dataset.difficulty;
        if(diff==="easy"){minSpeed=2;maxSpeed=4;}
        else if(diff==="medium"){minSpeed=4;maxSpeed=6;}
        else if(diff==="hard"){minSpeed=6;maxSpeed=8;}

        overlay.style.display="none";

        if(animations.length){
            const danceClip=animations.find(c=>c.name==='dance');
            if(danceClip){
                const action=mixer.clipAction(danceClip);
                action.setLoop(THREE.LoopOnce);
                action.clampWhenFinished=true;
                action.play();
                action.onFinished=()=>{createDashedLaneLines(); startGame();}
                setTimeout(()=>{if(!gameStarted){createDashedLaneLines();startGame();}},2000);
            }else{createDashedLaneLines();startGame();}
        }else{createDashedLaneLines();startGame();}
    });
});

restartButton.addEventListener("click",()=>location.reload());

function startGame(){
    if(animations.length){
        const walkClip = animations.find(c=>c.name==='walk_proud');
        if(walkClip){
            mixer.stopAllAction();
            const action = mixer.clipAction(walkClip);
            action.setLoop(THREE.LoopRepeat);
            action.play();
            mixer.timeScale = minSpeed;
        }
    }
    score=0;
    gameStarted=true;
    gameOver=false;
    scoreBoard.innerText=`Score: ${score}`;
    spawnObjects();
    setInterval(spawnObjects,spawnIntervalMs);
    backgroundMusic.currentTime=0;backgroundMusic.play();
}

// --- End game ---
function endGame(){
    gameOver=true;
    gameStarted=false;
    if(mixer) mixer.stopAllAction();
    finalScoreText.innerText=`Final Score: ${score}`;
    gameOverOverlay.style.display="flex";
    backgroundMusic.pause();
    gameOverSound.currentTime=0;gameOverSound.play();
}

// --- Shield ---
function activateShield(){
    shieldActive=true;
    shieldTimeLeft=10;
    shieldTimerUI.style.display="flex";
    shieldTimerUI.innerText=shieldTimeLeft;
    clearTimeout(shieldTimeout); clearInterval(shieldTimerInterval);
    shieldTimeout=setTimeout(()=>deactivateShield(),10000);
    shieldTimerInterval=setInterval(()=>{
        shieldTimeLeft--;
        shieldTimerUI.innerText=shieldTimeLeft;
        if(shieldTimeLeft<=0) clearInterval(shieldTimerInterval);
    },1000);
}

function deactivateShield(){
    shieldActive=false;
    shieldTimerUI.style.display="none";
    clearTimeout(shieldTimeout); clearInterval(shieldTimerInterval);
}

// --- Animate ---
function animate(){
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if(mixer){
        if(gameStarted){mixer.timeScale += delta*0.05;if(mixer.timeScale>maxSpeed)mixer.timeScale=maxSpeed;}
        mixer.update(delta);
    }

    if(player && gameStarted && !gameOver){
        const targetX = lanes[currentLane];
        player.position.x += (targetX-player.position.x)*0.1;
        speed = mixer ? mixer.timeScale*0.1 : minSpeed*0.1;

        // Zemin kaydır
        groundTexture.offset.y += speed*0.2;

        laneLines.forEach(line=>{
            line.position.z += speed;
            if(line.position.z>player.position.z+5) line.position.z-=(lineDashLength+lineGap)*(laneLines.length/2);
        });

        galleryPanelsLeft.forEach(p=>{
            p.position.z += speed;
            if(p.position.z>10) p.position.z-=GALLERY_COUNT_PER_SIDE*GALLERY_SPACING;
        });
        galleryPanelsRight.forEach(p=>{
            p.position.z += speed;
            if(p.position.z>10) p.position.z-=GALLERY_COUNT_PER_SIDE*GALLERY_SPACING;
        });

        // Obstacles
        for(let i=obstacles.length-1;i>=0;i--){
            const o=obstacles[i];
            o.position.z+=speed;
            if(o.position.z>5){scene.remove(o);obstacles.splice(i,1);}
            if(Math.abs(player.position.x-o.position.x)<1 && Math.abs(player.position.z-o.position.z)<1.5){
                hitSound.currentTime=0;hitSound.play();
                if(shieldActive){deactivateShield();scene.remove(o);obstacles.splice(i,1);}
                else{endGame();}
            }
        }


        // Milk
        for(let i=milkCartons.length-1;i>=0;i--){
            const m=milkCartons[i];
            m.position.z+=speed;
            if(m.position.z>5){scene.remove(m);milkCartons.splice(i,1);}
            if(Math.abs(player.position.x-m.position.x)<1 && Math.abs(player.position.z-m.position.z)<1){
                score+= m.userData.type==="bigMilk"?200:10;
                scoreBoard.innerText=`Score: ${score}`;
                scene.remove(m);milkCartons.splice(i,1);
                collectSound.currentTime=0;collectSound.play();
            }
        }

        // Powerups
        for(let i=powerUps.length-1;i>=0;i--){
            const p=powerUps[i];
            p.position.z+=speed;
            if(p.position.z>5){scene.remove(p);powerUps.splice(i,1);}
            if(Math.abs(player.position.x-p.position.x)<1 && Math.abs(player.position.z-p.position.z)<1){
                if(p.userData.type==="shield") activateShield();
                scene.remove(p);powerUps.splice(i,1);
                collectSound.currentTime=0;collectSound.play();
            }
        }
    }

    renderer.render(scene,camera);
}

init();
